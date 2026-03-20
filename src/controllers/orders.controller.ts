import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/auth.types";
import {
  createOrder,
  getOrder,
  getMyOrders,
  cancelMyOrder,
} from "../services/orders.service";
import { markOrderPaid } from "../repositories/orders.repository";

export async function createOrderHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { currency, items } = req.body;

    const order = await createOrder({
      userId: req.user!.id,
      currency,
      items,
    });

    return res.status(201).json({ ok: true, order });
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
    if (msg.startsWith("CURRENCY_MISMATCH:")) {
      return res
        .status(400)
        .json({ ok: false, error: "CURRENCY_MISMATCH", details: msg });
    }
    next(err);
  }
}

export async function getOrderHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await getOrder(req.params.id as string);
    if (!order) {
      return res.status(404).json({ ok: false, error: "ORDER_NOT_FOUND" });
    }
    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

export async function myOrdersHandler(
  req: AuthedRequest,
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

    const result = await getMyOrders({
      userId: req.user!.id,
      limit,
      cursor: typeof cursor === "string" ? cursor : undefined,
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function payOrderHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await markOrderPaid(req.params.id as string);
    if (!order) {
      return res.status(400).json({ ok: false, error: "ORDER_NOT_PAYABLE" });
    }
    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrderHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await cancelMyOrder({
      orderId: req.params.id as string,
      userId: req.user!.id,
    });

    if (!order) {
      return res
        .status(400)
        .json({ ok: false, error: "ORDER_NOT_CANCELLABLE" });
    }
    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}
