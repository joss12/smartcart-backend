import request from "supertest";
import { app } from "../src/server";
import { pool } from "../src/lib/db";

const mockQuery = pool.query as jest.Mock;

const mockOrder = {
  id: "order-123",
  user_id: "user-123",
  total_cents: 1999,
  currency: "USD",
  status: "paid",
};

describe("POST /webhooks/payment", () => {
  it("returns 400 for missing webhook id", async () => {
    const res = await request(app)
      .post("/webhooks/payment")
      .send({ orderId: "order-123", status: "paid" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("WEBHOOK_ID_REQUIRED");
  });

  it("returns 401 for missing signature", async () => {
    const res = await request(app)
      .post("/webhooks/payment")
      .set("x-webhook-id", "evt-001")
      .send({ orderId: "order-123", status: "paid" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_WEBHOOK_SIGNATURE");
  });

  it("returns 401 for wrong signature", async () => {
    const res = await request(app)
      .post("/webhooks/payment")
      .set("x-webhook-signature", "wrong_secret")
      .set("x-webhook-id", "evt-001")
      .send({ orderId: "order-123", status: "paid" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_WEBHOOK_SIGNATURE");
  });

  it("returns 400 for unsupported status", async () => {
    const res = await request(app)
      .post("/webhooks/payment")
      .set(
        "x-webhook-signature",
        process.env.PAYMENT_WEBHOOK_SECRET ?? "super_secret_webhook_key",
      )
      .set("x-webhook-id", "evt-001")
      .send({ orderId: "order-123", status: "refunded" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNSUPPORTED_PAYMENT_STATUS");
  });

  it("returns already_processed for duplicate event", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "evt-001", provider_event_id: "evt-001" }],
    });

    const res = await request(app)
      .post("/webhooks/payment")
      .set(
        "x-webhook-signature",
        process.env.PAYMENT_WEBHOOK_SECRET ?? "super_secret_webhook_key",
      )
      .set("x-webhook-id", "evt-001")
      .send({ orderId: "order-123", status: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("already_processed");
  });

  it("processes valid payment and returns order", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [mockOrder] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/webhooks/payment")
      .set(
        "x-webhook-signature",
        process.env.PAYMENT_WEBHOOK_SECRET ?? "super_secret_webhook_key",
      )
      .set("x-webhook-id", "evt-002")
      .send({ orderId: "order-123", status: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.order.status).toBe("paid");
  });
});
