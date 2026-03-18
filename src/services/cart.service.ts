import {
  getCartItems,
  setCartItems,
  clearCart,
} from "../repositories/cart.repository";
import { findProductById } from "../repositories/products.repository";
import { createOrder } from "./orders.service";

export async function addToCart(input: {
  userId: string;
  productId: string;
  qty: number;
}) {
  const product = await findProductById(input.productId);
  if (!product) return { type: "error", code: "PRODUCT_NOT_FOUND" } as const;
  if (input.qty < 1) return { type: "error", code: "INVALID_QTY" } as const;

  const items = await getCartItems(input.userId);
  const existing = items.find((i) => i.productId === input.productId);

  if (existing) {
    existing.qty += input.qty;
  } else {
    items.push({ productId: input.productId, qty: input.qty });
  }

  await setCartItems(input.userId, items);
  return { type: "success", items } as const;
}

export async function getCart(userId: string) {
  const items = await getCartItems(userId);
  if (items.length === 0) return { items: [], totalCents: 0 };

  const enriched = await Promise.all(
    items.map(async (item) => {
      const product = await findProductById(item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        name: product.name,
        qty: item.qty,
        unitPriceCents: product.price_cents,
        lineTotalCents: product.price_cents * item.qty,
        currency: product.currency,
      };
    }),
  );

  const valid = enriched.filter((i): i is NonNullable<typeof i> => i !== null);
  const totalCents = valid.reduce((sum, i) => sum + i.lineTotalCents, 0);

  return { items: valid, totalCents };
}

export async function updateCartItem(input: {
  userId: string;
  productId: string;
  qty: number;
}) {
  if (input.qty < 1) return { type: "error", code: "INVALID_QTY" } as const;

  const items = await getCartItems(input.userId);
  const existing = items.find((i) => i.productId === input.productId);
  if (!existing) return { type: "error", code: "ITEM_NOT_IN_CART" } as const;

  existing.qty = input.qty;
  await setCartItems(input.userId, items);
  return { type: "success", items } as const;
}

export async function removeFromCart(input: {
  userId: string;
  productId: string;
}) {
  const items = await getCartItems(input.userId);
  const filtered = items.filter((i) => i.productId !== input.productId);
  if (filtered.length === items.length) {
    return { type: "error", code: "ITEM_NOT_IN_CART" } as const;
  }
  await setCartItems(input.userId, filtered);
  return { type: "success", items: filtered } as const;
}

export async function checkoutCart(input: {
  userId: string;
  currency?: string;
}) {
  const items = await getCartItems(input.userId);
  if (items.length === 0) {
    return { type: "error", code: "CART_EMPTY" } as const;
  }

  const order = await createOrder({
    userId: input.userId,
    currency: input.currency,
    items,
  });

  await clearCart(input.userId);
  return { type: "success", order } as const;
}
