import { Router } from "express";
import { paymentWebhookHandler } from "../controllers/webhooks.controller";

export const webhooksRouter = Router();

webhooksRouter.post("/payment", paymentWebhookHandler);
