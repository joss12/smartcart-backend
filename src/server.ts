//import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { productsRouter } from "./products.routes";
import { aiRouter } from "./ai.routes";
import { inventoryRouter } from "./inventory.routes";
import { ordersRouter } from "./orders.routes";

const app = express();
app.use(express.json());

app.get("/db/ping", async (_req, res) => {
  const result = await pool.query("SELECT NOW() as now");
  res.json({ ok: true, now: result.rows[0].now });
});

app.get("/db/products-count", async (_req, res) => {
  const r = await pool.query("SELECT COUNT(*)::int as count FROM products");
  res.json({ ok: true, count: r.rows[0].count });
});

app.use("/products", productsRouter);
app.use("/ai", aiRouter);
app.use("/inventory", inventoryRouter);
app.use("/orders", ordersRouter);

export default app;
