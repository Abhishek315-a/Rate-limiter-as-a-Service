# RLaaS — Rate Limiter as a Service

A production-grade rate limiting service with Token Bucket algorithm, Redis-backed atomic counters, and a REST API.

## How to Run

### Prerequisites
- Node.js >= 12
- Redis
- PostgreSQL

Install Redis & PostgreSQL via Homebrew (macOS):
```bash
brew install redis postgresql@15
brew services start redis
brew services start postgresql@15
```

---

### 1. First-Time Setup

```bash
# Install backend dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Create the database
/opt/homebrew/opt/postgresql@15/bin/createdb rlaas

# Install frontend dependencies
cd client && npm install && cd ..
```

`.env` values needed:
```
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
DATABASE_URL=postgresql://localhost:5432/rlaas
JWT_SECRET=any_random_secret_here
NODE_ENV=development
```

---

### 2. Run Backend (Terminal 1)

```bash
npm run dev
```

Server starts on **http://localhost:3000**

Expected output:
```
Redis connected
PostgreSQL connected
Migrations complete
RLaaS running on port 3000
```

---

### 3. Run Frontend (Terminal 2)

```bash
cd client
PORT=3001 npm start
```

Dashboard opens at **http://localhost:3001**

---

### 4. Quick Smoke Test

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","password":"password123"}'
```

## API

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/keys` | Generate API key |
| GET | `/api/v1/auth/keys` | List API keys |
| DELETE | `/api/v1/auth/keys/:id` | Revoke API key |

### Check (requires X-API-Key header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/check` | Check rate limit |

#### Request body
```json
{
  "identifier": "user_123",
  "resource": "login",
  "limit": 5,
  "window": "15m",
  "algorithm": "token_bucket"
}
```

#### Response (allowed)
```json
{
  "allowed": true,
  "remaining": 4,
  "limit": 5,
  "resetAt": "2024-01-01T00:15:00.000Z"
}
```

#### Response (blocked) — HTTP 429
```json
{
  "allowed": false,
  "remaining": 0,
  "limit": 5,
  "resetAt": "2024-01-01T00:15:00.000Z"
}
```

### Rules (requires JWT Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rules` | List rules |
| POST | `/api/v1/rules` | Create rule |
| PUT | `/api/v1/rules/:id` | Update rule |
| DELETE | `/api/v1/rules/:id` | Delete rule |

### Stats (requires JWT Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats` | 24h summary |
| GET | `/api/v1/stats/:identifier` | Stats per identifier |

## Window formats
- `30s` — 30 seconds
- `5m` — 5 minutes
- `1h` — 1 hour
- `1d` — 1 day

## Algorithm
**Token Bucket** — Each identifier gets a bucket of N tokens. Tokens refill continuously at `limit/window` per second. Burst requests are allowed up to bucket capacity. Implemented as an atomic Lua script on Redis to prevent race conditions.
