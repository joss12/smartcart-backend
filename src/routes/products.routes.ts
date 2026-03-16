import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateBody } from "../utils/validateBody";
import {
  listProductsHandler,
  createProductHandler,
  setInventoryHandler,
} from "../controllers/products.controller";

export const productsRouter = Router();

const createProductSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(200),
  price_cents: z.number().int().min(0),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  description: z.string().max(2000).optional(),
});

const setInventorySchema = z.object({
  productId: z.string().uuid(),
  stock: z.number().int().min(0),
});

productsRouter.get("/", listProductsHandler);

productsRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createProductSchema),
  createProductHandler,
);

productsRouter.post(
  "/inventory/set",
  requireAuth,
  requireAdmin,
  validateBody(setInventorySchema),
  setInventoryHandler,
);
