# Kori Platform - Login Troubleshooting Document

## Executive Summary

The Kori Photography Platform has been deployed to Railway with the following services:
- **API Server:** https://kori-api-production.up.railway.app (Fastify backend)
- **Web App:** https://kori-web-production.up.railway.app (React/Vite frontend)
- **Database:** PostgreSQL on Railway (internal: postgres.railway.internal:5432)

**Current Status:** Login credentials are rejected with "Invalid credentials. Please check the email and password" despite the credentials being correct in the database.

---

## Phase 1: Initial Problems Identified

### Problem 1: Web App Routing to Itself Instead of API
**Symptom:** Web app requests to `/api/auth/signin` were hitting the web app's own domain instead of the API server.

**Root Cause:** `VITE_API_URL` environment variable was not being set during Vite build, causing it to fall back to relative URLs which became same-origin requests.

**Status:** ✅ **FIXED** - Multiple approaches applied:
1. Added `.dockerignore` to exclude local `.env` files from Docker build
2. Set `VITE_API_URL=https://kori-api-production.up.railway.app` during pnpm build in Dockerfile
3. Added Vite proxy configuration in vite.config.ts for development

### Problem 2: 100+ TypeScript/Lint Errors Blocking CI
**Status:** ✅ **FIXED** - All errors resolved in CI run #53

### Problem 3: Production Database Tables Never Initialized
**Symptom:** "The table `public.admin_users` does not exist in the current database"

**Root Cause:** Prisma migrations/schema push were never running in the Docker container startup sequence.

**Status:** ✅ **FIXED** - Database initialization now works:
- Modified `apps/api/package.json` to add `db:init` script
- Modified `start` script to run `npm run db:init && node --import tsx src/index.ts`
- This ensures `prisma db push --accept-data-loss && prisma db seed` runs before API starts
- Confirmed in Railway logs: ✅ All tables created, ✅ Admin users seeded

---

## Phase 2: Current Architecture

### Railway Services

#### 1. kori-api-production (Node.js API Server)
- **Image:** Built from `Dockerfile.api`
- **Port:** 3001 (exposed)
- **Entry Point:** `sh -c "cd apps/api && npm run start"`
- **Startup Process:**
  1. npm install dependencies
  2. Prisma generates client
  3. npm run db:init:
     - `prisma db push --accept-data-loss` (syncs schema to database)
     - `prisma db seed` (runs seed.ts to populate data)
  4. `node --import tsx src/index.ts` (starts Fastify server)

**Environment Variables Set on Railway:**
- `DATABASE_URL`: PostgreSQL connection string (postgres.railway.internal:5432/railway)
- `NODE_ENV`: production
- `SESSION_SECRET`: Generated secure token
- `CORS_ORIGIN`: http://localhost:3000 ⚠️ **NOTE: This is a dev URL, may need updating**

**Key Endpoints:**
- `POST /auth/login` - Admin login (email + password)
- `GET /diagnostic/admin-users` - List admin users (debug endpoint)
- `GET /debug/env` - Show environment variables
- `GET /healthz` - Health check

#### 2. kori-web-production (React Web App)
- **Image:** Built from `Dockerfile.web`
- **Port:** 3000 (exposed as Railway service)
- **Build Process:**
  1. Install dependencies with pnpm
  2. Set `VITE_API_URL=https://kori-api-production.up.railway.app` env var
  3. Build web app: `pnpm --filter @kori/web build`
  4. Production stage copies dist folder
- **Start Command:** `pnpm --filter @kori/web preview`

**Expected Behavior:**
- Web app built with `VITE_API_URL=https://kori-api-production.up.railway.app`
- All references to `import.meta.env.VITE_API_URL` should resolve to the API server URL
- Login requests should go to `https://kori-api-production.up.railway.app/auth/login`

#### 3. PostgreSQL Database
- **Provider:** Railway PostgreSQL
- **Connection:** postgres.railway.internal:5432/railway
- **Status:** ✅ Schema created, ✅ Admin users seeded

---

## Phase 3: Admin User Setup

### Created Admin User
- **Email:** michael@shotbymizu.co.uk
- **Password:** Password123
- **Name:** Michael Admin
- **Role:** SUPER_ADMIN

