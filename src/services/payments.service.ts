import { orderQueue } from "../lib/queue";
import { logAuditEvent } from "./audit.service";
import { markOrderPaid } from "../repositories/orders.repository";
import {
  findWebhookEventByProviderId,
  insertWebhookEvent,
} from "../repositories/webhook-events.repository";

export async function processPaymentWebhook(input: {
  signature?: string | null;
  expectedSecret?: string | null;
  providerEventId: string;
  orderId: string;
  status: string;
}) {
  const signature = (input.signature ?? "").trim();
  const expected = (input.expectedSecret ?? "").trim();

  if (!expected) {
    return {
      type: "error",
      status: 500,
      code: "WEBHOOK_SECRET_NOT_SET",
    } as const;
  }

  if (!signature || signature !== expected) {
    return {
      type: "error",
      status: 401,
      code: "INVALID_WEBHOOK_SIGNATURE",
    } as const;
  }

  if (input.status !== "paid") {
    return {
      type: "error",
      status: 400,
      code: "UNSUPPORTED_PAYMENT_STATUS",
    } as const;
  }

  const existing = await findWebhookEventByProviderId(input.providerEventId);
  if (existing) {
    return {
      type: "already_processed",
      event: existing,
    } as const;
  }

  const order = await markOrderPaid(input.orderId);
  if (!order) {
    return {
      type: "error",
      status: 404,
      code: "ORDER_NOT_FOUND_OR_ALREADY_PAID",
    } as const;
  }

  await orderQueue.add(
    "payment-received",
    {
      orderId: order.id,
      userId: order.user_id,
      totalCents: order.total_cents,
      currency: order.currency,
    },
    {
      attempts: 3,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  await logAuditEvent({
    eventType: "order.paid",
    entityType: "order",
    entityId: order.id,
    metadata: {
      source: "payment_webhook",
      totalCents: order.total_cents,
      providerEventId: input.providerEventId,
    },
  });

  await insertWebhookEvent({
    providerEventId: input.providerEventId,
    eventType: "payment.paid",
    payload: {
      orderId: input.orderId,
      status: input.status,
    },
  });

  return { type: "success", order } as const;
}
