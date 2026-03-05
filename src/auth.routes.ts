import { Router } from "express";
import { pool } from "./db";
import { hashPssword, verifyPassword, signToken } from "./auth";
import { AuthedRequest, requireAuth } from "./auth.middleware";

export const authRouter = Router();

//Register
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "email and password required" });
    }
    const hash = await hashPssword(password);

    const userInfo = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1,$2)
       RETURNING id,email,role`,
      [email, hash],
    );

    res.status(201).json({
      ok: true,
      user: userInfo.rows[0],
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ ok: false, error: "EMAIL_EXISTS" });
    }
    next(err);
  }
});

//Login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    const userInfo = await pool.query(
      `SELECT id,email,password_hash,role FROM users WHERE email=$1`,
      [email],
    );

    if (userInfo.rows.length === 0) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }

    const user = userInfo.rows[0];

    const ok = await verifyPassword(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
    });

    res.json({
      ok: true,
      token,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userInfo = await pool.query(
      `SELECT id, email, role, created_at FROM users WHERE id = $1`,
      [req.user!!.id],
    );
    res.json({ ok: true, user: userInfo.rows[0] });
  } catch (err) {
    next(err);
  }
});
