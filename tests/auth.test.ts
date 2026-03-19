import request from "supertest";
import { app } from "../src/server";
import { pool } from "../src/lib/db";

const mockQuery = pool.query as jest.Mock;

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  role: "user",
  email_verified: false,
  created_at: new Date().toISOString(),
};

describe("POST /auth/register", () => {
  it("creates a new user and returns 201", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  it("returns 409 if email already exists", async () => {
    mockQuery.mockRejectedValueOnce({ code: "23505" });

    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("EMAIL_EXISTS");
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "not-an-email",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for short password", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });
});

describe("POST /auth/login", () => {
  it("returns 401 for unknown email", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_CREDENTIALS");
  });

  it("returns 400 for missing fields", async () => {
    const res = await request(app).post("/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });
});

describe("POST /auth/forgot-password", () => {
  it("always returns 200 regardless of email existence", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/auth/forgot-password").send({
      email: "nobody@example.com",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
