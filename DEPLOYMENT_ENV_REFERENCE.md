# Appointments System: Environment Variables Reference

**Version:** v0.5
**Last Updated:** 2025-12-22

Complete guide for setting environment variables in development, staging, and production environments.

---

## 📋 Environment Profiles

### Development (Local)
- Database: Local PostgreSQL (or Docker)
- Email: Mailhog or console logging
- Teams: Mock/test credentials
- Log Level: Debug
- CORS: Localhost

### Staging
- Database: Production-like PostgreSQL (sanitized)
- Email: Real SMTP (Office365/SendGrid)
- Teams: Real Azure AD app
- Log Level: Info
- CORS: Staging domain

### Production
- Database: Production PostgreSQL (encrypted backups)
- Email: Real SMTP with redundancy
- Teams: Production Azure AD app
- Log Level: Info/Warn
- CORS: Production domain only

---

## 🔌 API Server Variables

### Database Connection
```env
# PostgreSQL connection string
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://user:password@localhost:5432/kori_db

# Connection pool settings (optional, Prisma defaults)
# DATABASE_POOL_SIZE=10
```

**Example for different environments:**
```bash
# Local
DATABASE_URL=postgresql://dev:devpass@localhost:5432/kori_dev

# Staging
DATABASE_URL=postgresql://staging:secure_password@rds-staging.aws.com:5432/kori_staging

# Production
DATABASE_URL=postgresql://produser:very_secure_password@rds-prod.aws.com:5432/kori_prod
```

### Server Configuration
```env
# Port and host
API_PORT=3001
API_HOST=0.0.0.0  # or 127.0.0.1 for local only

# Node environment
NODE_ENV=production  # or development

# Session security
SESSION_SECRET=generate_with_openssl_rand_base64_32
# Generate: openssl rand -base64 32
# Must be unique per environment
# Store securely in secrets manager
```

**Example SESSION_SECRET generation:**
```bash
# Generate secure session secret
openssl rand -base64 32
# Output example: XrVsW8pQ2nL9kM6jB3xY5z7A8cD1eF0gH4iJ2kL5mN

# Then set:
SESSION_SECRET=XrVsW8pQ2nL9kM6jB3xY5z7A8cD1eF0gH4iJ2kL5mN
```

### CORS Configuration
```env
# Comma-separated list of allowed origins
# Do NOT include trailing slash

# Development
CORS_ORIGIN=http://localhost:3000

# Staging
CORS_ORIGIN=https://staging.kori.com

# Production
CORS_ORIGIN=https://kori.com

# Multiple origins (if needed)
CORS_ORIGIN=https://kori.com,https://admin.kori.com,https://app.kori.com
```

### Logging
```env
# Log level: error, warn, info, debug, trace
LOG_LEVEL=debug       # Local development
LOG_LEVEL=info        # Staging & Production
LOG_LEVEL=warn        # Critical issues only

# Log format
# Defaults to pretty-print in development
# JSON in production for log aggregation
```

---

## 📧 Email Configuration (SMTP)

### Office 365 / Microsoft 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@yourcompany.com
SMTP_PASS=office365_app_password  # Use app password, not account password
EMAIL_FROM=appointments@yourcompany.com

# Email settings
EMAIL_FROM_NAME=Appointments System
```

**Setup Steps:**
1. Go to Microsoft 365 admin center
2. Create app password for SMTP
3. Use that password (not your regular password)
4. Enable SMTP authentication in Exchange

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key_here
EMAIL_FROM=noreply@yourcompany.com
```

**Setup Steps:**
1. Go to SendGrid dashboard
2. Create API key (Mail Send permission)
3. Copy API key to SMTP_PASS
4. Use "apikey" as SMTP_USER

