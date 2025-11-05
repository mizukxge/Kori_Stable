# Project Roadmap & Next Steps

**Last Updated:** November 5, 2025
**Previous Session:** Dark Mode Scrollbar Compliance & Clause Modal Restructuring
**Project Status:** Ongoing - Multiple Features Implemented

---

## Executive Summary

The Kori Photography Platform has made substantial progress with core features implemented (galleries, client management, contracts, invoices, proposals). This roadmap outlines remaining work organized by priority and complexity.

---

## Priority Matrix

### 🔴 Critical (Blocking other features)
- [ ] Form validation across all admin pages
- [ ] Error handling standardization
- [ ] API error responses consistency

### 🟠 High (Core functionality)
- [ ] Complete proposal workflow (client viewing/approval)
- [ ] Contract signing flow (signature capture)
- [ ] Payment processing integration
- [ ] Gallery sharing public page refinement

### 🟡 Medium (Quality of life)
- [ ] Bulk operations (delete, archive, export)
- [ ] Search and filtering across list pages
- [ ] Dashboard metrics and statistics
- [ ] Email notification system

### 🟢 Low (Polish and nice-to-haves)
- [ ] UI animations and transitions
- [ ] Loading states and skeletons
- [ ] Toast notifications
- [ ] Mobile responsiveness refinement

---

## Feature-by-Feature Status

### ✅ Completed
- **Gallery System** - Upload, organize, share with clients
- **Client Management** - CRUD operations, contact tracking
- **Asset Management** - RAW, EDIT, VIDEO categories
- **Dark Mode** - Full theme support with scrollbar styling
- **Clause Library** - Create, edit, manage contract clauses
- **Rights Presets** - Copyright/metadata templates
- **Contract Templates** - Create and manage contract templates
- **Invoice System** - Basic invoice creation and display
- **Proposal System** - Create proposals, client selector component

### 🔄 In Progress
- **Contract Workflows** - Signing, template application
- **Public Client Views** - Gallery, invoice, contract pages
- **Email System** - Currently on STUB provider (no actual emails)

### ❌ Not Started
- **Payment Processing** - Stripe integration
- **Accounting/Bookkeeping** - Journal entries, reconciliation
- **Analytics Dashboard** - Metrics and reporting
- **Export Features** - PDF, CSV exports

---

## Immediate Next Work (This Week)

### 1. Test Dark Mode Scrollbars (1-2 hours)
**Location:** All nine components with scrollbars
**Files:** See SESSION_SUMMARY_DARK_MODE_SCROLLBARS.md

**Tasks:**
- [ ] Toggle light/dark mode and check scrollbar appearance
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Verify scrollbars on:
  - Lightbox metadata sidebar
  - Clause editor modal
  - Contract templates modal
  - Gallery selection list
  - Rights preset modal
  - Client creation modal
  - Message conversation thread
  - Proposal client selector
- [ ] Report any visual issues

---

### 2. Standardize Modal Scrolling Pattern (2-3 hours)
**Current State:** Clause modal uses new pattern (full-page scrolling)
**Goal:** Apply same pattern to all modals for consistency

**Files to Update:**
- `apps/web/src/routes/admin/contracts/templates.tsx`
- `apps/web/src/routes/admin/rights/index.tsx`
- `apps/web/src/routes/admin/clients/index.tsx`
- Any other modals with constrained scrolling

**Pattern to Apply:**
```jsx
// Modal Container (outer - handles scrolling)
<div className="fixed inset-0 ... overflow-y-auto scrollbar-thin">
  {/* Modal Card (inner - simple flow) */}
  <div className="bg-card rounded-xl overflow-hidden">
    {/* Header */}
    {/* Content */}
    {/* Footer */}
  </div>
</div>
```

---

### 3. Audit & Fix Form Validation (3-4 hours)
**Problem:** Some forms lack proper validation feedback
**Current State:** Input components exist but validation logic incomplete

