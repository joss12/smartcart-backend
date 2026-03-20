import { pool } from "../lib/db";

export async function createOrderShell(
  client: any,
  input: {
    userId: string;
    currency?: string | null;
  },
) {
  const r = await client.query(
    `
    INSERT INTO orders (user_id, status, total_cents, currency)
    VALUES ($1, 'created', 0, COALESCE($2,'USD'))
    RETURNING id, user_id, currency, status, created_at
    `,
    [input.userId, input.currency ?? null],
  );
  return r.rows[0];
}

export async function lockProductForOrder(client: any, productId: string) {
  const r = await client.query(
    `
    SELECT id, name, price_cents, currency, stock
    FROM products
    WHERE id = $1
    FOR UPDATE
    `,
    [productId],
  );
  return r.rows[0] ?? null;
}

export async function decrementProductStock(
  client: any,
  productId: string,
  qty: number,
) {
  await client.query(
    `UPDATE products SET stock = stock - $2, updated_at = now() WHERE id = $1`,
    [productId, qty],
  );
}

export async function insertOrderItem(
  client: any,
  input: {
    orderId: string;
    productId: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  },
) {
  await client.query(
    `
    INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, line_total_cents)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      input.orderId,
      input.productId,
      input.qty,
      input.unitPriceCents,
      input.lineTotalCents,
    ],
  );
}

export async function updateOrderTotal(
  client: any,
  orderId: string,
  totalCents: number,
) {
  await client.query(`UPDATE orders SET total_cents = $2 WHERE id = $1`, [
    orderId,
    totalCents,
  ]);
}

export async function getOrderItems(orderId: string) {
  const r = await pool.query(
    `
    SELECT product_id, qty, unit_price_cents, line_total_cents
    FROM order_items
    WHERE order_id = $1
    ORDER BY id ASC
    `,
    [orderId],
  );
  return r.rows;
}

export async function getOrderById(orderId: string) {
  const r = await pool.query(
    `
    SELECT id, status, total_cents, currency, created_at, user_id
    FROM orders
    WHERE id = $1
    `,
    [orderId],
  );
  return r.rows[0] ?? null;
}

export async function listOrdersByUser(input: {
  userId: string;
  limit: number;
  cursor?: string;
}) {
  const params: any[] = [input.userId];
  let where = `WHERE user_id = $1`;

  if (input.cursor) {
    params.push(input.cursor);
    where += ` AND created_at < $${params.length}::timestamptz`;
  }

  params.push(input.limit);
  const r = await pool.query(
    `SELECT id, status, total_cents, currency, created_at
     FROM orders
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return {
    items: r.rows,
    nextCursor:
      r.rows.length === input.limit
        ? r.rows[r.rows.length - 1].created_at
        : null,
  };
}

export async function markOrderPaid(orderId: string) {
  const r = await pool.query(
    `
    UPDATE orders
    SET status = 'paid'
    WHERE id = $1 AND status = 'created'
    RETURNING id, user_id, total_cents, currency, status
    `,
    [orderId],
  );
  return r.rows[0] ?? null;
}

export async function cancelOrder(orderId: string, userId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    //Lock the order, only cancel if it belongs to user and is in 'create' status
    const r = await client.query(
      `UPDATE orders SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'created'
       RETURNING id, user_id, total_cents, currency, status`,
      [orderId, userId],
    );

    const order = r.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return null;
    }

    //Restore stock for each item
    const items = await client.query(
      `SELECT product_id, qty FROM order_items WHERE order_id = $1`,
      [orderId],
    );
    for (const item of items.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $2, updated_at = now() WHERE id = $1`,
        [item.product_id, item.qty],
      );
    }
    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
