import { pool } from "../lib/db";

export async function createUser(input: {
  email: string;
  passwordHash: string;
}) {
  const r = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id,email,role,created_at`,
    [input.email, input.passwordHash],
  );
  return r.rows[0];
}

export async function findUserByEmail(email: string) {
  const r = await pool.query(
    `SELECT id,email,password_hash,role,created_at FROM users WHERE email=$1`,
    [email],
  );
  return r.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const r = await pool.query(
    `SELECT id,email,role,created_at FROM users WHERE id=$1`,
    [id],
  );
  return r.rows[0] ?? null;
}
