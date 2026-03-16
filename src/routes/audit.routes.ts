import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { listAuditLogsHandler } from "../controllers/audit.controller";

export const auditRouter = Router();

auditRouter.get("/", requireAuth, requireAdmin, listAuditLogsHandler);
