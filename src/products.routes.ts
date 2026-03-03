import { Router } from "express";
import { pool } from "./db";
import { isCurrency3, isInt, isNonEmptyString } from "./validate";

export const productsRouter = Router();

productsRouter.post("/", async (req, res, next) => {
  try {
    const { name, price_cents, currency, description } = req.body ?? {};

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }
    if (!isInt(price_cents) || price_cents < 0) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "price_cents must be a non-negative integer",
        });
    }
    if (currency !== undefined && !isCurrency3(currency)) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "currency must be 3 uppercase letters (e.g. USD)",
        });
    }
    if (description !== undefined && typeof description !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "description must be a string" });
    }

    const r = await pool.query(
      `
      INSERT INTO products (name, price_cents, currency, description)
      VALUES ($1, $2, COALESCE($3, 'USD'), $4)
      RETURNING id, name, price_cents, currency, description, created_at
      `,
      [name.trim(), price_cents, currency ?? null, description ?? null],
    );

    return res.status(201).json({ ok: true, product: r.rows[0] });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/", async (req, res, next) => {
  try {
    const limitRaw = req.query.limit;
    const cursor = req.query.cursor;

    const limit = (() => {
      const n = Number(limitRaw ?? 20);
      if (!Number.isFinite(n)) return 20;
      return Math.max(1, Math.min(50, Math.floor(n)));
    })();

    //cursor is an ISO date string(created_at)
    const params: any[] = [];
    let where = "";

    if (typeof cursor === "string" && cursor.trim().length > 0) {
      params.push(cursor);
      where = `WHERE created_at < $${params.length}::timestamptz`;
    }

    params.push(limit);

    const r = await pool.query(
      `
      SELECT id, name, price_cents, currency, description, created_at
      FROM products
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length}
      `,
      params,
    );

    const nextCursor = r.rows.length
      ? r.rows[r.rows.length - 1].created_at
      : null;
    res.json({ ok: true, items: r.rows, nextCursor });
  } catch (err) {
    next(err);
  }
});
