import { redis } from "../lib/redis";
import { logAuditEvent } from "./audit.service";
import {
  insertProduct,
  listProducts,
  setProductStock,
  findProductById,
} from "../repositories/products.repository";

export async function createProduct(input: {
  actorUserId?: string | null;
  name: string;
  price_cents: number;
  currency?: string;
  description?: string;
}) {
  const product = await insertProduct(input);

  const keys = await redis.keys("products:list:*");
  if (keys.length > 0) await redis.del(keys);

  await logAuditEvent({
    eventType: "product.created",
    actorUserId: input.actorUserId ?? null,
    entityType: "product",
    entityId: product.id,
    metadata: {
      name: product.name,
      price_cents: product.price_cents,
    },
  });

  return product;
}

export async function getProducts(input: { limit: number; cursor?: string }) {
  const cacheKey = `products:list:limit=${input.limit}:cursor=${input.cursor ?? ""}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return { source: "cache" as const, ...JSON.parse(cached) };
  }

  const payload = await listProducts(input);

  await redis.set(cacheKey, JSON.stringify(payload), { EX: 60 });

  return { source: "db" as const, ...payload };
}

export async function updateInventory(input: {
  actorUserId?: string | null;
  productId: string;
  stock: number;
}) {
  const product = await setProductStock(input.productId, input.stock);
  if (!product) {
    return null;
  }

  await logAuditEvent({
    eventType: "inventory.updated",
    actorUserId: input.actorUserId ?? null,
    entityType: "product",
    entityId: input.productId,
    metadata: {
      stock: input.stock,
    },
  });

  return product;
}

export async function getProductById(productId: string) {
  return findProductById(productId);
}
