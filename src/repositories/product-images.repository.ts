import { pool } from "../lib/db";

export async function insertProductImage(input: {
  productId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const r = await pool.query(
    `
    INSERT INTO product_images
    (
      product_id,
      filename,
      original_name,
      mime_type,
      size_bytes
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      input.productId,
      input.filename,
      input.originalName,
      input.mimeType,
      input.sizeBytes,
    ],
  );

  return r.rows[0];
}
