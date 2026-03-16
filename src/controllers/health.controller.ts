import type { Request, Response } from "express";
import { pool } from "../lib/db";
import { redis } from "../lib/redis";

export function liveHandler(_req: Request, res: Response) {
  res.json({
    ok: true,
    service: "smartcart-api",
    status: "alive",
    time: new Date().toISOString(),
  });
}

export async function readyHandler(_req: Request, res: Response) {
  try {
    await pool.query("SELECT 1");

    if (!redis.isOpen) {
      return res.status(503).json({ ok: false, error: "REDIS_NOT_READY" });
    }

    res.json({
      ok: true,
      service: "smartcart-api",
      status: "ready",
      postgres: "ok",
      redis: "ok",
      time: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      ok: false,
      error: "DEPENDENCY_FAILURE",
    });
  }
}
