# Railway Deployment Guide for Kori Photography Platform

This guide walks you through deploying the Kori Photography Platform to Railway using the CLI setup script.

## What You Have

- ✅ GitHub repository linked to Railway
- ✅ PostgreSQL database created in Railway
- ✅ Dockerfiles for both API and Web services (`Dockerfile.api` and `Dockerfile.web`)
- ✅ Deployment setup script (`railway-setup.ps1`)

## Quick Start

### 1. Run the Setup Script

Open PowerShell in your project directory and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\railway-setup.ps1
```

The script will:
- Install/verify Railway CLI
- Authenticate with Railway
- Link to your project
- Ask for your Stripe credentials
- Generate a secure `SESSION_SECRET`
- Set all environment variables in Railway

### 2. Create Services in Railway Dashboard

After the script completes, you need to create 2 services in [Railway Dashboard](https://railway.app):

#### Service 1: kori-api (Backend)

1. Click **"+ New"** → **"GitHub Repo"**
2. Select **Kori_Stable** repository
3. Configure:
   - **Name:** `kori-api`
   - **Root Directory:** `apps/api`
   - **Dockerfile Path:** `Dockerfile.api`
   - **Port:** `3001`
4. Click **Deploy**

#### Service 2: kori-web (Frontend)

1. Click **"+ New"** → **"GitHub Repo"**
2. Select **Kori_Stable** repository
3. Configure:
   - **Name:** `kori-web`
   - **Root Directory:** `apps/web`
   - **Dockerfile Path:** `Dockerfile.web`
   - **Port:** `3000`
4. Click **Deploy**

### 3. Wait for Builds to Complete

Both services will start building automatically. You can monitor progress in the Railway dashboard.

**Build times:**
- API: ~5-10 minutes (includes database migration)
- Web: ~3-5 minutes

### 4. Configure Service URLs

Once both services are deployed, you'll get URLs like:
- API: `https://kori-api-xxxxxx.railway.app`
- Web: `https://kori-web-xxxxxx.railway.app`

Update environment variables:

#### In API service (`kori-api`):
Add/update:
- `CORS_ORIGIN`: Your web service URL (e.g., `https://kori-web-xxxxxx.railway.app`)

#### In Web service (`kori-web`):
Add:
- `VITE_API_URL`: Your API service URL (e.g., `https://kori-api-xxxxxx.railway.app`)

### 5. Configure Stripe Webhooks

In your [Stripe Dashboard](https://dashboard.stripe.com/webhooks):

1. Create a new webhook endpoint
2. URL: `https://<your-api-domain>/webhooks/stripe`
3. Events to subscribe to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the **Webhook Secret** and update `STRIPE_WEBHOOK_SECRET` in Railway

### 6. Test Your Deployment

1. Visit your web app: `https://kori-web-xxxxxx.railway.app`
2. Try logging in (test credentials from database seed)
3. Check API logs: `railway logs --service kori-api`
4. Check Web logs: `railway logs --service kori-web`

## Environment Variables Reference

### API Service (kori-api)

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...` | Auto-set from PostgreSQL service |
| `SESSION_SECRET` | Generated in script | Session encryption key |
| `NODE_ENV` | `production` | Set by script |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `CORS_ORIGIN` | `https://kori-web-xxx.railway.app` | Frontend domain |
| `STRIPE_SECRET_KEY` | `sk_live_...` | From Stripe Dashboard |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | From Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe Webhooks |

### Web Service (kori-web)

| Variable | Example | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `https://kori-api-xxx.railway.app` | API service URL |
| `NODE_ENV` | `production` | Set by script |

## Troubleshooting

### Build Fails with "database migration failed"

**Symptom:** API service build fails during `pnpm db:migrate`

**Solution:**
1. Check PostgreSQL service is running in Railway
2. Verify `DATABASE_URL` is correctly set in API service
3. Check logs: `railway logs --service kori-api`
4. If database is corrupted, use Railway UI to reset the PostgreSQL service

### Web Service Shows 404 or Blank Page

**Symptom:** Frontend loads but shows blank page or 404 errors

**Solution:**
1. Verify `VITE_API_URL` is set to your API domain
2. Check that API service is running and responsive
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check console for CORS errors: Press F12 → Console tab

### Stripe Webhooks Not Working

**Symptom:** Payment processing works, but no webhook notifications

**Solution:**
1. Verify webhook endpoint in Stripe Dashboard
2. Check webhook secret matches `STRIPE_WEBHOOK_SECRET` in Railway
3. Test with Stripe CLI: `stripe trigger payment_intent.succeeded`
4. Check API logs for webhook errors

### Services Won't Communicate

**Symptom:** Web service can't reach API service

**Solution:**
1. Ensure `VITE_API_URL` matches your deployed API domain exactly
2. Check `CORS_ORIGIN` in API includes the web domain
3. Verify both services are in the same Railway environment
4. Test API directly: `curl https://your-api-domain/healthz`

## Common Commands

```bash
# View logs for a service
railway logs --service kori-api

# Set a variable
railway variables set KEY=value

# Get a variable
railway variables get KEY

# Open service shell
railway shell --service kori-api

# Redeploy a service
railway up --service kori-api
```

## After Deployment

1. **Monitor logs regularly** — Check for errors daily initially
2. **Backup database** — Set up automated backups in Railway
3. **Monitor costs** — Railway has free tier limits, watch usage
4. **Update secrets** — Rotate Stripe keys periodically
5. **Enable autoscaling** — For production loads

## Need Help?

- 📚 [Railway Documentation](https://docs.railway.app)
- 🎯 [Stripe Integration Guide](./STRIPE_SETUP.md)
- 📋 [Project Architecture](./CLAUDE.md)
- 🐛 [Troubleshooting Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)

---

**Version:** 1.0
**Last Updated:** 2025-12-16
**Project:** Kori Photography Platform
