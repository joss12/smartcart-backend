import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/auth.types";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  checkoutCart,
} from "../services/cart.service";

export async function addToCartHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId, qty } = req.body;
    const result = await addToCart({ userId: req.user!.id, productId, qty });
    if (result.type === "error") {
      return res.status(400).json({ ok: false, error: result.code });
    }
    return res.status(201).json({ ok: true, items: result.items });
  } catch (err) {
    next(err);
  }
}

export async function getCartHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const cart = await getCart(req.user!.id);
    return res.json({ ok: true, ...cart });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItemHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await updateCartItem({
      userId: req.user!.id,
      productId: req.params.productId as string,
      qty: req.body.qty,
    });
    if (result.type === "error") {
      return res.status(404).json({ ok: false, error: result.code });
    }
    return res.json({ ok: true, items: result.items });
  } catch (err) {
    next(err);
  }
}

export async function removeFromCartHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await removeFromCart({
      userId: req.user!.id,
      productId: req.params.productId as string,
    });
    if (result.type === "error") {
      return res.status(404).json({ ok: false, error: result.code });
    }
    return res.json({ ok: true, items: result.items });
  } catch (err) {
    next(err);
  }
}

export async function checkoutCartHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await checkoutCart({
      userId: req.user!.id,
      currency: req.body.currency,
    });
    if (result.type === "error") {
      return res.status(400).json({ ok: false, error: result.code });
    }
    return res.status(201).json({ ok: true, order: result.order });
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    if (msg.startsWith("PRODUCT_NOT_FOUND:")) {
      return res
        .status(404)
        .json({ ok: false, error: "PRODUCT_NOT_FOUND", details: msg });
    }
    if (msg.startsWith("INSUFFICIENT_STOCK:")) {
      return res
        .status(409)
        .json({ ok: false, error: "INSUFFICIENT_STOCK", details: msg });
    }
    next(err);
  }
}
