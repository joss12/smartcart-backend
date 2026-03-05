//import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool } from "./db";
import { productsRouter } from "./products.routes";
import { aiRouter } from "./ai.routes";
import { inventoryRouter } from "./inventory.routes";
import { ordersRouter } from "./orders.routes";
import { authRouter } from "./auth.routes";
import { requestLogger } from "./middleware/requestLogger";
import { requestId } from "./middleware/requestId";

import fs from "node:fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const app = express();
app.use(express.json());

const openapiText = fs.readFileSync("openapi.yaml", "utf8");
const openapiDoc = YAML.parse(openapiText);

app.use(helmet());
app.use(requestId);
app.use(requestLogger);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

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
app.use("/inventory", inventoryRouter);
app.use("/orders", ordersRouter);
app.use("/:id/pay", ordersRouter);
app.use("/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "ROUTE_NOT_FOUND",
    path: req.originalUrl,
  });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({
    ok: false,
    error: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? undefined
        : String(err?.message ?? err),
  });
});

export default app;
