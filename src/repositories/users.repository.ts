import { pool } from "../lib/db";

//export async function createUser(input: {
//  email: string;
//  passwordHash: string;
//}) {
//  const r = await pool.query(
//    `INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id,email,role,created_at`,
//    [input.email, input.passwordHash],
//  );
//  return r.rows[0];
//}
//
//export async function findUserByEmail(email: string) {
//  const r = await pool.query(
//    `SELECT id,email,password_hash,role,created_at FROM users WHERE email=$1`,
//    [email],
//  );
//  return r.rows[0] ?? null;
//}
//
//export async function findUserById(id: string) {
//  const r = await pool.query(
//    `SELECT id,email,role,created_at FROM users WHERE id=$1`,
//    [id],
//  );
//  return r.rows[0] ?? null;
//}

export async function createUser(input: {
  email: string;
  passwordHash: string;
}) {
  const r = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1,$2)
     RETURNING id, email, role, email_verified, created_at`,
    [input.email, input.passwordHash],
  );
  return r.rows[0];
}

export async function findUserByEmail(email: string) {
  const r = await pool.query(
    `SELECT id, email, password_hash, role, email_verified, created_at
     FROM users WHERE email=$1`,
    [email],
  );
  return r.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const r = await pool.query(
    `SELECT id, email, role, email_verified, created_at
     FROM users WHERE id=$1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function setVerifyToken(
  userId: string,
  token: string,
  expires: Date,
) {
  await pool.query(
    `UPDATE users SET verify_token=$2, verify_token_expires=$3 WHERE id=$1`,
    [userId, token, expires],
  );
}

export async function findUserByVerifyToken(token: string) {
  const r = await pool.query(
    `SELECT id, email, verify_token_expires FROM users
     WHERE verify_token=$1`,
    [token],
  );
  return r.rows[0] ?? null;
}

export async function markEmailVerified(userId: string) {
  await pool.query(
    `UPDATE users
     SET email_verified=true, verify_token=NULL, verify_token_expires=NULL
     WHERE id=$1`,
    [userId],
  );
}

export async function setResetToken(
  userId: string,
  token: string,
  expires: Date,
) {
  await pool.query(
    `UPDATE users SET reset_token=$2, reset_token_expires=$3 WHERE id=$1`,
    [userId, token, expires],
  );
}

export async function findUserByResetToken(token: string) {
  const r = await pool.query(
    `SELECT id, email, reset_token_expires FROM users
     WHERE reset_token=$1`,
    [token],
  );
  return r.rows[0] ?? null;
}

export async function updatePassword(userId: string, passwordHash: string) {
  await pool.query(
    `UPDATE users
     SET password_hash=$2, reset_token=NULL, reset_token_expires=NULL
     WHERE id=$1`,
    [userId, passwordHash],
  );
}
