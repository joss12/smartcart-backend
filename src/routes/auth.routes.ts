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

authRouter.post("/register", validateBody(registerSchema), registerHandler);
authRouter.post("/login", validateBody(loginSchema), loginHandler);
authRouter.post("/refresh", validateBody(refreshSchema), refreshHandler);
authRouter.post("/logout", requireAuth, logoutHandler);
authRouter.get("/me", requireAuth, meHandler);
