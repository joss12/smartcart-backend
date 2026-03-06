import request from "supertest";
import { app } from "../src/server";

describe("Health endpoint", () => {
  it("should return ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
