# Deployment Guide

This guide explains how to deploy RLaaS (Rate Limiter as a Service) to production using **Render** (backend) and **Vercel** (frontend).

## Architecture

- **Backend**: Node.js + Express + PostgreSQL + Redis — deployed on [Render](https://render.com)
- **Redis**: Managed by [Upstash](https://upstash.com) (external, free tier, TLS)
- **Frontend**: React — deployed on [Vercel](https://vercel.com)

---

## Step 1 — Set Up Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Choose a region close to your Render server (e.g. `us-east-1`)
3. After creation, go to the database details page
4. Copy the **Redis URL** — it starts with `rediss://` (note the double `s` = TLS)
5. Keep this URL handy — you'll add it as an env var on Render

> You can reuse an existing Upstash database shared with another project.
> All RLaaS Redis keys are prefixed with `rlaas:` and `auth_cache:` so they won't collide.

---

## Step 2 — Deploy Backend on Render

### 2.1 Create a Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Root Directory**: *(leave blank — `package.json` is at the repo root)*
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Plan**: Free (or paid for production SLAs)

### 2.2 Set Environment Variables

Go to your Web Service → **Environment** tab and add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `REDIS_URL` | Upstash Redis URL (`rediss://...`) |
| `JWT_SECRET` | Strong random string — generate with `openssl rand -base64 32` |
| `CLIENT_URL` | Your Vercel frontend URL (no trailing slash) |

> **Do NOT set `PORT`** — Render injects it automatically, and the app already reads `process.env.PORT`.

> `DATABASE_URL` will be set automatically in Step 3.

### 2.3 Configure Health Check

1. Web Service → **Settings** → **Health & Alerts**
2. Set **Health Check Path** to `/health`
3. Render will verify this returns HTTP 200 before marking a deploy as live

### 2.4 Get Your Backend URL

After the first deploy completes, copy your service URL:
- Example: `https://rlaas-xxxx.onrender.com`

---

## Step 3 — Add PostgreSQL on Render

1. Render dashboard → **New** → **PostgreSQL**
2. Give it a name, choose **Free** plan
3. After creation, go to the database → **Info** tab
4. Copy the **Internal Database URL**
5. Go to your Web Service → **Environment** → add:
   - `DATABASE_URL` = *(paste Internal Database URL)*
6. Trigger a redeploy (Render may do this automatically)

> **Free Render PostgreSQL databases are deleted after 90 days.**
> For persistent production data, upgrade to the $7/month paid Postgres tier.

---

## Step 4 — Deploy Frontend on Vercel

### 4.1 Create a Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. Set **Root Directory** to `client`
4. Click **Deploy**

### 4.2 Configure Environment Variables

1. Vercel → your project → **Settings** → **Environment Variables**
2. Add for **Production**:
   - `REACT_APP_API_URL` = `https://<your-render-service>.onrender.com/api/v1`
3. Click **Save**

### 4.3 Redeploy

Environment variables are baked into the React build, so you must redeploy:

1. **Deployments** tab → **...** → **Redeploy**
2. Or push a small commit to trigger a new build

---

## Step 5 — Set CORS on Render

Now that you have your Vercel URL, update the backend:

1. Render → Web Service → **Environment**
2. Set `CLIENT_URL` = your Vercel URL (e.g. `https://rate-limiter-as-a-service-mu.vercel.app`)
3. Render will automatically redeploy

---

## Step 6 — Verify Deployment

### Test backend health

```bash
curl https://<your-render-url>/health
# Expected: {"status":"ok"}
```

### Test registration

```bash
curl -X POST https://<your-render-url>/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"securepassword"}'
```

### Test frontend

1. Open your Vercel URL in a browser
2. Register an account
3. Log in and verify the dashboard loads
4. Create an API key
5. Test the rate limiter from the Tester page

---

## Step 7 — Shut Down Railway (after confirming Render works)

Only after you have verified Render is serving traffic correctly:

1. Go to [railway.app](https://railway.app)
2. Navigate to your project
3. Delete each service (Node.js app, PostgreSQL, Redis)

---

## Environment Variables Reference

### Backend (Render)

| Variable | Source | Description |
|---|---|---|
| `DATABASE_URL` | Auto-linked from Render Postgres | PostgreSQL connection string |
| `REDIS_URL` | Manual — from Upstash | Redis TLS connection string (`rediss://...`) |
| `CLIENT_URL` | Manual | Your Vercel frontend URL (no trailing slash) |
| `JWT_SECRET` | Manual | Strong random string for JWT signing |
| `NODE_ENV` | Manual | Set to `production` |

### Frontend (Vercel)

| Variable | Source | Description |
|---|---|---|
| `REACT_APP_API_URL` | Manual | Render backend URL + `/api/v1` |

---

## Troubleshooting

### Backend: Redis connection refused / TLS error

**Symptom**: Logs show `ECONNREFUSED` or TLS errors connecting to Redis

**Fix**:
- Ensure `REDIS_URL` starts with `rediss://` (not `redis://`) for Upstash
- The app automatically detects `rediss://` and enables TLS

### Backend: Database not found / migrations fail

**Symptom**: Logs show `relation does not exist` or connection errors

**Fix**:
1. Confirm `DATABASE_URL` is set and points to the **Internal** Render Postgres URL
2. Check that `NODE_ENV=production` is set (enables SSL for Render Postgres)
3. Migrations run automatically on every startup — check Render logs

### Frontend: API calls fail silently

**Symptom**: Frontend loads but data doesn't appear

**Fix**:
1. Vercel → Settings → Environment Variables
2. Confirm `REACT_APP_API_URL` is set for Production and points to your Render URL
3. Redeploy on Vercel after any env var change
4. Open browser DevTools → Network tab → verify API requests go to Render, not localhost

### Frontend: CORS error / 403 Forbidden

**Symptom**: Browser console shows a CORS error

**Fix**:
1. Render → Web Service → Environment
2. Set `CLIENT_URL` to the **exact** Vercel URL (no trailing slash)
3. Trigger a redeploy

### Render: Service goes to sleep (cold start)

**Symptom**: First request after inactivity takes 20–30 seconds

**Cause**: Render free tier spins down inactive services

**Fix**: This is expected on the free tier. Upgrade to a paid plan to keep the service always-on, or use a cron job pinger (e.g. [UptimeRobot](https://uptimerobot.com), free) to hit `/health` every 5 minutes.

---

## Security Checklist

- [x] `JWT_SECRET` is a strong random string (`openssl rand -base64 32`)
- [x] `.env` is gitignored — never committed to the repo
- [x] `NODE_ENV=production` is set on Render
- [x] HTTPS is automatic on Render and Vercel
- [x] Auth endpoints have brute-force rate limiting (10 attempts / 15 min / IP)
- [x] JSON payload size capped at 10kb
- [x] Stack traces are masked in production error responses
- [x] API key hashes are stored — raw keys are never persisted
- [x] Revoked API keys are immediately invalidated from the auth cache
- [x] request_logs older than 7 days are automatically deleted
- [ ] Run `npm audit fix` periodically to patch dependency vulnerabilities
- [ ] Monitor Render logs for anomalies

---

## Cost Estimate (Free Tier)

| Service | Cost |
|---|---|
| Render Web Service | Free (sleeps after inactivity) |
| Render PostgreSQL | Free (90-day retention limit) |
| Upstash Redis | Free (10,000 commands/day) |
| Vercel | Free (hobby plan) |
| **Total** | **$0/month** |
