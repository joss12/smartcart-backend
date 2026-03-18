import { Router } from "express";
import { generateProductDescription } from "./ai";
import { pool } from "./lib/db";
import { isNonEmptyString } from "./validate";

export const aiRouter = Router();

const aiEnabled = (process.env.AI_ENABLED ?? "true").toLowerCase() === "true";

aiRouter.post("/generate-description", async (req, res, next) => {
  try {
    const { productId, features } = req.body ?? {};

    if (!isNonEmptyString(productId)) {
      return res
        .status(400)
        .json({ ok: false, error: "productID is required" });
    }
    if (
      !Array.isArray(features) ||
      features.some((f) => typeof f !== "string" || f.trim().length === 0)
    ) {
      return res
        .status(400)
        .json({ lok: false, error: "features be a non-empty string[]" });
    }
    if (!aiEnabled) {
      return res.status(503).json({ ok: false, error: "AI_DISABLED" });
    }
    const p = await pool.query(`SELECT id, name FROM products WHERE id = $1`, [
      productId,
    ]);

    if (p.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "product not found" });
    }

    const product = p.rows[0];

    const ai = await generateProductDescription({
      name: product.name,
      features: features.map((s: string) => s.trim()),
    });

    const newDesc =
      `${ai.description}\n\n` +
      (Array.isArray(ai.bullets)
        ? ai.bullets.map((b) => `- ${b}`).join("\n")
        : "");

    const updated = await pool.query(
      `UPDATE products
      SET description = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, name, price_cents, currency, description, created_at, updated_at
        `,
      [productId, newDesc],
    );

    res.json({ ok: true, ai, product: updated.rows[0] });
  } catch (err) {
    next(err);
  }
});
