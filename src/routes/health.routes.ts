import { Router } from "express";
import { liveHandler, readyHandler } from "../controllers/health.controller";

export const healthRouter = Router();

healthRouter.get("/live", liveHandler);
healthRouter.get("/ready", readyHandler);