### Gmail (Development Only)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password  # Generate app password in Google Account
EMAIL_FROM=your_email@gmail.com
```

**Setup Steps:**
1. Enable 2FA on Gmail account
2. Go to myaccount.google.com/apppasswords
3. Generate app password for Mail
4. Use that password in SMTP_PASS

### Testing SMTP Configuration
```bash
# Test if SMTP credentials work
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) console.error('SMTP Error:', err);
  else console.log('SMTP Configuration Valid');
});
"
```

---

## 🔷 Microsoft Teams OAuth Configuration

### Azure AD App Registration

1. **Go to Azure Portal** (portal.azure.com)
2. **Create new app registration:**
   - Name: "Kori Appointments"
   - Supported account types: "Single tenant"

3. **Get credentials:**
   - Application (client) ID → `TEAMS_CLIENT_ID`
   - Directory (tenant) ID → `TEAMS_TENANT_ID`

4. **Create client secret:**
   - Certificates & secrets → New client secret
   - Copy value → `TEAMS_CLIENT_SECRET`
   - **⚠️ Save immediately! Cannot retrieve later**

5. **Set redirect URIs:**
   - Web → Add URI: `https://your-api-domain.com/auth/teams/callback`
   - (or `http://localhost:3001/auth/teams/callback` for local)

6. **Grant API permissions:**
   - API permissions → Add permission
   - Microsoft Graph → Application permissions
   - Calendar.ReadWrite
   - Calendars.ReadWrite
   - OnlineMeetings.ReadWrite
   - User.Read.All

### Environment Variables
```env
# Azure AD credentials
TEAMS_CLIENT_ID=your_azure_app_id_here
TEAMS_CLIENT_SECRET=your_azure_secret_here
TEAMS_TENANT_ID=your_azure_tenant_id_here

# Provider selection
MEETING_PROVIDER=teams  # or 'mock' for testing

# OAuth callback (must match Azure AD redirect URI)
TEAMS_OAUTH_CALLBACK=https://your-api-domain.com/auth/teams/callback
```

### Example Credentials
```bash
# Development (local testing)
TEAMS_CLIENT_ID=12345678-1234-1234-1234-123456789012
TEAMS_CLIENT_SECRET=test_secret_abc123xyz789
TEAMS_TENANT_ID=11111111-1111-1111-1111-111111111111
MEETING_PROVIDER=mock  # Use mock for local dev

# Production (real Azure AD app)
TEAMS_CLIENT_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
TEAMS_CLIENT_SECRET=very_secure_production_secret_here
TEAMS_TENANT_ID=bbbbbbbb-2222-2222-2222-222222222222
MEETING_PROVIDER=teams
```

### Testing Teams Integration
```bash
# Check if credentials work
curl -X POST https://login.microsoftonline.com/{TEAMS_TENANT_ID}/oauth2/v2.0/token \
  -d "client_id={TEAMS_CLIENT_ID}" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "client_secret={TEAMS_CLIENT_SECRET}" \
  -d "grant_type=client_credentials"

# Response should include "access_token"
```

---

## ⏰ Reminders Configuration

### Automatic Reminder Scheduler
```env
# How often to check for due reminders (seconds)
REMINDER_CHECK_INTERVAL_SECONDS=300  # Every 5 minutes

# When to send 24-hour reminder (minutes before appointment)
REMINDER_24HOUR_MINUTES=1440  # 24 hours (24 * 60)

# When to send 1-hour reminder (minutes before appointment)
REMINDER_1HOUR_MINUTES=60    # 1 hour
```

**Recommended Settings:**
```bash
# Production (standard)
REMINDER_CHECK_INTERVAL_SECONDS=300
REMINDER_24HOUR_MINUTES=1440
REMINDER_1HOUR_MINUTES=60

# Staging (faster for testing)
REMINDER_CHECK_INTERVAL_SECONDS=30   # Check every 30 seconds
REMINDER_24HOUR_MINUTES=2             # 2 minutes before
REMINDER_1HOUR_MINUTES=1              # 1 minute before
```

---

## 🌐 Web Frontend Variables

