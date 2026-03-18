import { redis } from "../lib/redis";

const TTL = 60 * 60 * 24 * 7; // 7

function cartKey(userId: string) {
  return `cart:${userId}`;
}

export async function getCartItems(
  userId: string,
): Promise<Array<{ productId: string; qty: number }>> {
  const raw = await redis.get(cartKey(userId));
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function setCartItems(
  userId: string,
  items: Array<{ productId: string; qty: number }>,
): Promise<void> {
  if (items.length === 0) {
    await redis.del(cartKey(userId));
    return;
  }
  await redis.set(cartKey(userId), JSON.stringify(items), { EX: TTL });
}
export async function clearCart(userId: string): Promise<void> {
  await redis.del(cartKey(userId));
}
