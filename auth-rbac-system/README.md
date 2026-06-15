# Enterprise Authentication & RBAC System

A production-ready **Authentication & Role-Based Access Control (RBAC)** backend built with **Node.js, Express.js, MongoDB (Mongoose), JWT, and bcrypt**, following clean architecture principles (Controller → Service → Repository).

---

## 1. Project Architecture

This project follows a **layered / clean architecture**:

```
Request → Routes → Middleware (auth/validation/rbac) → Controller → Service → Repository → Mongoose Model → MongoDB
```

| Layer | Responsibility |
|---|---|
| **Routes** | Define endpoints, attach middleware (validation, auth, RBAC), and document them via Swagger JSDoc. |
| **Middleware** | Cross-cutting concerns: JWT verification, RBAC checks, request validation, rate limiting, logging, error handling. |
| **Controllers** | Thin HTTP layer — parse request, call services, format `ApiResponse`. No business logic. |
| **Services** | Core business logic (auth flows, token rotation, user management rules, RBAC privilege checks). |
| **Repositories** | Data-access layer — the only layer that talks to Mongoose models directly. |
| **Models** | Mongoose schemas (`User`, `RefreshToken`) with validation, hooks, and instance methods. |
| **Validators** | Joi schemas for request body/params/query validation. |
| **Utils** | Reusable helpers — `ApiError`, `ApiResponse`, `catchAsync`, JWT utilities, logger, cookie helpers. |

### Design principles applied
- **Single Responsibility** — each layer has one job.
- **Dependency direction** — Controllers depend on Services, Services depend on Repositories; never the reverse.
- **Open/Closed** — new roles/permissions can be added in `config/roles.js` without touching middleware logic.
- **DRY** — `catchAsync`, `ApiResponse`, and `ApiError` eliminate repetitive try/catch and response formatting.

---

## 2. Folder Structure

```
auth-rbac-system/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── env.js              # Centralized environment config
│   │   ├── roles.js             # Roles, role hierarchy, permissions
│   │   └── swagger.js           # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── report.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── token.service.js
│   │   └── email.service.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   └── refreshToken.repository.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── rbac.middleware.js       # Role/permission checks
│   │   ├── validate.middleware.js   # Joi validation
│   │   ├── error.middleware.js      # Centralized error handler
│   │   ├── rateLimiter.middleware.js
│   │   └── logger.middleware.js     # Morgan + Winston request logging
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── report.routes.js
│   │   └── index.js
│   ├── models/
│   │   ├── User.model.js
│   │   └── RefreshToken.model.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── user.validator.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── catchAsync.js
│   │   ├── jwt.util.js
│   │   ├── cookie.util.js
│   │   └── logger.js
│   ├── scripts/
│   │   └── seedSuperAdmin.js   # Creates the first SUPER_ADMIN account
│   ├── app.js                  # Express app (middleware + routes)
│   └── server.js               # Entry point (DB connect + listen)
├── logs/                        # Winston log files (gitignored)
├── .env.example
├── .gitignore
├── package.json
├── postman_collection.json
└── README.md
```

---

## 3. Database Models

### User Model (`src/models/User.model.js`)

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, 2–100 chars |
| `email` | String | Required, unique, lowercase, validated format |
| `password` | String | Required, hashed with bcrypt, `select: false` |
| `role` | String | Enum: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`; default `EMPLOYEE` |
| `isActive` | Boolean | Default `true` |
| `passwordChangedAt` | Date | Used to invalidate old access tokens |
| `passwordResetTokenHash` / `passwordResetExpires` | String / Date | For password reset flow |
| `failedLoginAttempts` / `lockUntil` | Number / Date | Account lockout after repeated failures |
| `createdAt` / `updatedAt` | Date | Auto-managed via `timestamps: true` |

Key behaviors:
- **Pre-save hook** hashes the password automatically when modified.
- `comparePassword()` — bcrypt comparison.
- `changedPasswordAfter(jwtIat)` — invalidates tokens issued before a password change.
- `isLocked()` — checks account lockout status.
- `toJSON` transform strips sensitive fields (`password`, reset tokens, etc.) from every API response.

### RefreshToken Model (`src/models/RefreshToken.model.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId (ref `User`) | Indexed |
| `token` | String | **SHA-256 hash** of the refresh token (raw token never stored) |
| `expiresAt` | Date | TTL index — MongoDB auto-deletes expired documents |
| `revoked` / `revokedAt` | Boolean / Date | For logout & rotation tracking |
| `replacedByToken` | String | Hash of the token that replaced this one (rotation chain) |
| `userAgent` / `ipAddress` | String | Session/device metadata |

