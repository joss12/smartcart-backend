import { pool } from "../lib/db";

export async function insertProduct(input: {
  name: string;
  price_cents: number;
  currency?: string;
  description?: string;
}) {
  const r = await pool.query(
    `
    INSERT INTO products (name, price_cents, currency, description)
    VALUES ($1, $2, COALESCE($3, 'USD'), $4)
    RETURNING id, name, price_cents, currency, description, stock, created_at
    `,
    [
      input.name,
      input.price_cents,
      input.currency ?? null,
      input.description ?? null,
    ],
  );

  return r.rows[0];
}

export async function listProducts(input: { limit: number; cursor?: string }) {
  const params: any[] = [];
  let where = "";

  if (typeof input.cursor === "string" && input.cursor.trim().length > 0) {
    params.push(input.cursor);
    where = `WHERE created_at < $${params.length}::timestamptz`;
  }

  params.push(input.limit);

  const r = await pool.query(
    `
    SELECT id, name, price_cents, currency, description, stock, created_at
    FROM products
    ${where}
    ORDER BY created_at DESC
    LIMIT $${params.length}
    `,
    params,
  );

  return {
    items: r.rows,
    nextCursor: r.rows.length ? r.rows[r.rows.length - 1].created_at : null,
  };
}

export async function setProductStock(productId: string, stock: number) {
  const r = await pool.query(
    `UPDATE products SET stock = $2, updated_at = now() WHERE id = $1 RETURNING id, stock`,
    [productId, stock],
  );
  return r.rows[0] ?? null;
}

export async function findProductById(productId: string) {
  const r = await pool.query(
    `SELECT id, name, price_cents, currency, description, stock, created_at FROM products WHERE id = $1`,
    [productId],
  );
  return r.rows[0] ?? null;
}
