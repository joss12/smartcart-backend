import request from "supertest";
import { app } from "../src/server";
import { pool } from "../src/lib/db";
import jwt from "jsonwebtoken";

const mockQuery = pool.query as jest.Mock;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";

function makeToken(role: "admin" | "user" = "user") {
  return jwt.sign({ id: "user-123", role }, JWT_SECRET, { expiresIn: "1h" });
}

const mockOrder = {
  id: "order-123",
  user_id: "user-123",
  total_cents: 1999,
  currency: "USD",
  status: "created",
  created_at: new Date().toISOString(),
};

describe("POST /orders", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ items: [{ productId: "prod-123", qty: 1 }] });

    expect(res.status).toBe(401);
  });

  it("returns 400 for empty items", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing items", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });
});

describe("GET /orders/:id", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/orders/order-123");
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown order", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // getOrderById

    const token = makeToken();
    const res = await request(app)
      .get("/orders/nonexistent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("ORDER_NOT_FOUND");
  });

  it("returns order with items", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockOrder] }); // getOrderById
    mockQuery.mockResolvedValueOnce({ rows: [] }); // getOrderItems

    const token = makeToken();
    const res = await request(app)
      .get("/orders/order-123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.order.id).toBe("order-123");
  });
});