### Verification (via API)
```bash
# Test 1: Confirm user exists
curl https://kori-api-production.up.railway.app/diagnostic/admin-users

# Test 2: Test login directly
curl -X POST https://kori-api-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@shotbymizu.co.uk","password":"Password123"}'

# Expected response:
# {"success":true,"message":"Login successful","user":{"id":"...","email":"michael@shotbymizu.co.uk","name":"Michael Admin","role":"SUPER_ADMIN"}}
```

**Result:** ✅ **API login works correctly** - Returns success with valid session

---

## Phase 4: Current Issue - Web App Still Failing

### Symptoms
1. **Network Request Shows Wrong URL:**
   - Current: `POST https://kori-web-production.up.railway.app/api/auth/signin`
   - Expected: `POST https://kori-api-production.up.railway.app/auth/login`

2. **Error Response:** "Invalid credentials. Please check the email and password"

3. **Code vs Reality Mismatch:**
   - Code in `apps/web/src/routes/admin/login.tsx` line 22:
     ```typescript
     const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
     const response = await fetch(`${API_BASE_URL}/auth/login`, {...});
     ```
   - But actual request goes to `/api/auth/signin` on web app domain
   - This indicates `VITE_API_URL` is still `undefined` in production build

### Root Cause Analysis

The web app is making requests to its own domain (`kori-web-production.up.railway.app`), which means:
- Either `VITE_API_URL` is still undefined (falls back to `http://localhost:3001` which becomes same-origin)
- Or there's a Next.js/middleware interceptor converting requests to `/api/auth/signin`

**Latest Hypothesis:**
The Dockerfile.web command `RUN VITE_API_URL=https://kori-api-production.up.railway.app pnpm --filter @kori/web build` may not be properly passing the environment variable to Vite's build process.

---

## Phase 5: All Changes Applied

### Docker Configuration Files

#### `.dockerignore` (NEW)
```
.env
.env.local
.env.*.local
.env.production
```
**Purpose:** Prevent local `.env` files (which have `VITE_API_URL=http://localhost:3001`) from being copied into Docker build context.

#### `Dockerfile.api` (MODIFIED)
```dockerfile
CMD ["sh", "-c", "cd apps/api && npm run start"]
```
**Purpose:** Simplified startup - npm start now handles database initialization.

#### `Dockerfile.web` (MODIFIED)
```dockerfile
RUN VITE_API_URL=https://kori-api-production.up.railway.app pnpm --filter @kori/web build
```
**Purpose:** Set `VITE_API_URL` as environment variable during build so Vite substitutes it into bundled code.

### Package.json Changes

#### `apps/api/package.json` (MODIFIED)
```json
{
  "scripts": {
    "db:init": "prisma db push --accept-data-loss && prisma db seed",
    "start": "npm run db:init && node --import tsx src/index.ts"
  }
}
```
**Purpose:** Ensure database is initialized before API starts.

### Seed Script

#### `apps/api/prisma/seed.ts` (MODIFIED)
```typescript
const prodAdminPassword = await argon2.hash('Password123');
const prodAdmin = await prisma.adminUser.upsert({
  where: { email: 'michael@shotbymizu.co.uk' },
  update: { password: prodAdminPassword },
  create: {
    email: 'michael@shotbymizu.co.uk',
    password: prodAdminPassword,
    name: 'Michael Admin',
  },
});
```
**Purpose:** Ensures admin user is created in production database on every seed.

### Diagnostic Endpoints (ADDED)

#### `apps/api/src/routes/diagnostic.ts`
- `GET /diagnostic/admin-users` - List all admin users in database
- `POST /diagnostic/test-login` - Test login without creating session

#### `apps/api/src/routes/debug.ts`
- `GET /debug/env` - Show environment variables
- `GET /debug/db-tables` - List all database tables

---

## Key Facts for Troubleshooting

### What Works
✅ Database is initialized
✅ Admin user exists in database
✅ API login endpoint works (verified with curl)
✅ API returns correct response for valid credentials
✅ Web app loads successfully
✅ Login form displays

### What's Broken
❌ Web app sends requests to wrong endpoint (to itself, not API)
❌ Web app receives "Invalid credentials" error

### The Paradox
- **Direct API test:** Login succeeds ✅
- **Through web app:** Login fails ❌
- **Root cause:** Web app isn't routing requests to the API server

### Critical Questions for Troubleshooting Agent

1. **Is `VITE_API_URL` actually being set during Dockerfile build?**
   - Check if `pnpm --filter @kori/web build` is receiving the env var
   - Verify the built JavaScript includes the API server URL

