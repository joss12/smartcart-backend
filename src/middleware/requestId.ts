import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = crypto.randomUUID();
  res.setHeader("x-request-id", id);
  next();
}
