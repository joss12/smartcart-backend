import { pool } from "../lib/db";
import { orderQueue } from "../lib/queue";
import { logAuditEvent } from "./audit.service";
import {
  createOrderShell,
  lockProductForOrder,
  decrementProductStock,
  insertOrderItem,
  updateOrderTotal,
  getOrderById,
  getOrderItems,
  listOrdersByUser,
  cancelOrder,
} from "../repositories/orders.repository";

export async function createOrder(input: {
  userId: string;
  currency?: string;
  items: Array<{ productId: string; qty: number }>;
}) {
  const merged = new Map<string, number>();
  for (const it of input.items) {
    merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.qty);
  }

  const items = Array.from(merged.entries()).map(([productId, qty]) => ({
    productId,
    qty,
  }));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await createOrderShell(client, {
      userId: input.userId,
      currency: input.currency ?? null,
    });

    let totalCents = 0;

    for (const it of items) {
      const p = await lockProductForOrder(client, it.productId);
      if (!p) throw new Error(`PRODUCT_NOT_FOUND:${it.productId}`);
      if (p.currency !== order.currency) {
        throw new Error(`CURRENCY_MISMATCH:${p.currency}!=${order.currency}`);
      }
      if (p.stock < it.qty) {
        throw new Error(
          `INSUFFICIENT_STOCK:${p.id}:have=${p.stock}:need=${it.qty}`,
        );
      }

      await decrementProductStock(client, p.id, it.qty);

      const remainingStock = p.stock - it.qty;
      const lineTotal = p.price_cents * it.qty;
      totalCents += lineTotal;

      await insertOrderItem(client, {
        orderId: order.id,
        productId: p.id,
        qty: it.qty,
        unitPriceCents: p.price_cents,
        lineTotalCents: lineTotal,
      });

      if (remainingStock <= 2) {
        await orderQueue.add(
          "low-stock-alert",
          {
            productId: p.id,
            productName: p.name,
            remainingStock,
          },
          {
            attempts: 2,
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }
    }

    await updateOrderTotal(client, order.id, totalCents);
    await client.query("COMMIT");

    const { findUserById } = await import("../repositories/users.repository");
    const user = await findUserById(input.userId);

    await orderQueue.add(
      "order-confirmation",
      {
        orderId: order.id,
        userId: input.userId,
        userEmail: user?.email ?? "",
        totalCents,
        currency: order.currency,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    await logAuditEvent({
      eventType: "order.created",
      actorUserId: input.userId,
      entityType: "order",
      entityId: order.id,
      metadata: {
        totalCents,
        currency: order.currency,
      },
    });

    const savedItems = await getOrderItems(order.id);

    return {
      id: order.id,
      status: order.status,
      currency: order.currency,
      total_cents: totalCents,
      created_at: order.created_at,
      items: savedItems,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const items = await getOrderItems(orderId);
  return { ...order, items };
}

export async function getMyOrders(input: {
  userId: string;
  limit: number;
  cursor?: string;
}) {
  return listOrdersByUser(input);
}

export async function cancelMyOrder(input: {
  orderId: string;
  userId: string;
}) {
  const order = await cancelOrder(input.orderId, input.userId);
  if (!order) return null;

  await logAuditEvent({
    eventType: "order.cancelled",
    actorUserId: input.userId,
    entityType: "order",
    entityId: input.orderId,
    metadata: { totalCents: order.total_cents },
  });
  return order;
}
