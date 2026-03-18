import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../utils/validateBody";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from "../controllers/auth.controller";
import {
  findUserByEmail,
  findUserByResetToken,
  findUserByVerifyToken,
  markEmailVerified,
  setResetToken,
  setVerifyToken,
  updatePassword,
} from "../repositories/users.repository";
import { sendMail } from "../lib/mailer";
import { hashPassword } from "../services/auth.service";
import {
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from "../controllers/audit.controller";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function sendVerificationEmail(user: {
  id: string;
  email: string;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await setVerifyToken(user.id, token, expires);

  const url = `${process.env.APP_URL}/auth/verify-email/${token}`;
  await sendMail({
    to: user.email,
    subject: "Verify your SmartCart email",
    html: `
      <h2>Welcome to SmartCart!</h2>
      <p>Click the link below to verify your email. It expires in 24 hours.</p>
      <a href="${url}">${url}</a>
    `,
  });
}

export async function verifyEmail(token: string) {
  const user = await findUserByVerifyToken(token);
  if (!user) return { type: "error", code: "INVALID_TOKEN" } as const;
  if (new Date() > new Date(user.verify_token_expires)) {
    return { type: "error", code: "TOKEN_EXPIRED" } as const;
  }
  await markEmailVerified(user.id);
  return { type: "success" } as const;
}

export async function forgotPassword(email: string) {
  const user = await findUserByEmail(email);
  // Always return success to avoid email enumeration
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await setResetToken(user.id, token, expires);

  const url = `${process.env.APP_URL}/auth/reset-password/${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your SmartCart password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. It expires in 1 hour.</p>
      <a href="${url}">${url}</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}) {
  const user = await findUserByResetToken(input.token);
  if (!user) return { type: "error", code: "INVALID_TOKEN" } as const;
  if (new Date() > new Date(user.reset_token_expires)) {
    return { type: "error", code: "TOKEN_EXPIRED" } as const;
  }
  const passwordHash = await hashPassword(input.newPassword);
  await updatePassword(user.id, passwordHash);
  return { type: "success" } as const;
}

authRouter.get("/verify-email/:token", verifyEmailHandler);

authRouter.post(
  "/forgot-password",
  validateBody(z.object({ email: z.string().email() })),
  forgotPasswordHandler,
);

authRouter.post(
  "/reset-password/:token",
  validateBody(z.object({ password: z.string().min(6).max(200) })),
  resetPasswordHandler,
);

authRouter.post("/register", validateBody(registerSchema), registerHandler);
authRouter.post("/login", validateBody(loginSchema), loginHandler);
authRouter.post("/refresh", validateBody(refreshSchema), refreshHandler);
authRouter.post("/logout", requireAuth, logoutHandler);
authRouter.get("/me", requireAuth, meHandler);
