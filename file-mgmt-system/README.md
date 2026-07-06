# Enterprise File Management & Audit Logging System

Node.js + Express + MySQL + Cloudinary backend for centralized file uploads
(profile images, resumes, project documents) with full audit logging, login
tracking, and API request logging. Built with MVC architecture.

Branch: `feature/file-management-system`

---

## 1. Tech Stack

| Concern            | Choice                          |
|---------------------|----------------------------------|
| Runtime             | Node.js 18+                     |
| Framework           | Express.js 4                    |
| Database            | MySQL 8 (via `mysql2/promise`)  |
| File storage        | Cloudinary                      |
| Uploads             | Multer (memory storage)         |
| Auth                | JWT + bcrypt                    |
| Validation          | Joi                             |
| Security            | Helmet, CORS, express-rate-limit|
| Logging             | Winston (app logs) + MySQL (audit/API/login logs) |

---

## 2. Setup

```bash
npm install
cp .env.example .env      # fill in DB + Cloudinary + JWT values
mysql -u root -p < database/schema.sql
npm run dev                # nodemon, or `npm start` for production
```

The server exits immediately on boot if it can't reach MySQL (fail-fast —
see `src/server.js`), rather than starting and failing on the first request.

---

## 3. Project Structure

```
src/
├── config/          # DB pool + Cloudinary SDK setup
├── controllers/      # HTTP layer — thin, delegates to services
├── middleware/        # auth, RBAC, upload, rate limit, logging, errors
├── models/            # Raw parameterized SQL, one file per table
├── routes/             # Express routers, one per resource + an aggregator
├── services/           # Business logic — the only layer controllers call into
├── utils/               # ApiError, ApiResponse, asyncHandler, logger, deviceParser
├── validators/            # Joi schemas
├── uploads/                # empty — Multer uses memory storage, not disk
├── app.js                  # Express app config (no .listen())
└── server.js                # Entry point — DB check, then app.listen()
```

**Request flow:** `route → middleware (auth/validate/upload) → controller →
service → model → MySQL`, with `services/audit.service.js` writing an audit
row alongside most successful/failed actions, and
`middleware/apiLogger.middleware.js` logging every single request
regardless of outcome.

---

## 4. Database Schema (`database/schema.sql`)

| Table         | Purpose                                            |
|----------------|-----------------------------------------------------|
| `users`         | Accounts, bcrypt password hash, role (admin/user)   |
| `files`          | Uploaded file metadata + Cloudinary refs, soft-delete |
| `audit_logs`      | Every business/security event (who, what, when, from where, outcome) |
| `login_logs`        | Login/logout history incl. failed attempts, browser/device |
| `api_logs`            | Every API request: endpoint, method, status, response time |

All logging tables use `ON DELETE SET NULL` on their `user_id` foreign key
(instead of `CASCADE`) so the audit trail survives even if a user account is
later deleted — a standard compliance requirement.

---

## 5. API Reference

All endpoints are prefixed with `/api`.

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Get JWT (rate-limited: 10/15min/IP) |
| POST | `/auth/logout` | ✅ | Close login session |
| GET  | `/auth/profile` | ✅ | Get own profile |
| PUT  | `/auth/profile` | ✅ | Update name |
| PUT  | `/auth/change-password` | ✅ | Change password |

### Files (`/api`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload/profile` | ✅ | Upload profile image (`file` field, ≤2MB, jpg/png/webp) |
| POST | `/upload/resume` | ✅ | Upload resume (≤5MB, pdf/doc/docx) |
| POST | `/upload/project` | ✅ | Upload project document (≤10MB, pdf/doc/docx/zip/ppt) |
| GET  | `/files` | ✅ | List own files (admins see all); `?fileCategory=&limit=&offset=` |
| GET  | `/files/:id` | ✅ | View one file's metadata |
| GET  | `/files/:id/download` | ✅ | Redirects to the Cloudinary URL |
| DELETE | `/files/:id` | ✅ | Soft-delete + remove from Cloudinary |

### Logs (admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit` | `?userId=&action=&module=&limit=&offset=` |
| GET | `/login-history` | `?userId=&limit=&offset=` |
| GET | `/api-logs` | `?userId=&statusCode=&limit=&offset=` |

All protected routes require `Authorization: Bearer <jwt>`.

---

## 6. Security Measures Implemented

- **JWT auth** (`middleware/auth.middleware.js`) — verifies token, confirms
  user still exists/active, logs `UNAUTHORIZED_ACCESS` on failure.
- **RBAC** (`middleware/role.middleware.js`) — restricts admin-only routes.
- **File validation** (`middleware/upload.middleware.js`) — MIME whitelist +
  size cap per category, enforced before the file is buffered.
- **SQL injection protection** — every query in `models/*` uses `?`
  parameterized placeholders; no string concatenation of user input.
- **Rate limiting** — global limiter + a stricter one on `/auth/login`.
- **Helmet** — secure HTTP headers.
- **CORS** — configurable allowed origin via `.env`.
- **Centralized error handling** (`middleware/errorHandler.middleware.js`) —
  normalizes all error responses and logs API errors to the audit trail.
- **Environment variables** — all secrets/config in `.env` (never committed;
  see `.gitignore`).

---

## 7. File-by-File Reference

Every source file has a docblock at its top explaining its purpose, its
functions, and which other files it connects to — read those inline
comments for full detail. Summary:

- **`config/db.js`** — MySQL connection pool + startup health check.
- **`config/cloudinary.js`** — Cloudinary SDK configuration.
- **`models/*.model.js`** — One file per table; only raw parameterized SQL.
- **`services/cloudinary.service.js`** — Streams file buffers to Cloudinary,
  isolating the third-party SDK from the rest of the app.
- **`services/audit.service.js`** — Safe wrapper for writing audit rows
  (never throws — a broken audit insert must not break the real request).
- **`services/auth.service.js`** — Registration, login (+ login_logs write
  on every attempt), logout, password change.
- **`services/file.service.js`** — Upload orchestration + ownership checks.
- **`validators/*.validator.js`** — Joi schemas for request bodies/queries.
- **`middleware/validate.middleware.js`** — Generic Joi-validation factory.
- **`middleware/auth.middleware.js`** — JWT verification.
- **`middleware/role.middleware.js`** — Role-based route guard.
- **`middleware/upload.middleware.js`** — Multer config + file validation.
- **`middleware/rateLimiter.middleware.js`** — Global + login-specific limits.
- **`middleware/apiLogger.middleware.js`** — Logs every request to `api_logs`.
- **`middleware/errorHandler.middleware.js`** — Central error handler +
  API-error audit logging.
- **`middleware/notFound.middleware.js`** — 404 handler.
- **`controllers/*.controller.js`** — Thin HTTP handlers; validate nothing
  themselves (that's the validators/middleware's job), call one service
  method, write one audit entry, return one `ApiResponse`.
- **`routes/*.routes.js`** — Wires middleware chains to controllers.
- **`routes/index.js`** — Mounts every router under `/api`.
- **`app.js`** — Express app: security middleware → body parsing → request
  logging → routes → 404 → error handler (order matters).
- **`server.js`** — Process entry point: DB check, then `listen()`.

---

## 8. Notes / Next Steps

- Add automated tests (Jest + Supertest) — not included per scope of this task.
- Add a `refresh token` flow if longer-lived sessions are needed; current
  setup uses a single access token with `JWT_EXPIRES_IN`.
- Consider Cloudinary signed/private delivery URLs if files should not be
  publicly reachable by URL alone.
