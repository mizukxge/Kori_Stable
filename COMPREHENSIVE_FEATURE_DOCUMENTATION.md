# COMPREHENSIVE KORI APPLICATION FEATURE DOCUMENTATION

**Last Updated:** November 7, 2025
**Application Version:** 1.0.0-alpha
**Status:** Feature Documentation Complete

---

## TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [Frontend Routes & Pages](#frontend-routes--pages)
3. [API Endpoints](#api-endpoints)
4. [Database Models](#database-models)
5. [Major Features & Functionality](#major-features--functionality)
6. [Architecture Overview](#architecture-overview)
7. [Feature Completion Status](#feature-completion-status)

---

## EXECUTIVE SUMMARY

**Kori Photography Platform** is a professional photography workflow management system built with a **Node.js/Fastify backend** and **React 18 frontend**. It provides end-to-end solutions for:

- Client gallery management and proofing
- Proposal generation and e-signature acceptance
- Contract management with sophisticated e-signing workflows
- Invoice generation and payment tracking
- Comprehensive accounting with reconciliation
- Bank transaction import and matching
- Records archiving with legal hold and retention policies
- RBAC-based access control
- Email automation and notifications
- Asset management with metadata and rights tracking

**Tech Stack:**
- Backend: Node.js, Fastify, Prisma ORM, PostgreSQL
- Frontend: React 18, Vite, React Router v7, Tailwind CSS
- Monorepo: pnpm workspaces (`apps/api`, `apps/web`)

---

## FRONTEND ROUTES & PAGES

### Location: `apps/web/src/routes/` and `apps/web/src/pages/`

---

### PUBLIC ROUTES (No Authentication Required)

#### Gallery Viewing
- **Route:** `/gallery/:token`
- **File:** `routes/gallery/[token].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Password-protected gallery viewing
  - Unique token-based sharing
  - Infinite scroll with 12-item pagination
  - Full-screen lightbox viewer with zoom/pan
  - Keyboard navigation (arrows, Home, End, Esc)
  - Favorite marking (persistent in database)
  - Client proofing selections (HEART/FLAG/REJECT)
  - Metadata sidebar with EXIF/IPTC info
  - Download capabilities (if permitted)
  - Gallery expiration support

#### Contract Viewing & Signing
- **Route:** `/contract/:token`
- **File:** `routes/contract/$token.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Magic link access to contracts
  - Password-protected contract portal
  - View full contract content before signing
  - Document metadata display
  - Status tracking (DRAFT, SENT, VIEWED, SIGNED, etc.)

#### Contract E-Signing
- **Route:** `/contract/sign/:token`
- **File:** `routes/contract/sign/$token.tsx`
- **Status:** ✅ Complete
- **Features:**
  - OTP verification before access
  - Signature capture via canvas
  - Document preview during signing
  - PDF generation with embedded signature
  - SHA-256 hash integrity verification
  - Multi-page contract support
  - Signature timestamp tracking

#### Proposal Viewing
- **Route:** `/client/proposal/:proposalNumber`
- **File:** `routes/client/proposal/[proposalNumber].tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - View proposal details
  - Line item breakdown with pricing
  - Terms and conditions display
  - Proposal acceptance flow (planned)

#### Invoice Viewing
- **Route:** `/client/invoice/:invoiceNumber`
- **File:** `routes/client/invoice/[invoiceNumber].tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - View invoice details
  - Payment information
  - Due date tracking
  - Payment options display (planned)

#### Client Payment Portal
- **Route:** `/payment/client`
- **File:** `routes/payment/client-payment.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Stripe payment processing (planned)
  - Multiple payment methods
  - Payment confirmation

#### Inquiry/Lead Capture Form
- **Route:** `/inquiry`
- **File:** `routes/inquiry.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Multi-step form (4 steps)
  - Contact information capture (name, email, phone, company)
  - Inquiry type selection (Wedding, Portrait, Commercial, Event, Family, Product, Real Estate, Headshot, Other)
  - Shoot details (date, description, location, special requirements)
  - Budget range selection (£0-500, £500-1k, £1k-2.5k, £2.5k-5k, £5k+)
  - File attachments (up to 5 files, 10MB each)
  - Progress indicator
  - Form validation at each step
  - Draft auto-save to localStorage
  - Dark mode support with toggle
  - Success confirmation page
  - Accessibility features (keyboard navigation, ARIA labels)

#### Public Client Signup
- **Route:** `/new-client`
- **File:** `routes/new-client.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Client type selection (Individual, Small Business, Organization)
  - Conditional form fields based on client type
  - Full contact information capture
  - Address fields (conditional based on type)
  - Form validation
  - Email verification (pending)
  - Status auto-set to PENDING
  - Source tracking (website origin)
  - Dark mode support
  - Multi-step progress indicator

---

### ADMIN AUTHENTICATION & LOGIN

#### Admin Login
- **Route:** `/admin/login`
- **File:** `routes/admin/login.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Email/password authentication
  - Form validation (email format, password required)
  - Error handling and display
  - Cookie-based session creation
  - 7-day session expiry
  - Redirect to dashboard on success
  - "Remember me" option (planned)
  - Password reset flow (planned)

#### Client Portal Login
- **Route:** `/portal/login`
- **File:** `pages/portal/Login.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Magic link login (planned)
  - Demo access (currently hardcoded)
  - Client identification

---

### ADMIN DASHBOARD & HOME

#### Admin Dashboard
- **Route:** `/`
- **File:** `pages/admin/Dashboard.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Welcome message
  - Key metrics cards (total clients, active invoices, proposals, contracts)
  - Recent activities list
  - Analytics summary (planned)
  - Quick action buttons (planned)
  - Calendar widget (planned)

#### Design System Demo
- **Route:** `/design-system`
- **File:** `pages/DesignSystemDemo.tsx`
- **Status:** ✅ Complete
- **Features:**
  - UI component showcase
  - Button variants (primary, secondary, outline, ghost, destructive)
  - Form components demonstration
  - Color palette reference
  - Typography samples
  - Interactive examples

---

### ADMIN GALLERY MANAGEMENT

#### Gallery List
- **Route:** `/admin/galleries`
- **File:** `routes/admin/galleries/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all galleries with pagination
  - Gallery name and description
  - Asset count
  - Creation date
  - Gallery status (active, expired, archived)
  - Client association
  - Filter by client
  - Filter by status
  - Search by name
  - Create new gallery button
  - Delete gallery with confirmation
  - Password-protected indicator
  - Expiry date display
  - Quick preview thumbnails

#### Gallery Detail & Editor
- **Route:** `/admin/galleries/:id`
- **File:** `routes/admin/galleries/[id].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Gallery metadata editing (name, description)
  - Asset grid with infinite scroll
  - Drag-and-drop asset reordering via @dnd-kit
  - Set cover photo
  - Remove assets from gallery
  - Gallery password management
  - Gallery expiry date setting
  - Toggle gallery active/inactive status
  - View gallery token and share link
  - Gallery statistics (asset count, view count, total size)
  - Lightbox preview
  - Batch operations (bulk assign, bulk remove)
  - Aspect ratio modes for thumbnails
  - Client information display
  - Download all assets (planned)

---

### ADMIN CLIENT MANAGEMENT

#### Client List
- **Route:** `/admin/clients`
- **File:** `routes/admin/clients/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all clients with pagination
  - Client name, email, phone
  - Company information
  - Client status (ACTIVE, INACTIVE, PENDING, ARCHIVED)
  - Status filtering with badges
  - Search by name, email, company
  - Filter by status
  - Create new client button
  - Client creation date
  - Sort by name, date, status
  - Client ID (copyable)
  - Contact information summary
  - Quick action buttons (view, edit, delete)

#### Client Detail & Edit
- **Route:** `/admin/clients/:id`
- **File:** `routes/admin/clients/[id].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Client information display and editing
    - Full name
    - Email address (unique constraint)
    - Phone number
    - Company name
    - Client type (Individual, Small Business, Organization)
  - Address information
    - Street address
    - City
    - State/Province
    - Postal code
    - Country
  - Edit form with validation
  - Dark mode input styling
  - Save changes button
  - Client status management (ACTIVE, INACTIVE, ARCHIVED, PENDING)
  - "Approve Client" button for PENDING status
  - Associated galleries list
  - Associated invoices list
  - Associated proposals list
  - Associated contracts list
  - Client statistics
  - Audit log (last 10 changes)
  - Created/updated timestamps

---

### ADMIN INQUIRY MANAGEMENT

#### Inquiry List
- **Route:** `/admin/inquiries`
- **File:** `routes/admin/inquiries/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all inquiries with pagination
  - Inquiry type with icons (Wedding 💒, Portrait 👤, Commercial 🏢, Event 🎉, Family 👨‍👩‍👧‍👦, Product 📦, Real Estate 🏠, Headshot 📸, Other ❓)
  - Inquirer name and email
  - Phone number
  - Budget range
  - Shoot date
  - Inquiry status (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, CONVERTED, REJECTED)
  - Status filtering with color badges
  - Search by name, email, phone
  - Filter by inquiry type
  - Filter by budget range
  - Filter by status
  - Sort by date, name, budget
  - Convert to client button
  - Send email button
  - View details button
  - Delete inquiry with confirmation
  - Submission date tracking
  - IP address and user agent tracking

#### Inquiry Detail
- **Route:** `/admin/inquiries/:id`
- **File:** `routes/admin/inquiries/[id].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Full inquiry information display
    - Inquirer details (name, email, phone, company)
    - Inquiry type with icon
    - Shoot date and location
    - Shoot description
    - Special requirements
    - Budget range
    - Submitted files/attachments
  - Status management (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, CONVERTED, REJECTED)
  - Internal notes field
  - Tag/categorization (planned)
  - Email communication form
    - Recipient pre-filled
    - Subject field
    - Message body
    - Template selection (planned)
    - Send button
  - Convert to client action
    - Auto-populate client form from inquiry
    - Create new client
  - Follow-up reminder (planned)
  - Audit trail of interactions
  - IP address and source tracking
  - View tracking (if opened email)

---

### ADMIN RIGHTS & COMPLIANCE

#### Rights Presets
- **Route:** `/admin/rights`
- **File:** `routes/admin/rights/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all rights presets
  - Create new rights preset
    - Preset name
    - Creator/photographer name
    - Copyright notice template
    - Usage rights declaration
    - Credit line template
    - Attribution requirements
  - Edit existing presets
  - Delete presets with confirmation
  - Apply presets to assets (batch operation)
  - Metadata embedding verification (planned)
  - Search presets by name
  - Filter by creator
  - Preview embedded metadata

---

### ADMIN CONTRACT SYSTEM

#### Contract List
- **Route:** `/admin/contracts`
- **File:** `routes/admin/contracts/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all contracts with pagination
  - Contract number and title
  - Client name
  - Contract type (SERVICE_AGREEMENT, BOOKING_CONTRACT, LICENSE_AGREEMENT, etc.)
  - Status (DRAFT, SENT, VIEWED, SIGNED, COUNTERSIGNED, ACTIVE, EXPIRED, VOIDED)
  - Status filtering with color badges
  - Created date
  - Signed date
  - Expiry date tracking
  - PDF generation status indicator
  - E-signature status indicator
  - Search by contract number, title, client name
  - Filter by status
  - Filter by client
  - Filter by template type
  - Sort options
  - View contract button
  - Send for signature button
  - Void contract button with reason
  - Delete contract with confirmation
  - Download PDF button
  - Share link button

#### Contract Detail & Viewer
- **Route:** `/admin/contracts/:id`
- **File:** `routes/admin/contracts/[id].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Display full contract content
  - Contract metadata
    - Contract number
    - Title
    - Client name and email
    - Template type
    - Creation date
    - Signing deadline
  - E-signature status tracking
    - Sent date
    - Viewed date
    - Signed date
    - Signature timestamp
    - Signer email
  - Contract event history (CREATED, SENT, VIEWED, SIGNED, VOIDED, EXPIRED)
  - Magic link generation and sharing
  - Resend contract button
  - Download PDF button
  - PDF hash verification status
  - Void contract functionality
  - Lock/unlock functionality for countersignature
  - View signature image
  - Edit contract (DRAFT only)
  - Delete contract

#### Contract Dashboard
- **Route:** `/admin/contracts/dashboard`
- **File:** `routes/admin/contracts/dashboard.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Contract overview metrics
  - Status breakdown (DRAFT, SENT, VIEWED, SIGNED, ACTIVE, VOIDED, EXPIRED)
  - Total contracts count
  - Contracts awaiting signature (pending)
  - Average signing time
  - Expiring soon alerts
  - Voided contracts summary
  - Charts and visualizations (planned)

#### Clause Management
- **Route:** `/admin/contracts/clauses`
- **File:** `routes/admin/contracts/clauses.tsx` or `routes/admin/contracts/clauses/index.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - List all clauses with search and filtering
  - Clause title and slug (URL-friendly identifier)
  - Clause category/tags
  - Mandatory flag indicator
  - Conditional logic indicator
  - Create new clause button
    - Clause name
    - Body content (rich text editor)
    - Tags/categories
    - Mark as mandatory toggle
    - Conditional rules (JSONLogic)
  - Edit existing clauses
  - Delete clauses with usage check
  - View clause full text
  - Clause preview
  - Reusability metrics
  - Version control (planned)

#### Contract Templates
- **Route:** `/admin/contracts/templates`
- **File:** `routes/admin/contracts/templates/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all contract templates
  - Template name and type (SERVICE_AGREEMENT, BOOKING_CONTRACT, LICENSE_AGREEMENT, MODEL_RELEASE, NDA, etc.)
  - Published status indicator
  - Creation date
  - Last modified date
  - Event type association (BOOKING_CONFIRMED, GALLERY_COMPLETE, INVOICE_DUE, PAYMENT_RECEIVED, etc.)
  - Create new template button
  - Edit template button
  - Delete template with confirmation
  - Publish/unpublish template
  - View template preview
  - Duplicate template
  - Associated mandatory clauses list

#### Template Editor
- **Route:** `/admin/contracts/templates/:id/edit`
- **File:** `routes/admin/contracts/templates/[id]/edit.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Template metadata editing
    - Name
    - Type selection
    - Event type association
    - Description
  - Template content editor
    - Rich text editor for body content
    - Variable insertion ({{clientName}}, {{contractNumber}}, {{date}}, etc.)
    - Markdown support (planned)
  - Mandatory clauses selector
    - Add/remove mandatory clauses
    - Clause ordering
    - Clause preview
  - Conditional rules for clause inclusion
    - JSONLogic rule builder
    - Rule testing/preview (planned)
  - HTML preview
  - Save changes button
  - Publish template action
  - Version history (planned)
  - Auto-save drafts

---

### ADMIN PROPOSAL SYSTEM

#### Proposal List
- **Route:** `/admin/proposals`
- **File:** `routes/admin/proposals/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all proposals with pagination
  - Proposal number and title
  - Client name
  - Proposal amount (total)
  - Status (DRAFT, SENT, VIEWED, ACCEPTED, DECLINED)
  - Status filtering with color badges
  - Created date
  - Sent date
  - Accepted date
  - Search by proposal number, title, client name
  - Filter by status
  - Filter by client
  - Sort by date, amount, status
  - Create new proposal button
  - Edit proposal button (DRAFT only)
  - Send proposal button
  - View proposal button
  - Accept proposal button (public/client link)
  - Delete proposal with confirmation
  - Download PDF button
  - Share link/email button
  - Conversion to contract indicator

#### Proposal Detail
- **Route:** `/admin/proposals/:id`
- **File:** `routes/admin/proposals/[id].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Display proposal full content
  - Proposal metadata
    - Proposal number
    - Title and description
    - Client name and email
    - Creation date
    - Validity period
  - Line items table
    - Description
    - Quantity
    - Unit price
    - Amount
  - Pricing breakdown
    - Subtotal
    - Tax rate
    - Tax amount
    - Total amount
  - Terms and conditions display
  - Notes field
  - Status management (DRAFT, SENT, VIEWED, ACCEPTED, DECLINED)
  - E-signature/OTP status tracking
  - Magic link sharing
  - Resend proposal button
  - Accept proposal button (client link)
  - Decline proposal button
  - Convert to contract button
  - Download PDF button
  - Edit proposal (DRAFT only)
  - Delete proposal
  - View history/timeline

#### Create Proposal
- **Route:** `/admin/proposals/new`
- **File:** `routes/admin/proposals/new.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Client selection dropdown
  - Proposal title and description
  - Line item entry
    - Description field
    - Quantity field
    - Unit price field
    - Subtotal auto-calculation
  - Add/remove line items
  - Tax rate setting
  - Tax amount auto-calculation
  - Total auto-calculation
  - Terms and conditions text area
  - Notes field
  - Preview button
  - Save as draft button
  - Save and send button

#### Edit Proposal
- **Route:** `/admin/proposals/edit`
- **File:** `routes/admin/proposals/edit.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Edit existing proposal (DRAFT only)
  - Modify all proposal fields
  - Update line items
  - Recalculate totals
  - Save changes
  - Save and send button
  - Save as new button (duplicate)

---

### ADMIN INVOICE SYSTEM

#### Invoice List
- **Route:** `/admin/invoices`
- **File:** `routes/admin/invoices/index.tsx`
- **Status:** ✅ Complete
- **Features:**
  - List all invoices with pagination
  - Invoice number and title
  - Client name
  - Invoice amount (total)
  - Amount due
  - Status (DRAFT, SENT, PARTIAL, PAID, OVERDUE)
  - Status filtering with color badges
  - Due date tracking
  - Payment status indicator
  - Created date
  - Sent date
  - Paid date
  - Days overdue indicator
  - Search by invoice number, title, client name
  - Filter by status
  - Filter by client
  - Filter by due date range
  - Sort by date, amount, due date
  - Create new invoice button
  - Edit invoice button (DRAFT only)
  - Send invoice button
  - View invoice button
  - Mark as paid button
  - Partial payment tracking
  - Delete invoice with confirmation
  - Download PDF button
  - Email invoice button

#### Invoice Detail & Viewer
- **Route:** `/admin/invoices/:id`
- **File:** `routes/admin/invoices/[id].tsx`
- **Status:** ✅ Complete
- **Features:**
  - Display invoice full content
  - Invoice metadata
    - Invoice number
    - Title and description
    - Client name and email
    - Creation date
    - Due date
    - Payment terms
  - Line items table
    - Description
    - Quantity
    - Unit price
    - Amount
  - Pricing breakdown
    - Subtotal
    - Tax rate
    - Tax amount
    - Total amount
    - Amount paid
    - Amount due
  - Payment history
    - Payment method (CASH, CARD, BANK_TRANSFER, STRIPE, PAYPAL, APPLE_PAY, GOOGLE_PAY)
    - Payment date
    - Amount paid
    - Transaction ID
  - Status management (DRAFT, SENT, PARTIAL, PAID, OVERDUE)
  - Magic link sharing
  - Resend invoice button
  - Mark as paid button
  - Record payment button
  - Partial payment support
  - Due date extension (planned)
  - Send payment reminder button
  - Download PDF button
  - Edit invoice (DRAFT only)
  - Delete invoice
  - View history/timeline

#### Create Invoice
- **Route:** `/admin/invoices/new`
- **File:** `routes/admin/invoices/new.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Client selection dropdown
  - Invoice title and description
  - Line item entry
    - Description field
    - Quantity field
    - Unit price field
    - Subtotal auto-calculation
  - Add/remove line items
  - Tax rate setting
  - Tax amount auto-calculation
  - Total auto-calculation
  - Payment terms selection
  - Due date setting
  - Notes field
  - Preview button
  - Save as draft button
  - Save and send button
  - Auto-populate from proposal (planned)
  - Auto-populate from contract (planned)

---

### CLIENT PORTAL ROUTES (In Progress)

#### Client Dashboard
- **Route:** `/portal`
- **File:** `pages/portal/Dashboard.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Welcome message
  - Recent documents list
  - Invoices overview
  - Outstanding amounts
  - Recent gallery links
  - Message count

#### Client Messages
- **Route:** `/portal/messages`
- **File:** `pages/portal/Messages.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - Message thread list
  - Conversation view
  - Send message form
  - Attachment support (planned)
  - Read/unread status

#### Client Invoices
- **Route:** `/portal/invoices`
- **File:** `pages/portal/Invoices.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - List client's invoices
  - Payment status
  - Due date tracking
  - Download PDF
  - Make payment button

#### Client Files
- **Route:** `/portal/files`
- **File:** `pages/portal/Files.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - List shared gallery files
  - Download options
  - File preview
  - Favorites marking

#### Client Documents
- **Route:** `/portal/documents`
- **File:** `pages/portal/Documents.tsx`
- **Status:** 🟡 In Progress
- **Features:**
  - View contracts
  - View proposals
  - View invoices
  - Document status tracking
  - Download documents

---

## API ENDPOINTS

### Location: `apps/api/src/routes/`

---

### HEALTH & MONITORING

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /healthz` | GET | None | Liveness probe - is app running? |
| `GET /readyz` | GET | None | Readiness probe - database connected? |
| `GET /version` | GET | None | Version info, uptime, environment |
| `GET /metrics` | GET | None | Prometheus metrics endpoint |

---

### AUTHENTICATION

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /auth/login` | POST | None | Admin login (email/password) |
| `POST /auth/logout` | POST | Required | Logout, invalidate session |
| `GET /auth/me` | GET | Required | Get current user info |
| `POST /auth/refresh` | POST | Required | Refresh session token |

---

### CLIENT MANAGEMENT

**Public Signup:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /clients/create` | POST | None | Public client signup |

**Admin Management:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/clients` | GET | Admin | List clients with filters |
| `GET /admin/clients/:id` | GET | Admin | Get client by ID |
| `GET /admin/clients/stats` | GET | Admin | Get client statistics |
| `POST /admin/clients` | POST | Admin | Create client |
| `PATCH /admin/clients/:id` | PATCH | Admin | Update client info |
| `PATCH /admin/clients/:id/status` | PATCH | Admin | Update client status (ACTIVE/INACTIVE/PENDING/ARCHIVED) |
| `DELETE /admin/clients/:id` | DELETE | Admin | Archive client |

---

### INQUIRY MANAGEMENT

**Public:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /inquiries/create` | POST | None | Submit public inquiry form |

**Admin:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/inquiries` | GET | Admin | List inquiries |
| `GET /admin/inquiries/:id` | GET | Admin | Get inquiry by ID |
| `PATCH /admin/inquiries/:id` | PATCH | Admin | Update inquiry |
| `PATCH /admin/inquiries/:id/status` | PATCH | Admin | Update inquiry status |
| `POST /admin/inquiries/:id/convert` | POST | Admin | Convert to client |
| `POST /admin/inquiries/:id/send-email` | POST | Admin | Send email to inquirer |
| `DELETE /admin/inquiries/:id` | DELETE | Admin | Delete inquiry |

---

### ASSET MANAGEMENT & UPLOAD

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /admin/assets/upload` | POST | Admin | Upload asset (RAW/EDIT/VIDEO) |
| `GET /admin/assets` | GET | Admin | List assets with filters |
| `GET /admin/assets/:id` | GET | Admin | Get asset metadata |
| `PATCH /admin/assets/:id` | PATCH | Admin | Update asset metadata |
| `DELETE /admin/assets/:id` | DELETE | Admin | Delete asset |
| `POST /admin/assets/:id/metadata` | POST | Admin | Update EXIF/IPTC metadata |

---

### GALLERY MANAGEMENT

**Admin:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/galleries` | GET | Admin | List galleries |
| `GET /admin/galleries/:id` | GET | Admin | Get gallery by ID |
| `GET /admin/galleries/stats` | GET | Admin | Get gallery statistics |
| `POST /admin/galleries` | POST | Admin | Create gallery |
| `PATCH /admin/galleries/:id` | PATCH | Admin | Update gallery metadata |
| `POST /admin/galleries/:id/assets` | POST | Admin | Add assets to gallery |
| `DELETE /admin/galleries/:id/assets/:assetId` | DELETE | Admin | Remove asset from gallery |
| `PATCH /admin/galleries/:id/reorder` | PATCH | Admin | Reorder gallery assets |

**Public:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /g/:token/meta` | GET | None | Get gallery metadata |
| `POST /g/:token/password` | POST | None | Verify gallery password |
| `GET /g/:token/assets` | GET | None | Get gallery assets |
| `POST /g/:token/view` | POST | None | Track gallery view |

---

### RIGHTS MANAGEMENT

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/rights-presets` | GET | Admin | List rights presets |
| `GET /admin/rights-presets/:id` | GET | Admin | Get specific rights preset |
| `POST /admin/rights-presets` | POST | Admin | Create rights preset |
| `PATCH /admin/rights-presets/:id` | PATCH | Admin | Update rights preset |
| `DELETE /admin/rights-presets/:id` | DELETE | Admin | Delete rights preset |
| `POST /admin/releases` | POST | Admin | Upload model/property release |
| `GET /admin/releases` | GET | Admin | List releases |
| `DELETE /admin/releases/:id` | DELETE | Admin | Delete release |

---

### PROPOSAL MANAGEMENT

**Admin:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/proposals` | GET | Admin | List proposals |
| `GET /admin/proposals/:id` | GET | Admin | Get proposal by ID |
| `GET /admin/proposals/stats` | GET | Admin | Get proposal statistics |
| `POST /admin/proposals` | POST | Admin | Create proposal |
| `PATCH /admin/proposals/:id` | PATCH | Admin | Update proposal |
| `POST /admin/proposals/:id/send` | POST | Admin | Send proposal |
| `POST /admin/proposals/:id/resend` | POST | Admin | Resend proposal |
| `DELETE /admin/proposals/:id` | DELETE | Admin | Delete proposal |

**Public:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /proposals/:proposalNumber` | GET | None | View proposal (public) |
| `POST /proposals/:proposalNumber/accept` | POST | None | Accept proposal (with OTP) |

---

### CONTRACT SYSTEM

**Templates:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /api/contract-templates` | GET | None | List templates |
| `GET /api/contract-templates/:id` | GET | None | Get template by ID |
| `POST /api/contract-templates` | POST | Admin | Create template |
| `PATCH /api/contract-templates/:id` | PATCH | Admin | Update template |
| `DELETE /api/contract-templates/:id` | DELETE | Admin | Delete template |
| `POST /api/contract-templates/:id/publish` | POST | Admin | Publish template |

**Clauses:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /api/clauses` | GET | None | List clauses with filters |
| `GET /api/clauses/:id` | GET | None | Get clause by ID |
| `POST /api/clauses` | POST | Admin | Create clause |
| `PATCH /api/clauses/:id` | PATCH | Admin | Update clause |
| `DELETE /api/clauses/:id` | DELETE | Admin | Delete clause |
| `POST /api/clauses/:id/rules` | POST | Admin | Create conditional rule |
| `PATCH /api/clauses/:id/rules/:ruleId` | PATCH | Admin | Update clause rule |

**Contracts:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/contracts` | GET | Admin | List contracts |
| `GET /admin/contracts/:id` | GET | Admin | Get contract by ID |
| `GET /admin/contracts/stats` | GET | Admin | Get contract statistics |
| `POST /admin/contracts` | POST | Admin | Create contract |
| `PATCH /admin/contracts/:id` | PATCH | Admin | Update contract |
| `POST /admin/contracts/:id/send` | POST | Admin | Send contract |
| `POST /admin/contracts/:id/resend` | POST | Admin | Resend contract |
| `POST /admin/contracts/:id/void` | POST | Admin | Void contract |
| `DELETE /admin/contracts/:id` | DELETE | Admin | Delete contract |

**Public Signing:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /contract/validate/:token` | GET | None | Validate magic link |
| `POST /contract/request-otp` | POST | None | Request OTP |
| `POST /contract/verify-otp` | POST | None | Verify OTP |
| `GET /contract/view/:token` | GET | None | View contract (public) |
| `POST /contract/sign/:token` | POST | None | Sign contract |

---

### INVOICE MANAGEMENT

**Admin:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/invoices` | GET | Admin | List invoices |
| `GET /admin/invoices/:id` | GET | Admin | Get invoice by ID |
| `GET /admin/invoices/stats` | GET | Admin | Get invoice statistics |
| `POST /admin/invoices` | POST | Admin | Create invoice |
| `PATCH /admin/invoices/:id` | PATCH | Admin | Update invoice |
| `POST /admin/invoices/:id/send` | POST | Admin | Send invoice |
| `POST /admin/invoices/:id/mark-paid` | POST | Admin | Mark as paid |
| `DELETE /admin/invoices/:id` | DELETE | Admin | Delete invoice |

**Public:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /invoices/:invoiceNumber` | GET | None | View invoice (public) |
| `POST /invoices/:invoiceNumber/payment` | POST | None | Process payment |

---

### ACCOUNTING & RECONCILIATION

**Reconciliation:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/reconciliation` | GET | Admin | Get reconciliation list |
| `GET /admin/reconciliation/stats` | GET | Admin | Get reconciliation statistics |
| `POST /admin/reconciliation/preview-csv` | POST | Admin | Preview CSV import |
| `POST /admin/reconciliation/import-csv` | POST | Admin | Import bank transactions |
| `POST /admin/reconciliation/match` | POST | Admin | Match payment to transaction |

**Periods:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/periods` | GET | Admin | List accounting periods |
| `POST /admin/periods` | POST | Admin | Create period |
| `PATCH /admin/periods/:id` | PATCH | Admin | Update period |
| `POST /admin/periods/:id/close` | POST | Admin | Close period |
| `POST /admin/periods/:id/unlock` | POST | Admin | Unlock period |

**Journals:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/journals` | GET | Admin | List journal entries |
| `GET /admin/journals/:id` | GET | Admin | Get journal entry |
| `POST /admin/journals` | POST | Admin | Create entry |
| `PATCH /admin/journals/:id` | PATCH | Admin | Update entry |
| `POST /admin/journals/:id/post` | POST | Admin | Post entry |
| `POST /admin/journals/:id/approve` | POST | Admin | Approve entry |
| `POST /admin/journals/:id/void` | POST | Admin | Void entry |

---

### RECORDS & ARCHIVING

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/records` | GET | Admin | List archived records |
| `POST /admin/records/archive` | POST | Admin | Archive file (immutable) |
| `POST /admin/records/:id/verify` | POST | Admin | Verify archive integrity |
| `POST /admin/records/:id/legal-hold` | POST | Admin | Place legal hold |
| `POST /admin/records/:id/dispose` | POST | Admin | Dispose record |

---

### DOCUMENT GENERATION

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /admin/docgen/render` | POST | Admin | Render template to PDF |
| `POST /admin/docgen/verify` | POST | Admin | Verify PDF integrity |

---

### EMAIL MANAGEMENT

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /admin/email/send` | POST | Admin | Send email |
| `GET /admin/email/logs` | GET | Admin | Get email logs |
| `GET /admin/email/templates` | GET | Admin | List email templates |

---

### NOTIFICATIONS & WEBHOOKS

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /api/notifications` | GET | Auth | Get notifications |
| `POST /api/notifications/:id/read` | POST | Auth | Mark as read |
| `PATCH /api/notifications/preferences/:type` | PATCH | Auth | Update preferences |
| `POST /api/webhooks` | POST | Auth | Create webhook |
| `GET /api/webhooks` | GET | Auth | List webhooks |
| `DELETE /api/webhooks/:id` | DELETE | Auth | Delete webhook |

---

### ANALYTICS & REPORTING

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/analytics` | GET | Admin | Get dashboard analytics |
| `GET /admin/analytics/clients` | GET | Admin | Get client metrics |
| `GET /admin/analytics/revenue` | GET | Admin | Get revenue metrics |
| `GET /admin/analytics/proposals` | GET | Admin | Get proposal metrics |

---

### AUDIT & COMPLIANCE

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/audit-logs` | GET | Admin | Get audit logs |
| `GET /admin/audit-logs/:id` | GET | Admin | Get audit entry |

---

### RBAC (ROLE-BASED ACCESS CONTROL)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /admin/roles` | GET | Admin | List roles |
| `POST /admin/roles` | POST | Admin | Create role |
| `POST /admin/users/:id/assign-role` | POST | Admin | Assign role |
| `POST /admin/permissions/check` | POST | Auth | Check permission |

---

## DATABASE MODELS

### Location: `apps/api/prisma/schema.prisma`

**Total Models:** 40+

---

### CORE MODELS

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **AdminUser** | System users | email, name, password, role, createdAt, updatedAt |
| **Session** | Auth sessions | userId, token, expiresAt, ipAddress |
| **Client** | Customers | email, name, phone, company, status, address, source, createdAt |
| **Asset** | Photos/videos | filename, filepath, mimeType, size, category (RAW/EDIT/VIDEO), metadata |

---

### GALLERY SYSTEM

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Gallery** | Photo collections | name, token, password, expiresAt, isActive, clientId |
| **GalleryAsset** | Gallery-asset join | galleryId, assetId, position, isFavorite |

---

### INQUIRY & LEAD CAPTURE

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Inquiry** | Lead submissions | fullName, email, phone, inquiryType, shootDate, budget, status |

---

### PROPOSALS & CONTRACTS

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Proposal** | Proposals | proposalNumber, title, clientId, subtotal, total, status |
| **ProposalItem** | Proposal line items | proposalId, description, quantity, unitPrice |
| **ContractTemplate** | Contract templates | name, type, content, mandatoryClauseIds |
| **Contract** | Signed contracts | contractNumber, title, clientId, status, pdfPath, pdfHash |
| **Clause** | Reusable clauses | slug, title, bodyHtml, tags, mandatory |
| **ClauseRule** | Conditional logic | clauseId, expression (JSONLogic) |
| **ContractEvent** | Audit trail | contractId, type (CREATED/SENT/SIGNED/VOIDED), timestamp |

---

### INVOICING

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Invoice** | Client invoices | invoiceNumber, title, clientId, subtotal, total, dueDate, status |
| **InvoiceItem** | Invoice line items | invoiceId, description, quantity, unitPrice |
| **Payment** | Payment transactions | paymentNumber, invoiceId, amount, method, status |

---

### ACCOUNTING & RECONCILIATION

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **BankTransaction** | Bank statement transactions | transactionDate, description, amount, reconciled |
| **Reconciliation** | Payment matching | bankTransactionId, paymentId, matchType, status |
| **AccountingPeriod** | Monthly/yearly periods | name, startDate, endDate, status (OPEN/CLOSED/LOCKED) |
| **JournalEntry** | GL entries | journalNumber, periodId, entryDate, status |
| **JournalLine** | Debit/credit lines | journalEntryId, account, debit, credit |

---

### RIGHTS & RELEASES

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **RightsPreset** | Copyright templates | name, creator, copyrightNotice, usageRights |
| **Release** | Model/property releases | type (MODEL/PROPERTY), releaseName, releaseDate |

---

### RECORDS & ARCHIVING

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Record** | Immutable archives | recordNumber, archivePath, hash, retainUntil, legalHold |
| **RetentionPolicy** | Retention rules | name, retentionYears, regulatoryBasis |
| **RecordHash** | Verification | recordId, computedHash, expectedHash, matched |

---

### NOTIFICATIONS & WEBHOOKS

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Notification** | In-app notifications | userId, type, title, message, isRead |
| **WebhookEndpoint** | Webhook targets | userId, url, secret, events, isActive |
| **EmailLog** | Email tracking | to, from, subject, status, messageId |

---

### RBAC & PERMISSIONS

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **SystemRole** | System roles | name, displayName, level, isSystem |
| **UserRole** | User-role assignment | userId, roleId, scope, expiresAt |
| **Permission** | Permission definitions | resource, action, name, isDangerous |
| **RolePermission** | Role-permission assignment | roleId, permissionId |

---

### AUDIT TRAIL

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **AuditLog** | Activity tracking | action, entityType, entityId, userId, changes, metadata |

---

## MAJOR FEATURES & FUNCTIONALITY

### 1. GALLERY SYSTEM ✅
- Photo collections (RAW, EDIT, VIDEO)
- Public sharing with unique tokens
- Password protection
- Infinite scroll (12 items/page)
- Lightbox viewer (zoom, pan, metadata sidebar)
- Favorites marking (persistent)
- Drag-and-drop reordering
- Client proofing (HEART/FLAG/REJECT selections)
- Expiration dates
- View tracking

### 2. PROPOSAL SYSTEM ✅
- Template-based creation
- Line items with pricing
- Tax calculation (subtotal + tax)
- E-signature with OTP
- Status tracking (DRAFT → SENT → VIEWED → ACCEPTED/DECLINED)
- Magic links
- PDF generation
- Validity period tracking

### 3. CONTRACT SYSTEM ✅
- Clause library (reusable)
- Conditional logic (JSONLogic)
- Template management
- E-signature workflow (magic link + OTP + signature)
- Multi-reissue support
- PDF hash verification (SHA-256)
- Event audit trail (CREATED, SENT, SIGNED, VOIDED)
- Portal access
- Auto-expiry

### 4. INVOICE & PAYMENT ✅
- Invoice generation
- Auto-generation on contract signature
- Payment types (CASH, CARD, BANK_TRANSFER, STRIPE, PAYPAL, APPLE_PAY, GOOGLE_PAY)
- Status tracking (DRAFT → SENT → PAID/PARTIAL/OVERDUE)
- Payment tracking
- Tax calculation
- Public viewing
- Due date tracking

### 5. ACCOUNTING & RECONCILIATION ✅
- Bank transaction import (CSV/OFX)
- Auto-matching with confidence scoring
- Manual reconciliation
- Accounting periods (monthly/quarterly/yearly)
- Period locking
- Journal entries (GL)
- Multi-level approval workflow
- Supporting document attachment

### 6. RECORDS & ARCHIVING (WORM) ✅
- Immutable file archiving
- Retention policies by category
- Legal holds
- SHA-256 hash verification
- Auto-disposal after retention

### 7. ASSET MANAGEMENT ✅
- Multi-format support (RAW, JPEG, TIFF, MP4, etc.)
- EXIF/IPTC metadata extraction
- Thumbnail auto-generation
- Image optimization
- Video transcoding
- Checksum verification
- Upload progress tracking

### 8. LEAD CAPTURE ✅
- Public inquiry form (/inquiry)
- 9 inquiry types
- Budget tracking
- File attachments (up to 5)
- Status workflow
- Auto-conversion to client
- Email follow-ups

### 9. RIGHTS & COMPLIANCE ✅
- Rights presets (copyright templates)
- Model/property releases
- Metadata embedding
- Batch operations

### 10. NOTIFICATIONS & WEBHOOKS ✅
- In-app notifications
- Email notifications
- Digest emails (daily/weekly/monthly)
- Webhooks with retry logic
- HMAC-SHA256 signatures

### 11. ADMIN PORTAL ✅
- Dashboard with key metrics
- User management
- Settings
- Audit logs
- Analytics

### 12. CLIENT PORTAL 🟡
- Document access (invoices, proposals, contracts)
- Proofing workflow
- Messages
- File downloads

### 13. AUTHENTICATION ✅
- Admin login (email/password)
- Magic links (passwordless)
- OTP verification
- Session management (7-day expiry)
- Argon2 password hashing
- CORS security

### 14. EMAIL SYSTEM ✅
- Postmark/SES integration
- Handlebars templates
- Tracking (opens, clicks, bounces)
- Email logs
- Retry logic
- Unsubscribe support

### 15. RBAC ✅
- System roles (SUPER_ADMIN, ADMIN, EDITOR, VIEWER, GUEST)
- Granular permissions (resource + action)
- Policy rules (field-level access)
- Permission caching
- Dangerous operation flagging

### 16. SEARCH & FILTERS ✅
- Full-text search
- Advanced filters
- Saved filters
- Search analytics

### 17. MEDIA & CDN 🟡
- Image optimization
- Thumbnail generation
- Video transcoding
- Lazy loading
- Responsive images (srcset)

---

## ARCHITECTURE OVERVIEW

### TECHNOLOGY STACK
- **Frontend:** React 18, Vite, React Router v7, Tailwind CSS, Shadcn UI
- **Backend:** Node.js, Fastify, Prisma ORM
- **Database:** PostgreSQL
- **Monorepo:** pnpm workspaces
- **Build:** TypeScript, ESM modules

### KEY PATTERNS
1. **API-Driven:** RESTful with JSON responses
2. **Service Layer:** Business logic separation
3. **Route Organization:** Public → Admin → Feature prefixes
4. **Middleware Stack:** CORS, auth, logging, error handling
5. **Database:** Relationships via joins, soft deletes via enums
6. **Frontend:** File-based routing, hooks, component-based UI
7. **Authentication:** Cookie-based (admin), magic links (clients)

### CRITICAL CONFIG
- **CORS:** String/array format (not callback), credentials: true
- **Session:** 7-day expiry, httpOnly cookies
- **Database:** PostgreSQL, indexes on high-query fields
- **Email:** Postmark or AWS SES
- **Environment:** NODE_ENV, DATABASE_URL, SESSION_SECRET, CORS_ORIGIN

---

## FEATURE COMPLETION STATUS

### ✅ COMPLETE & STABLE
- Gallery system (display, sharing, proofing)
- Asset management (upload, organization)
- Admin authentication
- Client management (CRUD, details)
- Inquiry system (capture, tracking, conversion)
- Proposal system (creation, sending, acceptance)
- Contract system (templates, clauses, e-signing)
- Invoice system (creation, sending, tracking)
- Rights & releases
- Accounting system (journals, periods, approval)
- Reconciliation (bank import, matching)
- Records & archiving (WORM)
- Health checks & monitoring
- Audit logging
- RBAC
- Email integration
- Notifications & webhooks

### 🟡 IN PROGRESS
- Proposals (new/edit pages)
- Client portal (dashboard, documents)
- Payment processing (Stripe)
- Advanced analytics
- Settings page

### ⏳ PLANNED
- Cloudflare R2 CDN
- CSRF protection
- Rate limiting refinement
- Full-text search optimization
- Webhook retry optimization
- OCR for contracts
- Video processing pipeline

---

**Total Coverage:**
- **34 API route files**
- **30+ Frontend routes/pages**
- **40+ Database models**
- **17 Major feature areas**

