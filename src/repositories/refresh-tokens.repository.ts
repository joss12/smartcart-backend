import { pool } from "../lib/db";

export async function insertRefreshToken(input: {
  userId: string;
  tokenHash: string;
}) {
  await pool.query(
    `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1,$2, now() + interval '7 days')
    `,
    [input.userId, input.tokenHash],
  );
}

export async function listRefreshTokensByUser(userId: string) {
  const r = await pool.query(
    `SELECT id, token_hash, expires_at FROM refresh_tokens WHERE user_id=$1`,
    [userId],
  );
  return r.rows;
}

export async function deleteRefreshTokensByUser(userId: string) {
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id=$1`, [userId]);
}
