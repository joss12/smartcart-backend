import { pool } from "../lib/db";

export async function getStats() {
  const [users, orders, revenue, ordersToday, lowStock] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS total FROM users`),
    pool.query(`SELECT COUNT(*) AS total FROM orders`),
    pool.query(
      `SELECT COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE status = 'paid'`,
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE created_at >= now() - interval '24 hours'`,
    ),
    pool.query(
      `SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10`,
    ),
  ]);

  return {
    totalUsers: Number(users.rows[0].total),
    totalOrders: Number(orders.rows[0].total),
    totalRevenueCents: Number(revenue.rows[0].total),
    ordersToday: Number(ordersToday.rows[0].total),
    lowStockProducts: lowStock.rows,
  };
}

export async function listUsers(input: { limit: number; offset: number }) {
  const r = await pool.query(
    `SELECT id, email, role, email_verified, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [input.limit, input.offset],
  );
  const count = await pool.query(`SELECT COUNT(*) AS total FROM users`);
  return {
    items: r.rows,
    total: Number(count.rows[0].total),
  };
}

export async function updateUserRole(userId: string, role: "user" | "admin") {
  const r = await pool.query(
    `UPDATE users SET role = $2 WHERE id = $1
     RETURNING id, email, role, created_at`,
    [userId, role],
  );
  return r.rows[0] ?? null;
}