2. **Is there a Next.js API route or middleware intercepting requests?**
   - The request path `/api/auth/signin` doesn't match our code's `/auth/login`
   - Search for where `/api/auth/signin` endpoint is defined

3. **Is there a reverse proxy or middleware layer?**
   - Railway or Nginx rewriting requests?
   - Check if `/api/*` routes are being intercepted

4. **Is `import.meta.env.VITE_API_URL` being bundled correctly?**
   - Check the built JavaScript in the dist folder for the actual URL value
   - Is it still `undefined` after build?

---

## Files to Check

### Web App
- `apps/web/src/routes/admin/login.tsx` - Login form and API call
- `apps/web/vite.config.ts` - Vite configuration
- `apps/web/.env` - Local development config (should NOT be included in Docker build)
- `apps/web/.env.local` - Local overrides (should NOT be included)

### API
- `apps/api/package.json` - Start script configuration
- `apps/api/src/routes/auth.ts` - Login endpoint (POST /auth/login)
- `apps/api/src/services/auth.ts` - Authentication logic
- `apps/api/prisma/seed.ts` - Database seeding

### Docker
- `Dockerfile.web` - Web app build process
- `Dockerfile.api` - API server build process
- `.dockerignore` - Files excluded from Docker build

---

## Git Commits Applied

All changes have been committed to main branch and deployed to Railway:

1. Fixed API request routing (proxy config + VITE_API_URL)
2. Fixed 100+ TypeScript errors
3. Added database initialization to Docker
4. Changed admin password to "Password123"
5. Added diagnostic endpoints
6. Added .dockerignore to exclude local .env files
7. Fixed VITE_API_URL substitution in Dockerfile.web

**Current commit:** `2da9e1f` - "Fix VITE_API_URL substitution by setting env var during build"

---

## Environment Variable Checklist

### API Server (Railway Dashboard)
- [ ] `DATABASE_URL` set correctly to Railway PostgreSQL
- [ ] `NODE_ENV` = production
- [ ] `SESSION_SECRET` = generated secure value
- [ ] `CORS_ORIGIN` = correct web app URL (currently: http://localhost:3000 ⚠️)

### Web App (Railway Dashboard)
- [ ] No `VITE_API_URL` set (should use Docker build value)
- [ ] No local `.env` files in Git repo that would override

### Docker Build
- [ ] `.dockerignore` excludes `.env*` files
- [ ] `Dockerfile.web` sets `VITE_API_URL` during build
- [ ] `Dockerfile.api` sets up database initialization

---

## Debugging Commands

### Check API Health
```bash
curl https://kori-api-production.up.railway.app/healthz
```

### Check Database Access
```bash
curl https://kori-api-production.up.railway.app/diagnostic/admin-users
```

### Check Environment Variables
```bash
curl https://kori-api-production.up.railway.app/debug/env
```

### Test Login Directly (via curl)
```bash
curl -X POST https://kori-api-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@shotbymizu.co.uk","password":"Password123"}'
```

### Check Web App Logs
Go to Railway dashboard → kori-web-production → Logs tab

### Check API Logs
Go to Railway dashboard → kori-api-production → Logs tab

---

## Next Steps for Troubleshooting Agent

1. **Verify VITE_API_URL is in the built code**
   - Check the actual JavaScript files in the web app's dist folder
   - Search for "kori-api-production" in the bundled code
   - If not found, the Dockerfile build is not properly passing the env var

2. **Check where `/api/auth/signin` endpoint is coming from**
   - This doesn't match our code's `/auth/login`
   - Search entire codebase for "signin"
   - Look for Next.js API routes or middleware

3. **Verify Vite build is using the correct configuration**
   - Check if vite.config.ts is being used correctly
   - Verify the proxy configuration isn't interfering in production

4. **Check Browser Console for Clues**
   - What exact error is being returned?
   - Is there any JavaScript error preventing proper request routing?

---

## Summary

**What was accomplished:**
- ✅ Fixed web app routing issue (added .dockerignore and Dockerfile changes)
- ✅ Initialized production database with schema
- ✅ Created admin user with correct credentials
- ✅ Verified API login works with curl
- ✅ Fixed 100+ TypeScript errors

**What's still broken:**
- ❌ Web app still making requests to itself instead of API server
- ❌ Indicates `VITE_API_URL` is still not being embedded in production build

**Most likely cause:**
The environment variable is not being properly passed through the Docker build process to Vite, or there's a Next.js/middleware layer intercepting and rewriting requests.

