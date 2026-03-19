import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import {
  getStatsHandler,
  getUsersHandler,
  updateUserRoleHandler,
} from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.get("/stats", requireAuth, requireAdmin, getStatsHandler);
adminRouter.get("/users", requireAuth, requireAdmin, getUsersHandler);
adminRouter.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  updateUserRoleHandler,
);
