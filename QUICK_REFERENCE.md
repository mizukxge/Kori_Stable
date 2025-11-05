# Quick Reference - Mizu Studio System

**System Status:** 57% Complete (6.5 of 9 phases)
**Last Update:** November 5, 2025
**Phase 5.5 Status:** ✅ COMPLETE - Email Integration Working

---

## Quick Start

### Development
```bash
# Start both API and web servers
pnpm dev

# Or separately
pnpm dev:api    # Starts on port 3001
pnpm dev:web    # Starts on port 3000
```

### Database
```bash
# Open database GUI
pnpm db:studio

# Create new migration
pnpm db:migrate

# Generate Prisma client
pnpm db:generate
```

### Type Checking
```bash
# Check for TypeScript errors
pnpm typecheck
```

---

## What's Working ✅

1. **Gallery Management**
   - Upload, organize, share photos
   - Password-protected gallery links
   - Public gallery viewing with favorites
   - Full drag-and-drop reordering

2. **Client Management**
   - Create, edit, delete clients
   - Search and filtering
   - Client contact info tracking
   - Client history

3. **Authentication**
   - Admin login/logout
   - Session management
   - Secure password storage
   - Role-based access control

4. **Contract System**
   - Create contracts from templates
   - Magic links for client signing
   - Electronic signature capture
   - Audit trail of all actions
   - Resend contracts to clients

5. **Email Integration** (NEW - Phase 5.5)
   - Automatic email on contract creation
   - Resend emails with new magic links
   - Professional HTML templates
   - Fallback email services (Nodemailer + AWS SES)
   - Error logging and retry capability

---

## What's Coming 🚀

**Phase 6 - Proposal Management System** (Ready to start)
- Create proposals with line items
- Send to clients via email
- Track proposal status
- PDF export
- Accept/decline tracking

**Phase 7 - Invoices**
- Create and send invoices
- Payment tracking
- Automatic email reminders

**Phase 8 - Rights & Metadata**
- Embed copyright metadata
- Model/property releases
- Rights presets

**Phase 9 - Analytics Dashboard**
- Business metrics
- Revenue tracking
- Client insights

---

## Key Files & Locations

### Backend
- **API Server:** `apps/api/src/index.ts`
- **Routes:** `apps/api/src/routes/`
  - `contracts.ts` - Contract endpoints
  - `galleries.ts` - Gallery endpoints
  - `clients.ts` - Client endpoints
  - `auth.ts` - Authentication
- **Services:** `apps/api/src/services/`
  - `contract.ts` - Contract business logic (NOW WITH EMAIL)
  - `ses.ts` - AWS SES email service
  - `email.ts` - Email abstraction layer
- **Database:** `apps/api/prisma/schema.prisma`

### Frontend
- **App:** `apps/web/src/App.tsx`
- **Routes:** `apps/web/src/routes/`
  - `admin/galleries/` - Gallery management
  - `admin/clients/` - Client management
  - `admin/contracts/` - Contract management
  - `gallery/[token].tsx` - Public gallery view
  - `contract/[id].tsx` - Contract signing portal
- **Components:** `apps/web/src/components/`
  - `gallery/` - Gallery display components
  - `contracts/` - Contract components
  - `ui/` - Reusable UI components
- **API Client:** `apps/web/src/lib/api.ts`

### Documentation
- `CLAUDE.md` - Development guide
- `NEXT_PHASE_OUTLINE.md` - Next phases (6-9)
- `PHASE_5.5_EMAIL_INTEGRATION_COMPLETE.md` - Email details
- `SESSION_SUMMARY_2025_11_05.md` - Last session
- `NEXT_SESSION_KICKOFF.md` - Phase 6 specifications

---

## Email System Configuration

### Option A: AWS SES (Recommended)
```env
USE_SES=true
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SENDER_EMAIL=michael@shotbymizu.co.uk
PUBLIC_URL=https://shotbymizu.co.uk
```

### Option B: Nodemailer (Works Immediately)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=your-email@gmail.com
PUBLIC_URL=https://shotbymizu.co.uk
```

### Test Email System
```bash
cd apps/api
npx tsx src/scripts/test-email.ts
```

---

## Database Models

### Key Tables
- **AdminUser** - System administrators
- **Client** - Customer records
- **Gallery** - Photo collections
- **Asset** - Photos/videos
- **Contract** - Client contracts
- **Proposal** - Client proposals (ready, needs UI)
- **Invoice** - Billing records (ready, needs UI)
- **AuditLog** - All activity tracking

---

## Git Commits (Latest)

```
38f258e Documentation: Session summary and next phase kickoff
9948eb6 Phase 5.5: Email Integration for Contracts - COMPLETE
2550f38 Contracts System - Phase 1.1: Database schema preparation
```

---

## Useful Commands

### Common Development Tasks
```bash
# Check git status
git status

# View changes
git diff

# Create new feature branch
git checkout -b feature/phase-6-proposals

# Commit changes
git add .
git commit -m "feature: implement proposals list page"

# Build for production
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint:fix
```

### Database Tasks
```bash
# Backup database
pg_dump kori_dev > backup.sql

# Seed test data
pnpm db:seed

# Reset database (destructive!)
pnpm db:reset
```

### Email Testing
```bash
# Run email test script
cd apps/api
npx tsx src/scripts/test-email.ts