**Forms to Review:**
- [ ] Clause editor (title, slug, content required)
- [ ] Contract template (name, clauses required)
- [ ] Client creation (name, email required)
- [ ] Rights preset (title, metadata required)
- [ ] Gallery creation (name required, password optional)

**Validation Needed:**
- [ ] Real-time field validation
- [ ] Error messages display
- [ ] Form submit prevention on invalid data
- [ ] Visual feedback (red borders, icons)

---

### 4. Implement Contract Signing Flow (6-8 hours)
**Current State:** Contract component exists but signing incomplete
**Impact:** Critical for client-facing workflows

**Components Needed:**
- [ ] SignatureCanvas component (already created)
- [ ] OTPInput component (already created)
- [ ] Contract signing page
- [ ] Signature storage/verification
- [ ] Signed contract PDF generation

**API Endpoints Needed:**
- `POST /admin/contracts/:id/send` - Send contract to client
- `POST /contracts/:id/sign` - Client signature submission
- `POST /contracts/:id/verify` - Verify signature (OTP)

---

### 5. Setup Email Service Properly (4-6 hours)
**Current State:** STUB provider (no emails actually sent)
**Options:**
- AWS SES (already explored)
- Postmark (already explored)
- SendGrid
- Mailgun

**Tasks:**
- [ ] Choose email provider
- [ ] Configure credentials in `.env`
- [ ] Create email templates
- [ ] Test email sending
- [ ] Implement retry logic

**Critical Emails:**
- Contract signing requests
- Invoice payment reminders
- Proposal notifications
- Client gallery access notifications

---

## Medium-Term Roadmap (2-3 Weeks)

### Public Client Views
**Status:** Routes exist but incomplete
**Files:** `apps/web/src/routes/client/*`, `apps/web/src/routes/contract/*`

**Tasks:**
- [ ] Implement `/gallery/[token]` - Public gallery view
- [ ] Implement `/contract/[token]` - Contract signing page
- [ ] Implement `/invoice/[id]/pay` - Payment page
- [ ] Implement `/proposal/[token]` - Proposal review page
- [ ] Add authentication (magic links, passwords)

### Dashboard Enhancement
**Current:** Basic stats display
**Goal:** Comprehensive metrics and insights

**Add:**
- [ ] Revenue metrics (YTD, MTD, trends)
- [ ] Client statistics (new, active, churned)
- [ ] Gallery performance (views, downloads)
- [ ] Invoice aging analysis
- [ ] Proposal conversion rates

### Bulk Operations
**Goal:** Improve admin efficiency

**Operations to Add:**
- [ ] Bulk delete galleries
- [ ] Bulk archive assets
- [ ] Batch email clients
- [ ] Export client list (CSV)
- [ ] Export invoice register (CSV)

---

## Long-Term Roadmap (1-2 Months)

### Payment Processing Integration
**Status:** Not started
**Impact:** Revenue-critical feature

**Integration Options:**
- Stripe (recommended)
- PayPal
- Square

**Features:**
- [ ] Invoice payment acceptance
- [ ] Recurring payments for retainers
- [ ] Payment history tracking
- [ ] Automatic receipt generation

### Accounting Integration
**Status:** Schema exists but not implemented
**Goal:** Bookkeeping automation

**Features:**
- [ ] Journal entry creation
- [ ] Account reconciliation
- [ ] P&L reporting
- [ ] Tax preparation export
- [ ] Integration with Quickbooks/Xero

### Cloud Storage Migration
**Current:** Local file storage in `apps/api/uploads/`
**Goal:** Cloudflare R2 + CDN

**Benefits:**
- Scalability (no server storage limits)
- Faster downloads (CDN)
- Zero egress fees (R2 vs AWS S3)
- Automatic backups

---

## Known Issues to Address

### 1. Form Validation Gaps
- Clause slug validation (unique constraint)
- Email format validation
- Password strength validation
- Required field indicators

### 2. Error Handling
- API errors not always user-friendly
- No toast notifications for success/failure
- Missing loading states on buttons
- Network timeout handling