---

## 4. Roles & Permissions

Defined centrally in `src/config/roles.js`:

```js
ROLES = { SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE }

ROLE_HIERARCHY = { SUPER_ADMIN: 4, ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 }

PERMISSIONS = {
  MANAGE_USERS:     [SUPER_ADMIN, ADMIN],
  MANAGE_EMPLOYEES: [SUPER_ADMIN, ADMIN, MANAGER],
  VIEW_REPORTS:     [SUPER_ADMIN, ADMIN, MANAGER],
  VIEW_OWN_PROFILE: [SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE],
  FULL_ACCESS:      [SUPER_ADMIN],
}
```

- `SUPER_ADMIN` automatically bypasses all role checks (full access).
- `ROLE_HIERARCHY` is used in `user.service.js` to **prevent privilege escalation** — e.g. an `ADMIN` cannot create/edit a `SUPER_ADMIN`, and a `MANAGER` cannot modify an `ADMIN`.

---

## 5. Middleware

| Middleware | Purpose |
|---|---|
| `authenticate` (`auth.middleware.js`) | Extracts JWT (Bearer header or cookie), verifies signature/expiry, loads the user, checks `isActive` and `changedPasswordAfter`, attaches `req.user`. |
| `authorize(...roles)` (`rbac.middleware.js`) | Restricts a route to specific roles. `SUPER_ADMIN` always passes. |
| `requirePermission(key)` (`rbac.middleware.js`) | Permission-based alternative to `authorize`, using the `PERMISSIONS` map. |
| `validate(schema, source)` (`validate.middleware.js`) | Validates `body`/`params`/`query` against a Joi schema; returns 400 with field-level errors. |
| `generalLimiter` / `authLimiter` (`rateLimiter.middleware.js`) | Express Rate Limit — general API limiter + stricter limiter on auth endpoints. |
| `requestLogger` (`logger.middleware.js`) | Morgan HTTP logs piped into Winston. |
| `errorHandler` / `notFoundHandler` (`error.middleware.js`) | Centralized error normalization & standardized JSON error responses. |

---

## 6. Controllers & Routes Summary

Base URL: `/api/v1` (configurable via `API_PREFIX`)

### Auth Routes (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user (EMPLOYEE/MANAGER only) |
| POST | `/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/auth/refresh-token` | Public (valid refresh token) | Rotates refresh token, issues new pair |
| POST | `/auth/logout` | Public | Revoke current refresh token |
| POST | `/auth/logout-all` | Private | Revoke all refresh tokens for the user |
| POST | `/auth/forgot-password` | Public | Sends password reset email |
| POST | `/auth/reset-password` | Public | Resets password using token |
| POST | `/auth/change-password` | Private | Change password (requires current password) |

### Profile & User Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/profile` | All authenticated roles | Get own profile |
| PATCH | `/profile` | All authenticated roles | Update own name |
| GET | `/users` | SUPER_ADMIN, ADMIN | List users (paginated, filterable) |
| GET | `/users/:id` | SUPER_ADMIN, ADMIN | Get user by id |
| POST | `/users` | SUPER_ADMIN, ADMIN | Create user |
| PATCH | `/users/:id` | SUPER_ADMIN, ADMIN | Update user (role/isActive/name/email) |
| DELETE | `/users/:id` | SUPER_ADMIN, ADMIN | Delete user |

