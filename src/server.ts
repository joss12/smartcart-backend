import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { productsRouter } from "./products.routes";
import { aiRouter } from "./ai.routes";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "smartcart-api",
    time: new Date().toISOString(),
  });
});

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

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