### 3. Mobile Responsiveness
- Modals might overflow on mobile
- Sidebar navigation untested
- Gallery grid not responsive
- Forms may have layout issues

### 4. Performance
- Large galleries may be slow (virtualization needed)
- Asset uploads not optimized (no progress tracking)
- No pagination on contract/invoice lists
- Missing database indexes on frequently queried fields

---

## Testing Checklist for Next Session

Before committing code, ensure:

- [ ] **TypeScript:** `pnpm typecheck` passes
- [ ] **Compilation:** `pnpm build` succeeds
- [ ] **Development:** `pnpm dev` runs without errors
- [ ] **Linting:** `pnpm lint:fix` applied
- [ ] **Dark Mode:** Toggle theme and verify UI
- [ ] **Scrollbars:** Check all overflow elements
- [ ] **Forms:** Test required fields and validation
- [ ] **API:** Health check at `/healthz` passes
- [ ] **Database:** Latest migrations applied

---

## Architecture Notes for Future Development

### Component Organization
- `/components/ui` - Shadcn UI & custom components
- `/components/gallery` - Gallery-specific components
- `/components/contracts` - Contract-related components
- `/components/proposals` - Proposal-related components
- `/components/layout` - Layout wrappers (Header, Sidebar, etc)

### Routing Pattern
- Admin routes: `/admin/[feature]/[id].tsx`
- Public routes: `/[feature]/[token].tsx`
- Client portal: `/portal/[page].tsx`

### API Pattern
- Routes: `/api/src/routes/[feature].ts`
- Services: `/api/src/services/[feature].ts`
- Schemas: `/api/src/schemas/[feature].ts`

### Dark Mode Implementation
- Root provider: `ThemeProvider` in `/components/providers/ThemeProvider.tsx`
- CSS variables: `/styles/tokens.css` (light/dark mode)
- Component support: All components use semantic classes (`bg-card`, `text-foreground`)

---

## Development Tips

### Running Commands
```bash
# Development
pnpm dev              # Both API and Web
pnpm dev:api          # API only (port 3002)
pnpm dev:web          # Web only (port 3001)

# Database
pnpm db:migrate       # Create/apply migrations
pnpm db:seed          # Seed test data
pnpm db:studio        # Open Prisma Studio

# Type Checking
pnpm typecheck        # Check all TypeScript
pnpm typecheck:api    # API only

# Building
pnpm build            # Production build
pnpm lint:fix         # Lint and fix
```

### Common Debugging
- API errors: Check `/healthz` endpoint
- CORS issues: Verify `CORS_ORIGIN` in `.env`
- Database issues: Check `DATABASE_URL` connection string
- Dark mode issues: Ensure `<html class="dark">` in DOM
- Scrollbar issues: Verify `scrollbar-thin` class applied

---

## Session Template for Next Time

When starting a new session, follow this structure:

1. **Review** - Check git status and recent commits
2. **Assess** - Understand current state of feature
3. **Plan** - Break down work into 30-60 min tasks
4. **Execute** - Code with frequent git commits
5. **Test** - Verify changes don't break other features
6. **Document** - Update relevant docs and create session summary
7. **Commit** - Create final commit with clear message

---

## Questions for Next Session

1. Should all modals use the new full-page scrolling pattern?
2. Which email provider to use (SES, Postmark, SendGrid)?
3. Priority: Payment processing vs Contract signing first?
4. Should mobile responsiveness be tested/fixed now or later?
5. Any specific analytics metrics needed for dashboard?

---

## Quick Reference

**Last Commit:** d1aef5b - Dark mode scrollbar fixes & clause modal restructuring
**API Port:** 3002
**Web Port:** 3001
**Database:** PostgreSQL (connection via `DATABASE_URL`)
**Theme:** Tailwind CSS with light/dark mode support

---

## Resources

- **CLAUDE.md** - Project overview and essential commands
- **SESSION_SUMMARY_DARK_MODE_SCROLLBARS.md** - This session's work
- **Build Prompts/** - Feature specifications
- **docs/adr/** - Architecture Decision Records

**End of Roadmap**
