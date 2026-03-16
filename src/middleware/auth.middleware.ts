import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/auth.types";
import { verifyToken } from "../services/auth.service";

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization") ?? "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role as "user" | "admin" };
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "INVALID_TOKEN" });
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  }

  return next();
}
