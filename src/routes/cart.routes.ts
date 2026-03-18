import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  addToCartHandler,
  getCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  checkoutCartHandler,
} from "../controllers/cart.controller";

export const cartRouter = Router();

cartRouter.post("/items", requireAuth, addToCartHandler);
cartRouter.get("/", requireAuth, getCartHandler);
cartRouter.patch("/items/:productId", requireAuth, updateCartItemHandler);
cartRouter.delete("/items/:productId", requireAuth, removeFromCartHandler);
cartRouter.post("/checkout", requireAuth, checkoutCartHandler);
