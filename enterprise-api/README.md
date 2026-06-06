# Enterprise REST API — Node.js + Express.js

A production-ready, enterprise-grade backend foundation following MVC architecture with clean separation of concerns.

---

## Project Structure

```
enterprise-api/
├── .env                          # Local environment variables (not committed)
├── .env.example                  # Safe template to commit
├── .gitignore
├── package.json
├── logs/                         # Auto-created at runtime
│   ├── combined-YYYY-MM-DD.log
│   └── error-YYYY-MM-DD.log
└── src/
    ├── server.js                 # ① Process entry point — starts HTTP server
    ├── app.js                    # ② Express app factory — mounts all middleware
    │
    ├── config/
    │   └── index.js              # ③ Centralised env-var config (frozen object)
    │
    ├── routes/
    │   ├── index.js              # ④ Aggregates all route modules
    │   ├── health.routes.js      #    Liveness + readiness probes
    │   └── user.routes.js        #    User CRUD routes
    │
    ├── controllers/
    │   └── user.controller.js    # ⑤ HTTP layer — extracts req data, calls service
    │
    ├── services/
    │   └── user.service.js       # ⑥ Business logic — no HTTP knowledge
    │
    ├── validators/
    │   └── user.validator.js     # ⑦ Joi schemas for every endpoint
    │
    ├── middlewares/
    │   ├── requestId.middleware.js       # Stamps every request with UUID
    │   ├── requestLogger.middleware.js   # HTTP access log via Morgan → Winston
    │   ├── validate.middleware.js        # Joi validation factory
    │   ├── notFound.middleware.js        # 404 handler (after all routes)
    │   └── errorHandler.middleware.js    # Global error handler (always last)
    │
    └── utils/
        ├── logger.js             # Winston structured logger + daily rotation
        ├── ApiResponse.js        # Standardised response envelope
        ├── AppError.js           # Custom error class with HTTP status
        └── catchAsync.js         # Wraps async handlers — forwards errors to next()
```

---

## Installation

```bash
# 1. Clone or copy the project
cd enterprise-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET and any DB credentials

# 4. Create logs directory (auto-created on first run too)
mkdir -p logs
```

---

## Running the Server

```bash
# Development (auto-restart on file changes)
npm run dev

# Development with full debug output
npm run dev:debug

# Production
npm start

# Linting
npm run lint
npm run lint:fix
```

---

## API Endpoints

All routes are prefixed with `/api/v1`.

| Method | URL                    | Description              |
|--------|------------------------|--------------------------|
| GET    | `/health/live`         | Liveness probe           |
| GET    | `/health/ready`        | Readiness + uptime info  |
| GET    | `/users`               | List users (paginated)   |
| POST   | `/users`               | Create user              |
| GET    | `/users/:id`           | Get user by ID           |
| PUT    | `/users/:id`           | Update user              |
| DELETE | `/users/:id`           | Delete user              |

### Query Parameters for GET /users

| Param    | Type   | Default     | Description                        |
|----------|--------|-------------|------------------------------------|
| `page`   | number | `1`         | Page number                        |
| `limit`  | number | `10`        | Items per page (max 100)           |
| `role`   | string | —           | Filter: `user`, `admin`, `moderator` |
| `search` | string | —           | Search by name or email            |
| `sortBy` | string | `createdAt` | Sort field                         |
| `order`  | string | `desc`      | `asc` or `desc`                    |

---

## Response Envelope

Every response — success or error — uses the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [ ... ],
  "errors": null,
  "meta": {
    "requestId": "77901c3d-a6e6-401d-bbca-29531a211860",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "pagination": {
      "page": 1, "limit": 10,
      "totalItems": 2, "totalPages": 1,
      "hasNextPage": false, "hasPrevPage": false
    }
  }
}
```

**Validation error (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "errors": [
    { "field": "email",    "message": "Please provide a valid email address" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ],
  "meta": { "requestId": "...", "timestamp": "...", "version": "1.0.0" }
}
```

---

## Layer Communication Flow

```
HTTP Request
    │
    ▼
[server.js]          — binds port, handles OS signals
    │
    ▼
[app.js]             — helmet → cors → rateLimit → requestId → morgan
    │
    ▼
[routes/index.js]    — mounts /health and /users routers
    │
    ▼
[user.routes.js]     — validate(schema) → controller method
    │
    ▼
[user.controller.js] — extracts req data → calls UserService
    │
    ▼
[user.service.js]    — business logic → DB / in-memory store
    │
    ▼  (on error: throw AppError → next(err) → errorHandler)
    ▼
[user.controller.js] — ApiResponse.success(res, { data })
    │
    ▼
HTTP Response (standard envelope)
```

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| `app.js` separate from `server.js` | Allows Supertest to load the app without binding a port |
| `config/index.js` frozen object | Single source of truth for all env vars; fails fast on startup |
| `catchAsync` wrapper | Removes try/catch boilerplate; all async errors reach the global handler |
| `AppError.isOperational` flag | Distinguishes known client errors from unexpected bugs |
| `ApiResponse` utility | Guarantees every response has the same shape — one client handler |
| Service layer has no HTTP knowledge | Services are testable without Express, reusable from workers/CLI |
| Morgan → Winston stream | Single log destination for both HTTP access and app logs |
| `res.locals.requestId` | Request ID flows through the entire middleware chain without modifying `req` |

---

## Testing with curl

```bash
# List users
curl http://localhost:3000/api/v1/users

# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Vishal","email":"v@example.com","password":"Secret123","role":"user"}'

# Get by ID
curl http://localhost:3000/api/v1/users/<id>

# Update
curl -X PUT http://localhost:3000/api/v1/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"name":"Vishal Updated"}'

# Delete
curl -X DELETE http://localhost:3000/api/v1/users/<id>

# Health
curl http://localhost:3000/api/v1/health/ready
```
