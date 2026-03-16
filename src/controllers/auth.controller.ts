import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/auth.types";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  me,
} from "../services/auth.service";

export async function registerHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;
    const user = await register({ email, password });
    return res.status(201).json({ ok: true, user });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "EMAIL_EXISTS" });
    }
    next(err);
  }
}

export async function loginHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;
    const tokens = await login({ email, password });

    if (!tokens) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }

    return res.json({ ok: true, ...tokens });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return res
        .status(400)
        .json({ ok: false, error: "REFRESH_TOKEN_REQUIRED" });
    }

    const result = await refreshAccessToken(refreshToken);
    if (!result) {
      return res
        .status(401)
        .json({ ok: false, error: "INVALID_REFRESH_TOKEN" });
    }

    return res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await logout(req.user!.id);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await me(req.user!.id);
    return res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}
