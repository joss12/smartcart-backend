import type { Request, Response, NextFunction } from "express";
import { processPaymentWebhook } from "../services/payments.service";

export async function paymentWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { orderId, status } = req.body ?? {};
    const providerEventId = req.header("x-webhook-id");

    if (!providerEventId) {
      return res.status(400).json({
        ok: false,
        error: "WEBHOOK_ID_REQUIRED",
      });
    }

    if (!orderId || !status) {
      return res.status(400).json({
        ok: false,
        error: "orderId and status are required",
      });
    }

    const result = await processPaymentWebhook({
      signature: req.header("x-webhook-signature"),
      expectedSecret: process.env.PAYMENT_WEBHOOK_SECRET,
      providerEventId,
      orderId,
      status,
    });

    if (result.type === "error") {
      return res.status(result.status).json({
        ok: false,
        error: result.code,
      });
    }

    if (result.type === "already_processed") {
      return res.json({
        ok: true,
        status: "already_processed",
      });
    }

    return res.json({
      ok: true,
      order: result.order,
    });
  } catch (err) {
    next(err);
  }
}