### API Configuration
Create `apps/web/.env` (if needed for build-time config):

```env
# API endpoint
VITE_API_URL=http://localhost:3001

# For production builds:
# VITE_API_URL=https://api.kori.com
```

**Note:** Frontend gets API URL from browser location by default. Override if needed.

### Features (Optional)
```env
# Enable/disable features
VITE_ENABLE_METRICS=true
VITE_ENABLE_EXPORT=true
VITE_ENABLE_TEAMS=true
```

---

## 🔑 Complete Environment Template

### Development (.env.local)
```bash
# Database
DATABASE_URL=postgresql://dev:devpass@localhost:5432/kori_dev

# Server
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=development
SESSION_SECRET=dev_secret_change_in_staging_and_production
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Email (use test service)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
EMAIL_FROM=test@localhost

# Teams (mock for local testing)
TEAMS_CLIENT_ID=mock
TEAMS_CLIENT_SECRET=mock
TEAMS_TENANT_ID=mock
MEETING_PROVIDER=mock

# Reminders (fast for testing)
REMINDER_CHECK_INTERVAL_SECONDS=30
REMINDER_24HOUR_MINUTES=2
REMINDER_1HOUR_MINUTES=1
```

### Staging (.env.staging)
```bash
# Database
DATABASE_URL=postgresql://staging:secure_password@rds-staging.aws.com:5432/kori_staging

# Server
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET=generate_new_secure_value_here_staging
CORS_ORIGIN=https://staging.kori.com

# Logging
LOG_LEVEL=info

# Email
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=staging-noreply@company.com
SMTP_PASS=office365_app_password
EMAIL_FROM=appointments@company.com

# Teams (real integration for testing)
TEAMS_CLIENT_ID=azure_app_id_staging
TEAMS_CLIENT_SECRET=azure_secret_staging
TEAMS_TENANT_ID=azure_tenant_id
MEETING_PROVIDER=teams

# Reminders (standard)
REMINDER_CHECK_INTERVAL_SECONDS=300
REMINDER_24HOUR_MINUTES=1440
REMINDER_1HOUR_MINUTES=60
```

### Production (.env.production)
```bash
# Database
DATABASE_URL=postgresql://produser:very_secure_password@rds-prod.aws.com:5432/kori_prod

# Server
API_PORT=3001
API_HOST=127.0.0.1
NODE_ENV=production
SESSION_SECRET=generate_new_secure_value_here_production
CORS_ORIGIN=https://kori.com

# Logging
LOG_LEVEL=warn

# Email
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=production-noreply@company.com
SMTP_PASS=office365_app_password
EMAIL_FROM=appointments@company.com

# Teams
TEAMS_CLIENT_ID=azure_app_id_production
TEAMS_CLIENT_SECRET=azure_secret_production
TEAMS_TENANT_ID=azure_tenant_id
MEETING_PROVIDER=teams

# Reminders
REMINDER_CHECK_INTERVAL_SECONDS=300
REMINDER_24HOUR_MINUTES=1440
REMINDER_1HOUR_MINUTES=60
```

---

## 🔒 Secrets Management Best Practices

### DO ✅
- ✅ Store secrets in environment variables
- ✅ Use secrets manager (AWS Secrets Manager, Azure Key Vault, Vault)
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment
- ✅ Store secrets in secure .env files (not in git)
- ✅ Use strong, random values (min 32 characters)
- ✅ Audit access to secrets
- ✅ Regenerate secrets if compromised

### DON'T ❌
- ❌ Commit .env files to git
- ❌ Log secrets in console
- ❌ Use same secret across environments
- ❌ Use default/placeholder values in production
- ❌ Share secrets via email or chat
- ❌ Store secrets in code comments
- ❌ Use weak passwords

### Secrets Manager Integration

**AWS Secrets Manager:**
```bash
# Retrieve secret
aws secretsmanager get-secret-value --secret-id kori-prod-env --query SecretString --output text > .env.production

# Update secret
aws secretsmanager update-secret --secret-id kori-prod-env --secret-string "$(cat .env.production)"
```

