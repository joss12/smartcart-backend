import request from "supertest";
import { app } from "../src/server";
import { pool } from "../src/lib/db";
import { redis } from "../src/lib/redis";
import jwt from "jsonwebtoken";

const mockQuery = pool.query as jest.Mock;
const mockRedisGet = redis.get as jest.Mock;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";

function makeToken(role: "admin" | "user" = "user") {
  return jwt.sign({ id: "user-123", role }, JWT_SECRET, { expiresIn: "1h" });
}

const mockProduct = {
  id: "prod-123",
  name: "Test Product",
  price_cents: 1999,
  currency: "USD",
  description: "A test product",
  stock: 50,
  created_at: new Date().toISOString(),
};

describe("GET /products", () => {
  it("returns product list from db", async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockQuery.mockResolvedValueOnce({ rows: [mockProduct] });

    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("returns product list from cache", async () => {
    mockRedisGet.mockResolvedValueOnce(
      JSON.stringify({ items: [mockProduct], nextCursor: null }),
    );

    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.source).toBe("cache");
  });
});

describe("POST /products", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).post("/products").send({
      name: "New Product",
      price_cents: 999,
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const token = makeToken("user");
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Product", price_cents: 999 });

    expect(res.status).toBe(403);
  });

  it("creates product as admin", async () => {
    const token = makeToken("admin");
    mockQuery.mockResolvedValueOnce({ rows: [mockProduct] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Product", price_cents: 1999 });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.product.name).toBe("Test Product");
  });

  it("returns 400 for missing price_cents", async () => {
    const token = makeToken("admin");
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "No Price" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });
});

describe("POST /products/inventory/set", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/products/inventory/set")
      .send({ productId: "2109193c-a7a1-46f7-b27d-f1b6a5249ba6", stock: 10 });

    expect(res.status).toBe(401);
  });

  it("sets stock as admin", async () => {
    const token = makeToken("admin");
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "2109193c-a7a1-46f7-b27d-f1b6a5249ba6", stock: 10 }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/products/inventory/set")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: "2109193c-a7a1-46f7-b27d-f1b6a5249ba6", stock: 10 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.product.stock).toBe(10);
  });
});
