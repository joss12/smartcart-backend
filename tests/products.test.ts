import request from "supertest";
import { app } from "../src/server";

describe("Products API", () => {
  it("should list products", async () => {
    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