**Azure Key Vault:**
```bash
# Get secret
az keyvault secret show --vault-name kori-prod --name SMTP-PASS --query value

# List all secrets
az keyvault secret list --vault-name kori-prod
```

---

## ✅ Validation Checklist

Before deploying to any environment:

```bash
# Staging/Production only:
[ ] DATABASE_URL set and valid
[ ] SESSION_SECRET changed from default
[ ] SMTP credentials tested
[ ] TEAMS_CLIENT_SECRET is real (not mock)
[ ] CORS_ORIGIN matches domain
[ ] NODE_ENV=production
[ ] LOG_LEVEL appropriate
[ ] API_HOST not exposing internal network
[ ] HTTPS enforced (in reverse proxy/load balancer)
[ ] All required env vars present (no blanks)
[ ] Secrets stored in secure location (not in git)
[ ] Backup of old environment (if updating)
```

**Quick Validation Script:**
```bash
#!/bin/bash
# .env-validate.sh

REQUIRED_VARS=(
  "DATABASE_URL"
  "API_PORT"
  "API_HOST"
  "NODE_ENV"
  "SESSION_SECRET"
  "CORS_ORIGIN"
  "SMTP_HOST"
  "SMTP_PORT"
  "SMTP_USER"
  "SMTP_PASS"
  "EMAIL_FROM"
  "TEAMS_CLIENT_ID"
  "TEAMS_CLIENT_SECRET"
  "TEAMS_TENANT_ID"
  "MEETING_PROVIDER"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
  else
    echo "✅ $var set"
  fi
done
```

---

## 🚀 Environment Variable Loading Priority

The application loads variables in this order:

1. `.env.production` (if NODE_ENV=production)
2. `.env.staging` (if NODE_ENV=staging)
3. `.env.local` (always, overrides above)
4. System environment variables (highest priority)

**Example:**
```bash
# Can override .env file with system env
export DATABASE_URL=different_url_here
pnpm dev:api  # Uses system env var
```

---

## 📞 Troubleshooting Environment Issues

### "Cannot connect to database"
1. Check DATABASE_URL format
2. Verify PostgreSQL is running
3. Test connection: `psql $DATABASE_URL`
4. Check credentials are correct
5. Verify network access (firewall)

### "SMTP authentication failed"
1. Verify SMTP credentials are correct
2. Check SMTP_HOST and SMTP_PORT
3. Verify SMTP user is enabled
4. Test with: `telnet $SMTP_HOST $SMTP_PORT`
5. For Office365, use app password not account password

### "Teams API errors"
1. Verify TEAMS_CLIENT_ID matches Azure app
2. Verify TEAMS_CLIENT_SECRET is current
3. Verify TEAMS_TENANT_ID is correct
4. Check Azure app has required permissions
5. Verify redirect URI in Azure matches actual URL

### "CORS errors"
1. Verify CORS_ORIGIN matches browser origin
2. Check CORS_ORIGIN format (no trailing slash)
3. Verify multiple origins separated by comma
4. Restart API after changing CORS_ORIGIN
5. Check browser network tab for exact origin

---

## 📝 Environment Audit Log

Document all environment changes:

```markdown
# Environment Changes Log

## 2025-12-22
- [ ] Created .env.staging
- [ ] Created .env.production
- [ ] Tested SMTP connection
- [ ] Tested Teams OAuth
- [ ] Updated SESSION_SECRET
- Reviewed by: [name]

## 2025-12-23
- [ ] Deployed to staging
- [ ] All health checks passed
- Verified by: [name]

## 2025-12-24
- [ ] Deployed to production
- [ ] Database migrated
- [ ] Teams integration live
- Verified by: [name]
```

---

**Status:** Ready for deployment with secure environment configuration ✅

All environment variables documented and validated.
