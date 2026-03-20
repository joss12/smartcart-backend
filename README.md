# SmartCart API

A production-ready e-commerce backend built with Node.js, TypeScript, PostgreSQL, and Redis. Features a full order lifecycle, payment webhook processing, background job queues, and transactional email.

**Live API:** https://smartcart-backend-i1zg.onrender.com  
**Swagger Docs:** https://smartcart-backend-i1zg.onrender.com/docs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (NeonDB) |
| Cache | Redis (Upstash) |
| Queue | BullMQ |
| Email | Nodemailer + Gmail |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Logging | Pino |
| Testing | Jest + Supertest |
| Docs | Swagger UI (OpenAPI 3.0) |
| Hosting | Render |

---

## Architecture
```
Client
  │
  ▼
Express API (controllers → services → repositories)
  │
  ├── PostgreSQL (NeonDB)   — users, products, orders, audit logs
  ├── Redis (Upstash)       — cart storage, product list cache
  └── BullMQ Worker         — order confirmation, payment emails, image processing
```

---

## Features

**Auth**
- Register, login, logout with JWT access + refresh tokens
- Email verification on registration
- Password reset via email token

**Products**
- List with cursor-based pagination and Redis caching
- Single product lookup
- Admin: create, set stock, upload images

**Cart**
- Redis-backed ephemeral cart (7-day TTL)
- Add, update, remove items
- Checkout → creates order and clears cart

**Orders**
- Create directly or via cart checkout
- Pessimistic locking to prevent overselling
- View own orders with cursor-based pagination
- Cancel order with automatic stock restoration

**Payments**
- Webhook endpoint with signature validation
- Idempotency via `webhook_events` table — no double processing
- BullMQ job enqueued on payment received

**Admin**
- Platform stats (revenue, orders, low stock alerts)
- User management with role promotion/demotion
- Audit log of all system events

**Worker**
- Order confirmation emails
- Payment received emails
- Product image resizing (thumbnail + small via Sharp)
- Low stock alerts

---

## Project Structure
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Database queries
├── routes/          # Express routers
├── middleware/       # Auth, error handling, request ID
├── lib/             # DB, Redis, queue, logger, mailer
└── worker.ts        # BullMQ worker process
migrations/          # SQL migration files
tests/               # Jest + Supertest tests
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (NeonDB recommended)
- Redis instance (Upstash recommended)
- Gmail account with App Password

### Setup
```bash
# Clone the repo
git clone https://github.com/joss12/smartcart-backend.git
cd smartcart-backend

# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Run migrations
pnpm migrate

# Start development server
pnpm dev

# Start worker (separate terminal)
pnpm worker
```

### Run Tests
```bash
pnpm test
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health/live | — | Liveness check |
| GET | /health/ready | — | Readiness check |
| POST | /auth/register | — | Register new user |
| POST | /auth/login | — | Login |
| POST | /auth/refresh | — | Refresh access token |
| GET | /auth/verify-email/:token | — | Verify email |
| POST | /auth/forgot-password | — | Request password reset |
| POST | /auth/reset-password/:token | — | Reset password |
| GET | /products | — | List products |
| GET | /products/:id | — | Get product |
| POST | /products | Admin | Create product |
| POST | /products/inventory/set | Admin | Set stock |
| POST | /products/:id/images | Admin | Upload image |
| GET | /cart | User | Get cart |
| POST | /cart/items | User | Add to cart |
| PATCH | /cart/items/:productId | User | Update qty |
| DELETE | /cart/items/:productId | User | Remove item |
| POST | /cart/checkout | User | Checkout |
| POST | /orders | User | Create order |
| GET | /orders/my/orders | User | My orders |
| GET | /orders/:id | User | Get order |
| PATCH | /orders/:id/cancel | User | Cancel order |
| POST | /webhooks/payment | — | Payment webhook |
| GET | /admin/stats | Admin | Platform stats |
| GET | /admin/users | Admin | List users |
| PATCH | /admin/users/:id/role | Admin | Update role |
| GET | /audit | Admin | Audit log |

---

## Environment Variables

See `.env.example` for all required variables.

---