### Reports
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reports` | SUPER_ADMIN, ADMIN, MANAGER | Aggregate user/role statistics |

### Misc
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| GET | `/api-docs` | Swagger UI |
| GET | `/api-docs.json` | Raw OpenAPI spec |

---

## 7. Security Implementation

| Concern | Implementation |
|---|---|
| **Password hashing** | `bcrypt`, configurable salt rounds (default 12), via Mongoose pre-save hook. |
| **JWT auth** | Access tokens (15 min) signed with `JWT_ACCESS_SECRET`; refresh tokens (7 days) signed with a **separate** `JWT_REFRESH_SECRET`. |
| **Refresh token storage** | Only **SHA-256 hashes** of refresh tokens are stored in MongoDB (`RefreshToken` collection), with a TTL index for automatic cleanup. |
| **Token rotation & reuse detection** | Every `/auth/refresh-token` call revokes the old token and issues a new one. If a *revoked* token is replayed, **all** sessions for that user are revoked (possible theft). |
| **Account lockout** | 5 failed login attempts → 15-minute lockout (`failedLoginAttempts` / `lockUntil`). |
| **Rate limiting** | `express-rate-limit` — general (100 req / 15 min) and stricter auth limiter (10 req / 15 min) on login/register/forgot-password/reset-password. |
| **Helmet** | Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.). |
| **CORS** | Configured via `CORS_ORIGIN`, `credentials: true` for cookie-based flows. |
| **HTTP-only cookies** | Access & refresh tokens optionally set as `httpOnly`, `sameSite: strict`, `secure` (in production) cookies, scoped via `path`. |
| **Input validation** | Joi schemas for every route — strict password complexity rules (uppercase, lowercase, digit, special character, 8+ chars). |
| **NoSQL injection protection** | `express-mongo-sanitize` strips `$`/`.` operators from `req.body`/`query`/`params`. |
| **XSS protection** | `xss-clean` sanitizes user-supplied HTML/JS in inputs. |
| **Body size limits** | `express.json({ limit: '10kb' })` mitigates payload-based DoS. |
| **Centralized error handling** | All errors funnel through `error.middleware.js`; stack traces only shown outside production for non-operational errors. |
| **Logging** | Winston (file + console) + Morgan HTTP request logs; sensitive fields never logged. |
| **Privilege escalation prevention** | `ROLE_HIERARCHY` checks in `user.service.js` prevent lower roles from creating/editing equal-or-higher roles. |
| **Password change invalidation** | Changing/resetting a password revokes **all** existing refresh tokens and invalidates outstanding access tokens via `passwordChangedAt`. |

---

## 8. Swagger API Documentation

- Annotations live as JSDoc `@swagger` blocks directly above each route in `src/routes/*.js`.
- Configuration: `src/config/swagger.js` (OpenAPI 3.0, bearer auth security scheme, reusable `User`/`ApiResponse` schemas).
- Once the server is running:
  - **Swagger UI**: `http://localhost:5000/api-docs`
  - **Raw JSON spec**: `http://localhost:5000/api-docs.json`

---

## 9. Standardized API Response Format

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "...": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": {
    "errors": [
      { "field": "email", "message": "\"email\" must be a valid email" }
    ]
  }
}
```

**Paginated list (`meta`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": { "users": [ ] },
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

## 10. Step-by-Step Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local instance or MongoDB Atlas)
- (Optional) SMTP credentials for real password-reset emails — without these, emails are logged to console/file instead.

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env: set MONGO_URI, JWT secrets, SMTP config, etc.
# Generate strong secrets, e.g.:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Start MongoDB (if running locally)
mongod --dbpath /path/to/data

# 4. (Optional) Seed the initial SUPER_ADMIN account
node src/scripts/seedSuperAdmin.js
# Uses SUPER_ADMIN_NAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD from .env

# 5. Run in development mode (auto-restart via nodemon)
npm run dev

# 6. Or run in production mode
npm start
```

The API will be available at `http://localhost:5000` (or your configured `PORT`), with docs at `/api-docs`.

> ⚠️ **Important:** After seeding, log in as the SUPER_ADMIN and change the default password immediately via `/auth/change-password`.

---

## 11. Testing Instructions

### Using Swagger UI
1. Navigate to `http://localhost:5000/api-docs`.
2. Use `POST /auth/register` then `POST /auth/login` to obtain tokens.
3. Click **Authorize** and paste the `accessToken` (as `Bearer <token>`) to test protected routes.

### Using the Postman Collection
1. Import `postman_collection.json` into Postman.
2. Set the `baseUrl` collection variable (default `http://localhost:5000/api/v1`).
3. Run **Auth → Register**, then **Auth → Login** — the login request's test script automatically stores `accessToken`, `refreshToken`, and `userId` as collection variables.
4. Run any protected request (e.g., **Profile → Get My Profile**) — the `Authorization: Bearer {{accessToken}}` header is pre-filled.
5. To test RBAC, log in as users with different roles (seed a SUPER_ADMIN, then create ADMIN/MANAGER/EMPLOYEE users via `Users → Create User`) and observe `403 Forbidden` responses for insufficient roles.
6. Test refresh rotation: call **Auth → Refresh Token**, then call it again with the *old* refresh token — it should return `401` (reuse detection).

### Manual cURL examples

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"Passw0rd!23","role":"EMPLOYEE"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Passw0rd!23"}'

# Access protected route
curl http://localhost:5000/api/v1/profile \
  -H "Authorization: Bearer <accessToken>"
```

---

## 12. Deployment Guide

### Environment
- Set `NODE_ENV=production`.
- Set `COOKIE_SECURE=true` (requires HTTPS).
- Use strong, unique values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (≥ 64 random bytes, hex-encoded).
- Use a managed MongoDB instance (e.g., MongoDB Atlas) with network access restricted to your application's IPs.
- Configure real SMTP credentials for password reset emails.
- Set `CORS_ORIGIN` to your actual frontend domain(s).

### Process management
Run with a process manager such as **PM2**:
```bash
npm install -g pm2
pm2 start src/server.js --name auth-rbac-api
pm2 save
pm2 startup
```

### Reverse proxy / TLS
Place the app behind a reverse proxy (Nginx, Caddy, or a cloud load balancer) that terminates TLS and forwards to the Node process. Ensure `app.set('trust proxy', 1)` is configured if you rely on `req.ip` behind a proxy (add this in `app.js` if deploying behind a load balancer).

### Containerization (optional)
A minimal `Dockerfile` example:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Logging & monitoring
- Winston writes to `logs/error.log` and `logs/combined.log`. In containerized deployments, consider shipping these to a centralized logging service (ELK, CloudWatch, Datadog) instead of relying on local files.
- Monitor the `/api/v1/health` endpoint with your uptime monitoring tool.

### Scaling considerations
- The app is stateless aside from MongoDB — it can be horizontally scaled behind a load balancer.
- Refresh tokens are stored in MongoDB (shared state), so any instance can validate/rotate them.
- Consider Redis for rate-limiting storage if running multiple instances (the default `express-rate-limit` memory store is per-instance).

---

## 13. Error Handling Strategy

1. **Operational errors** (expected — validation, auth failures, not found, conflicts) are thrown as `ApiError` instances with appropriate HTTP status codes and `isOperational: true`. These are logged as warnings.
2. **Programming/unexpected errors** (bugs, DB connection issues) are caught, normalized to a generic `500 Internal Server Error`, marked `isOperational: false`, and logged as errors (with stack traces in non-production).
3. **Third-party errors** (Mongoose `ValidationError`/`CastError`/duplicate-key, JWT errors) are normalized into `ApiError` by `normalizeError()` in `error.middleware.js` so the client always receives the standardized response shape.
4. All async controllers/middleware are wrapped in `catchAsync`, eliminating repetitive try/catch and ensuring every rejected promise reaches the error handler.
5. Unhandled promise rejections and uncaught exceptions are caught at the process level (`server.js`) and trigger a graceful shutdown.

---

## 14. Extending the System

- **Add a new role**: add it to `ROLES` and `ROLE_HIERARCHY` in `src/config/roles.js`, then update relevant `PERMISSIONS` entries and route `authorize(...)` calls.
- **Add a new protected resource**: create a controller + service (if business logic needed) + route file, wire it into `src/routes/index.js`, and add `@swagger` annotations for documentation.
- **Add new validation rules**: extend the relevant Joi schema in `src/validators/`.