# Check email logs
# (View EmailLog table in database)
```

---

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (Web)
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed
- Check PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Run `pnpm db:studio` to test connection

### Email Not Sending
- Check EMAIL_ENABLED is not false in .env
- Verify USE_SES or EMAIL_USER/PASS set
- Run `npx tsx src/scripts/test-email.ts`
- Check email logs in database (EmailLog table)

### TypeScript Errors
```bash
# Regenerate Prisma client
pnpm db:generate

# Check types
pnpm typecheck
```

---

## Architecture Quick Reference

### Frontend Stack
- **Framework:** React 18
- **Router:** React Router v7 (file-based)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn
- **Build:** Vite

### Backend Stack
- **Framework:** Fastify
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Cookie-based sessions
- **Email:** AWS SES + Nodemailer

### Deployment
- **Frontend:** Vercel/Netlify
- **Backend:** AWS Lambda/EC2/Docker
- **Database:** AWS RDS PostgreSQL
- **Email:** AWS SES (production)
- **Files:** Cloudflare R2 (planned)

---

## Testing

### Manual Testing Checklist

**Contracts (Phase 5.5 - Just Added):**
- [ ] Create new contract
- [ ] Verify email sent to client
- [ ] Click magic link in email
- [ ] Verify signing page loads
- [ ] Sign contract
- [ ] Verify status changes to SIGNED
- [ ] Test resend - email should have new link
- [ ] Old link should not work after resend

**Galleries:**
- [ ] Upload new photos
- [ ] View in gallery grid
- [ ] Click to zoom
- [ ] Mark as favorite
- [ ] Share gallery with password
- [ ] View public gallery with password

**Clients:**
- [ ] Create new client
- [ ] Search clients
- [ ] Filter by status
- [ ] Edit client info
- [ ] View contracts for client

---

## Performance Notes

- **Database Indexes:** Set on frequently queried fields
- **Image Optimization:** Thumbnails generated on upload
- **Lazy Loading:** Images use native loading="lazy"
- **Bundle Size:** React ~150KB gzipped
- **API Caching:** Consider for frequently accessed data

---

## Security Checklist

- ✅ Passwords hashed with Argon2
- ✅ Sessions secured with cookies
- ✅ CORS properly configured
- ✅ SQL injection prevented (Prisma)
- ✅ HTTPS in production
- ⚠️ CSRF tokens not yet implemented
- ⚠️ File upload validation needed
- ⚠️ Rate limiting in place but could be stricter

---

## Monitoring & Debugging

### Logs
- API logs: `pnpm dev:api` shows Pino logs
- Frontend logs: Browser console
- Database logs: PostgreSQL logs
- Email logs: EmailLog table in database

### Health Checks
```bash
# Check API health
curl http://localhost:3001/healthz

# Check API readiness
curl http://localhost:3001/readyz

# Check API version
curl http://localhost:3001/version
```

### Database Queries
```bash
# Open database GUI
pnpm db:studio

# View email logs
SELECT * FROM "EmailLog" ORDER BY "createdAt" DESC LIMIT 10;

# View audit trail
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 20;

# View contracts sent
SELECT * FROM "Contract" WHERE status = 'SENT' ORDER BY "sentAt" DESC;
```

---

## Environment Variables Reference

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - 32-char random string for sessions
- `CORS_ORIGIN` - Frontend URL for CORS
- `PUBLIC_URL` - Public URL for magic links

**Optional Variables:**
- `USE_SES` - Enable AWS SES (true/false)
- `AWS_REGION` - AWS region (default: eu-west-2)
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `SENDER_EMAIL` - Email sender address
- `EMAIL_USER` - Nodemailer email
- `EMAIL_PASS` - Nodemailer password
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_ENABLED` - Enable/disable email (default: true)
- `LOG_LEVEL` - Pino log level (default: info)

---

## Next Steps for New Developer

1. Read `CLAUDE.md` - Understand architecture
2. Read `SESSION_SUMMARY_2025_11_05.md` - See what was done
3. Read `NEXT_SESSION_KICKOFF.md` - See what's coming
4. Start Phase 6: Create proposal API endpoints
5. Ask questions in code comments (detailed!)

---

## Key Contact Points

**Email Setup Issues:**
- See: `EMAIL_SETUP_GUIDE.md` and `CLOUDFLARE_DNS_SETUP.md`

**Contract System Details:**
- See: `PHASE_5.5_EMAIL_INTEGRATION_COMPLETE.md`

**Next Phase (Phase 6):**
- See: `NEXT_PHASE_OUTLINE.md` and `NEXT_SESSION_KICKOFF.md`

**Architecture Questions:**
- See: `CLAUDE.md` and code comments

---

## Quick Stats

**Code:**
- Backend: ~1000 lines (core services)
- Frontend: ~2000 lines (components + routes)
- Migrations: ~500 lines (database)
- Documentation: ~5000 lines

**Database:**
- Tables: 15+
- Models: 12 (Prisma)
- Migrations: 5+

**APIs:**
- Endpoints: 40+
- Routes files: 5+
- Service files: 8+

**Components:**
- UI Components: 15+
- Page Routes: 8+
- Feature Components: 5+

---

**Last Updated:** November 5, 2025
**By:** Claude Code
**Status:** Ready for Phase 6 Implementation
