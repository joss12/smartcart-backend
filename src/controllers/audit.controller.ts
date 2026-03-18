import type { Request, Response, NextFunction } from "express";
import { getAuditLogs } from "../services/audit.service";
import { AuthedRequest } from "../types/auth.types";
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../routes/auth.routes";

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

export async function verifyEmailHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await verifyEmail(req.params.token as string);
    if (result.type === "error") {
      return res.status(400).json({ ok: false, error: result.code });
    }
    return res.json({ ok: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await forgotPassword(req.body.email);
    // Always return success to avoid email enumeration
    return res.json({
      ok: true,
      message: "If that email exists, a reset link has been sent",
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await resetPassword({
      token: req.params.token as string,
      newPassword: req.body.password,
    });
    if (result.type === "error") {
      return res.status(400).json({ ok: false, error: result.code });
    }
    return res.json({ ok: true, message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
}
