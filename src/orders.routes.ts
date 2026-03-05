import { Router } from "express";
import { pool } from "./db";
import { isInt, isNonEmptyString } from "./validate";
import { requireAuth, type AuthedRequest } from "./auth.middleware";

export const ordersRouter = Router();

type CreatedOrderBody = {
  currency?: string;
  items: Array<{ productId: string; qty: number }>;
};

ordersRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  const body = (req.body ?? {}) as CreatedOrderBody;

  try {
    //validate input
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "items must be a non-empty array" });
    }

    for (const it of body.items) {
      if (!isNonEmptyString(it.productId)) {
        return res
          .status(400)
          .json({ ok: false, error: "each itemp.productId id required" });
      }
      if (!isInt(it.qty) || it.qty <= 0) {
        return res.status(400).json({
          ok: false,
          error: "each item.qty must be a positve integer",
        });
      }
    }

    //Combine duplicates (same product twice)
    const merged = new Map<string, number>();
    for (const it of body.items) {
      merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.qty);
    }

    const items = Array.from(merged.entries()).map(([productId, qty]) => ({
      productId,
      qty,
    }));

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      //Create empty orderw first
      const orderRes = await client.query(
        `INSERT INTO orders (user_id, status, total_cents, currency)
   VALUES ($1, 'created', 0, COALESCE($2,'USD'))
   RETURNING id, user_id, currency, status, created_at`,
        [req.user!.id, body.currency ?? null],
      );

      const order = orderRes.rows[0] as {
        id: string;
        currency: string;
        status: string;
        created_at: string;
      };

      let totalCents = 0;

      // For looping the product: lock row, verify stock, decrement, create line item
      for (const it of items) {
        const pRes = await client.query(
          `SELECT id, name, price_cents, currency, stock
                    FROM products
                    WHERE id = $1
                    FOR UPDATE
                    `,
          [it.productId],
        );

        if (pRes.rows.length === 0) {
          throw new Error(`PRODUCT_NOT_FOUND:${it.productId}`);
        }

        const p = pRes.rows[0] as {
          id: string;
          name: string;
          price_cents: number;
          currency: string;
          stock: number;
        };

        if (p.currency !== order.currency) {
          throw new Error(`CURRENCY_MISMATCH:${p.currency}!=${order.currency}`);
        }

        if (p.stock < it.qty) {
          throw new Error(
            `INSUFFICIENT_STOCK:${p.id}:have=${p.stock}:need=${it.qty}`,
          );
        }

        //Decrement
        await client.query(
          `UPDATE products SET stock = stock - $2, updated_at = now() WHERE id = $1`,
          [p.id, it.qty],
        );

        const lineTotal = p.price_cents * it.qty;
        totalCents += lineTotal;

        await client.query(
          `
          INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, line_total_cents)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [order.id, p.id, it.qty, p.price_cents, lineTotal],
        );
      }

      //Update order total
      await client.query(`UPDATE orders SET total_cents = $2 WHERE id = $1`, [
        order.id,
        totalCents,
      ]);
      await client.query("COMMIT");

      //RETURN order summary
      const itemsRes = await pool.query(
        `
                SELECT product_id, qty, unit_price_cents, line_total_cents
                FROM order_items
                WHERE order_id = $1
                ORDER BY id ASC
                `,
        [order.id],
      );

      return res.status(201).json({
        ok: true,
        order: {
          id: order.id,
          status: order.status,
          currency: order.currency,
          total_cents: totalCents,
          created_at: order.created_at,
          items: itemsRes.rows,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    const msg = String(err?.message ?? "");

    if (msg.startsWith("PRODUCT_NOT_FOUND:")) {
      return res
        .status(404)
        .json({ ok: false, error: "PRODUCT_NOT_FOUND", details: msg });
    }
    if (msg.startsWith("INSUFFICIENT_STOCK:")) {
      return res
        .status(409)
        .json({ ok: false, error: "INSUFFICIENT_STOCK", details: msg });
    }
    if (msg.startsWith("CURRENCY_MISMATCH:")) {
      return res
        .status(400)
        .json({ ok: false, error: "CURRENCY_MISMATCH", details: msg });
    }
    return next(err);
  }
});

ordersRouter.get(
  "/my/orders",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const r = await pool.query(
        `SELECT id, status, total_cents, currency, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
        [req.user!.id],
      );

      res.json({ ok: true, items: r.rows });
    } catch (err) {
      next(err);
    }
  },
);

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `SELECT id, status, total_cents, currency, created_at
            FROM orders
            WHERE id = $1
            `,
      [id],
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "ORDER_NOT_FOUND" });
    }

    const itemsRes = await pool.query(
      `SELECT product_id, qty, unit_price_cents, line_total_cents
            FROM order_items
            WHERE order_id = $1
            ORDER BY id
            `,
      [id],
    );

    res.json({
      ok: true,
      order: {
        ...orderRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/pay", async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await pool.query(
      `UPDATE orders
            SET status = 'paid'
            WHERE id = $1 AND status = 'created'
            RETURNING id, status, total_cents, currency
            `,
      [id],
    );

    if (r.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "ORDER_NOT_PAYABLE",
      });
    }
    res.json({
      ok: true,
      order: r.rows[0],
    });
  } catch (err) {
    next(err);
  }
});
