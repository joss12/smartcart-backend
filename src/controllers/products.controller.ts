import type { Response, NextFunction, Request } from "express";
import type { AuthedRequest } from "../types/auth.types";
import {
  createProduct,
  getProductById,
  getProducts,
  updateInventory,
} from "../services/products.service";

export async function listProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limitRaw = req.query.limit;
    const cursor = req.query.cursor;

    const limit = (() => {
      const n = Number(limitRaw ?? 20);
      if (!Number.isFinite(n)) return 20;
      return Math.max(1, Math.min(50, Math.floor(n)));
    })();

    const result = await getProducts({
      limit,
      cursor: typeof cursor === "string" ? cursor : undefined,
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function createProductHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, price_cents, currency, description } = req.body;

    const product = await createProduct({
      actorUserId: req.user?.id ?? null,
      name,
      price_cents,
      currency,
      description,
    });

    return res.status(201).json({ ok: true, product });
  } catch (err) {
    next(err);
  }
}

export async function setInventoryHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId, stock } = req.body;

    const product = await updateInventory({
      actorUserId: req.user?.id ?? null,
      productId,
      stock,
    });

    if (!product) {
      return res.status(404).json({ ok: false, error: "product not found" });
    }

    return res.json({ ok: true, product });
  } catch (err) {
    next(err);
  }
}

export async function getProductByIdHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await getProductById(req.params.id as string);
    if (!product) {
      return res.status(404).json({ ok: false, error: "PRODUCT_NOT_FOUND" });
    }
    return res.json({ ok: true, product });
  } catch (err) {
    next(err);
  }
}
