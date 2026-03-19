import request from "supertest";
import { app } from "../src/server";

describe("GET /health/live", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("GET /health/ready", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
