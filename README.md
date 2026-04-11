# RLaaS — Rate Limiter as a Service

A production-grade rate limiting service with Token Bucket algorithm, Redis-backed atomic counters, and a REST API.

## Setup

```bash
cp .env.example .env
# Fill in your Redis and PostgreSQL credentials

npm install
npm run dev
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
