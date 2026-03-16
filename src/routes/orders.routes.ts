import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../utils/validateBody";
import {
  createOrderHandler,
  getOrderHandler,
  myOrdersHandler,
  payOrderHandler,
} from "../controllers/orders.controller";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
});

ordersRouter.get("/my/orders", requireAuth, myOrdersHandler);
ordersRouter.get("/:id", requireAuth, getOrderHandler);
ordersRouter.post(
  "/",
  requireAuth,
  validateBody(createOrderSchema),
  createOrderHandler,
);
ordersRouter.post("/:id/pay", requireAuth, payOrderHandler);
