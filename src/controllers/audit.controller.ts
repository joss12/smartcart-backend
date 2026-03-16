import type { Request, Response, NextFunction } from "express";
import { getAuditLogs } from "../services/audit.service";

export async function listAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await getAuditLogs(50);
    return res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
}
