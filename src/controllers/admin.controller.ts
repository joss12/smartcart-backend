import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/auth.types";
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
} from "../services/admin.service";

export async function getStatsHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await getAdminStats();
    return res.json({ ok: true, stats });
  } catch (err) {
    next(err);
  }
}

export async function getUsersHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const result = await getAdminUsers({ page, limit });
    return res.json({ ok: true, ...result, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRoleHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ ok: false, error: "INVALID_ROLE" });
    }

    const user = await setUserRole({
      actorUserId: req.user!.id,
      targetUserId: req.params.id as string,
      role,
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });
    }

    return res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}
