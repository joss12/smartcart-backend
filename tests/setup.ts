// tests/setup.ts
process.env.PAYMENT_WEBHOOK_SECRET = "super_secret_webhook_key";

jest.mock("../src/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    isOpen: true,
    connect: jest.fn(),
  },
}));

jest.mock("../src/lib/db", () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock("../src/lib/queue", () => ({
  orderQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("../src/lib/mailer", () => ({
  sendMail: jest.fn().mockResolvedValue({}),
}));
