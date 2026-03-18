import { Router } from "express";
import { pool } from "./lib/db";
import { isInt, isNonEmptyString } from "./validate";
import { requireAdmin, requireAuth } from "./middleware/auth.middleware";

export const inventoryRouter = Router();

// POST /inventory/set, body: {productId, stock}

inventoryRouter.post(
  "/set",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { productId, stock } = req.body ?? {};

      if (!isNonEmptyString(productId)) {
        return res
          .status(400)
          .json({ ok: false, error: "productId is required" });
      }
      if (!isInt(stock) || stock < 0) {
        return res
          .status(400)
          .json({ ok: false, error: "stock must be a non-negative integer" });
      }

      const r = await pool.query(
        `UPDATE products SET stock = $2, updated_at = now() WHERE id = $1 RETURNING id, stock`,
        [productId, stock],
      );

      if (r.rows.length === 0) {
        return res.status(404).json({ ok: false, error: "product not found" });
      }
      res.json({ ok: true, product: r.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);
