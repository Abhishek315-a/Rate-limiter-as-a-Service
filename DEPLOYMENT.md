# Deployment Guide

This guide explains how to deploy RLaaS (Rate Limiter as a Service) to production using Railway (backend) and Vercel (frontend).

## Architecture

- **Backend**: Node.js + Express + PostgreSQL + Redis (deployed on Railway)
- **Frontend**: React (deployed on Vercel)

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Vercel account ([vercel.com](https://vercel.com))
- Git repository with this code

## Step 1: Deploy Backend on Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### 1.2 Add PostgreSQL

1. In your Railway project, click **+ New Service**
2. Select **PostgreSQL** from the database section
3. Railway will automatically set `DATABASE_URL` environment variable

### 1.3 Add Redis

1. Click **+ New Service** again
2. Select **Redis** from the database section
3. Railway will automatically set `REDIS_URL` environment variable

### 1.4 Link Environment Variables to Backend

1. Click on your **Node.js service** (the backend, not databases)
2. Go to **Variables** tab
3. Click the **Redis** service → copy its `REDIS_URL` value
4. Add `REDIS_URL` variable to your backend service with the copied value
5. Ensure `DATABASE_URL` is already present (linked from PostgreSQL)
6. Add `CLIENT_URL` with your Vercel frontend URL (you'll get this after deploying frontend)
7. Add `JWT_SECRET` with a strong random string (generate with: `openssl rand -base64 32`)
8. Set `NODE_ENV=production`
9. Set `PORT=8080` (Railway uses port 8080 by default)

### 1.5 Generate Public Domain

1. Click on your backend service → **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy the URL (e.g., `https://rlaas-production-xxxx.up.railway.app`)
4. This is your backend API URL

### 1.6 Deploy

Railway will automatically deploy when you push to the connected branch. Check logs to ensure:
- `Redis connected`
- `PostgreSQL connected`
- `Migrations complete`
- `RLaaS running on port 8080`

## Step 2: Deploy Frontend on Vercel

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. **Root Directory**: Set to `client` (the frontend folder)
5. Click **Deploy**

### 2.2 Configure Environment Variables

1. After deployment, go to your project → **Settings** → **Environment Variables**
2. Add the following variable for **Production**:
   - `REACT_APP_API_URL` = `https://<your-railway-backend-url>/api/v1`
   - Example: `https://rlaas-production-xxxx.up.railway.app/api/v1`
3. Click **Save**

### 2.3 Redeploy

Environment variables are baked into the build, so you must redeploy:

1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**
4. Or push a small commit to trigger a new build

### 2.4 Get Frontend URL

1. After redeploy, copy your Vercel app URL
2. Example: `https://rate-limiter-as-a-service.vercel.app`

## Step 3: Configure CORS on Railway

Now that you have both URLs, update the backend CORS:

1. Go to Railway → backend service → **Variables**
2. Update `CLIENT_URL` with your exact Vercel frontend URL:
   - Example: `https://rate-limiter-as-a-service.vercel.app`
3. Railway will automatically redeploy with the new CORS setting

## Step 4: Verify Deployment

### Test Backend Health

```bash
curl https://<your-railway-url>/health
# Should return: { "status": "ok" }
```

### Test Frontend

1. Open your Vercel app URL in a browser
2. Try to register a new account
3. Login and verify the dashboard loads
4. Create an API key
5. Test the rate limiter from the Tester page

## Troubleshooting

### Backend: Redis Connection Refused

**Symptom**: Logs show `ECONNREFUSED` connecting to Redis

**Cause**: `REDIS_URL` not linked to backend service

**Fix**:
1. Railway → click Redis service
2. Copy the `REDIS_URL` value
3. Go to backend service → Variables
4. Add `REDIS_URL` with the copied value
5. Redeploy

### Frontend: API Calls Fail Silently

**Symptom**: Frontend loads but data doesn't appear

**Cause**: `REACT_APP_API_URL` not set or frontend not redeployed after setting it

**Fix**:
1. Vercel → Settings → Environment Variables
2. Confirm `REACT_APP_API_URL` is set for Production
3. Redeploy on Vercel
4. Open browser DevTools → Network tab
5. Verify API requests go to Railway URL, not Vercel URL

### Frontend: CORS Error / Forbidden

**Symptom**: Browser shows CORS error or 403 Forbidden

**Cause**: `CLIENT_URL` not set on Railway or doesn't match Vercel URL exactly

**Fix**:
1. Railway → backend service → Variables
2. Set `CLIENT_URL` to exact Vercel URL (no trailing slash)
3. Redeploy

### Frontend: Build Failed (Babel Version Mismatch)

**Symptom**: Vercel build fails with babel-related errors

**Cause**: Stale build cache or manual babel dependencies

**Fix**:
1. Vercel → Settings → Functions → Clear build cache (if available)
2. Or push a commit to trigger fresh build
3. Ensure `client/package.json` doesn't have manual `@babel/*` dependencies

### Local Development: Build Errors

**Symptom**: `npm start` fails with `Cannot find module 'node:path'` or babel errors

**Cause**: Stale `node_modules` from different Node version

**Fix**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## Environment Variables Summary

### Backend (Railway)

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Auto-linked by Railway | PostgreSQL connection string |
| `REDIS_URL` | Link from Redis service | Redis connection string |
| `CLIENT_URL` | Manual | Your Vercel frontend URL |
| `JWT_SECRET` | Manual | Strong random string for JWT signing |
| `NODE_ENV` | Manual | Set to `production` |
| `PORT` | Manual | Set to `8080` |

### Frontend (Vercel)

| Variable | Source | Description |
|----------|--------|-------------|
| `REACT_APP_API_URL` | Manual | Railway backend URL + `/api/v1` |

## Security Checklist

- [ ] Use strong `JWT_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Don't commit `.env` files
- [ ] Set `NODE_ENV=production` on Railway
- [ ] Use HTTPS (automatic on Railway and Vercel)
- [ ] Keep dependencies updated (`npm audit fix` regularly)
- [ ] Monitor Railway logs for errors

## Monitoring

### Railway Monitoring

- View logs in Railway → backend service → **Logs**
- Set up log drains for external monitoring
- Monitor resource usage in **Metrics**

### Vercel Monitoring

- View deployments in Vercel → **Deployments**
- Monitor build times and errors
- Use Analytics for frontend performance

## Scaling

### Backend Scaling

- Railway automatically scales based on traffic
- For high traffic, consider upgrading to paid tier
- Redis and PostgreSQL are managed services

### Frontend Scaling

- Vercel automatically scales globally
- Edge caching is automatic
- No manual scaling needed

## Cost Estimate

- Railway: Free tier covers basic usage (~$5/month after free credits)
- Vercel: Free tier covers hobby projects
- Total: Can run for free on both platforms for development/testing

## Support

For issues:
1. Check Railway logs
2. Check Vercel build logs
3. Verify environment variables are set correctly
4. Test API endpoints with curl/Postman
