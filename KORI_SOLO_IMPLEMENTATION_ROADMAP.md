# KORI SOLO UPGRADE - IMPLEMENTATION ROADMAP

**Strategic Overview:** Transform Kori into a polished, feature-rich solo creator platform by implementing 4 distinct phases across 11 functional areas.

**Document Status:** Implementation Strategy & Detailed Steps

---

## TABLE OF CONTENTS

1. [Current State Assessment](#current-state-assessment)
2. [Phase Overview & Dependencies](#phase-overview--dependencies)
3. [Phase 1: Client Workflow Foundation](#phase-1-client-workflow-foundation)
4. [Phase 2: Delivery Experience Polish](#phase-2-delivery-experience-polish)
5. [Phase 3: Automation & Efficiency](#phase-3-automation--efficiency)
6. [Phase 4: Insight & Reliability](#phase-4-insight--reliability)
7. [General UX Enhancements (Ongoing)](#general-ux-enhancements-ongoing)
8. [Implementation Checklist](#implementation-checklist)
9. [Timeline & Resource Estimate](#timeline--resource-estimate)

---

## CURRENT STATE ASSESSMENT

### ✅ ALREADY IMPLEMENTED
- Gallery system (display, sharing, lightbox, infinite scroll)
- Proposal system (creation, sending, status tracking)
- Contract system (templates, clauses, e-signature, PDF)
- Invoice system (creation, status tracking, payment methods)
- Client management (CRUD, details, list)
- Email integration (Postmark/SES)
- Audit logging and compliance
- RBAC (role-based access control)
- Dark mode toggle

### 🟡 PARTIALLY IMPLEMENTED
- Invoices (Stripe integration temporarily disabled)
- Client portal (basic structure, needs features)
- Settings page (basic structure)
- Analytics/Dashboard (placeholder metrics)
- Messaging system (foundation only)

### ⏳ NOT YET IMPLEMENTED
- Proposal templates (save/reuse bundles)
- Auto-variable substitution ({{client.name}}, {{date}})
- Single-click Proposal → Contract → Invoice conversion
- Client notes/scratchpad
- Tags & filters for clients
- Auto-watermarking for galleries
- ZIP export for selected gallery files
- Gallery access logs
- 2FA authentication
- Encrypted backups
- Time tracking
- Workflow automation (trigger-based actions)
- Global search (Ctrl+K)
- Quick actions floating panel
- Keyboard shortcuts
- Onboarding checklist
- Auto-reminders (payment due, contract not signed)
- Recurring invoices

---

## PHASE OVERVIEW & DEPENDENCIES

### PHASE 1: CLIENT WORKFLOW FOUNDATION (4-6 weeks)
**Goal:** Create a seamless pipeline: Proposal → Contract → Invoice → Payment

**Dependencies:**
- Existing proposal, contract, invoice systems (✅ available)
- Database schema updates (minimal)
- UI/UX refinements

**Deliverables:**
1. Proposal templates system
2. Auto-variable substitution
3. Single-click conversion chain
4. Quick-create buttons from client page
5. Client unified view dashboard

**Impact:** High - core workflow improvement
**Effort:** Medium
**User Benefit:** 80% time savings in proposal-to-payment cycle

---

### PHASE 2: DELIVERY EXPERIENCE POLISH (3-4 weeks)
**Goal:** Enhance client-facing experience and internal communication

**Dependencies:**
- Phase 1 (client pages must be solid)
- Existing gallery system (✅ available)
- Messaging infrastructure (partial)

**Deliverables:**
1. Gallery auto-watermarking
2. Client messaging thread per client
3. Gallery access analytics
4. ZIP export functionality
5. Galleries quick-send feature

**Impact:** Medium - UX and client satisfaction
**Effort:** Medium
**User Benefit:** Professional delivery, client engagement tracking

---

### PHASE 3: AUTOMATION & EFFICIENCY (4-5 weeks)
**Goal:** Reduce repetitive admin tasks with intelligent automation

**Dependencies:**
- Phase 1 (requires client workflow foundation)
- Messaging system (phase 2)
- Email infrastructure (✅ available)

**Deliverables:**
1. Workflow automation rules (no-code builder)
2. Trigger-based actions (proposal accepted → create contract)
3. Auto-reminders (payment due, contract not signed)
4. Task reminder system
5. Email template customization

**Impact:** High - time savings and consistency
**Effort:** High (complex automation logic)
**User Benefit:** 50%+ reduction in manual follow-ups

---

### PHASE 4: INSIGHT & RELIABILITY (3-4 weeks)
**Goal:** Business visibility and data safety

**Dependencies:**
- Phase 1-3 (data to report on)
- Existing audit system (✅ available)
- Database optimization

**Deliverables:**
1. Enhanced dashboard with key metrics
2. Revenue analytics (monthly, yearly)
3. Client engagement insights
4. Top services breakdown
5. Activity timeline feed
6. Encrypted backup system
7. Data export (JSON/CSV)
8. 2FA setup

**Impact:** Medium - business intelligence
**Effort:** Medium
**User Benefit:** Business visibility and data security

---

## PHASE 1: CLIENT WORKFLOW FOUNDATION

### Overview
Transform the proposal-to-payment cycle into a seamless, one-click workflow. Reduce data entry and ensure consistency across documents.

---

### STEP 1.1: Proposal Templates System

**What:** Enable users to save and reuse common proposal structures

**Implementation Details:**

**Backend Changes:**
1. Create `ProposalTemplate` database model
   ```prisma
   model ProposalTemplate {
     id String @id @default(cuid())
     userId String
     name String // "Wedding Full Day", "Corporate Shoot"
     description String?
     content String // Proposal body template
     items ProposalTemplateItem[] // Line items
     defaultTaxRate Float?
     defaultTerms String?
     isActive Boolean @default(true)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }

   model ProposalTemplateItem {
     id String @id @default(cuid())
     templateId String
     template ProposalTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
     description String
     quantity Int @default(1)
     unitPrice Decimal
     order Int // For ordering items
   }
   ```

2. Create API endpoints:
   - `POST /admin/proposal-templates` - Create template
   - `GET /admin/proposal-templates` - List templates
   - `GET /admin/proposal-templates/:id` - Get template details
   - `PATCH /admin/proposal-templates/:id` - Update template
   - `DELETE /admin/proposal-templates/:id` - Delete template
   - `POST /admin/proposals/from-template/:templateId` - Create proposal from template

3. Service layer in `apps/api/src/services/proposalTemplate.ts`
   - Create, read, update, delete templates
   - Duplicate proposal from template
   - Template validation

**Frontend Changes:**
1. Create template management page (`/admin/proposals/templates`)
   - List existing templates
   - Create new template form
   - Edit template form
   - Delete with confirmation
   - Template preview

2. Update proposal creation page (`/admin/proposals/new`)
   - Template selector dropdown at top
   - "Load from template" button
   - Auto-populate fields from selected template
   - Allow manual override

3. Add quick-template-create from proposal list
   - Right-click context menu "Save as template"
   - Or "Save template" button on draft proposal

**UI/UX Details:**
- Show template preview before creating from it
- Allow toggling between "Create from scratch" vs "Use template"
- Show recently used templates
- Duplicate button on template cards

**Estimated Effort:** 8-10 hours

**Testing Checklist:**
- [ ] Create template from scratch
- [ ] Create proposal from template
- [ ] Template fields populate correctly
- [ ] Can override template values
- [ ] Template list displays correctly
- [ ] Edit template updates future proposals created from it (backwards compatibility?)
- [ ] Delete template works
- [ ] Duplicate template creates independent copy

---

### STEP 1.2: Auto-Variable Substitution

**What:** Replace placeholders like `{{client.name}}` and `{{date}}` with actual values

**Implementation Details:**

**Backend Changes:**
1. Create variable substitution service in `apps/api/src/services/variableSubstitution.ts`
   ```typescript
   export function substituteVariables(
     template: string,
     context: {
       client?: Client,
       proposal?: Proposal,
       contract?: Contract,
       invoice?: Invoice,
       date?: Date,
       currency?: string
     }
   ): string {
     // Replace {{client.name}} → actual client name
     // Replace {{date}} → formatted current date
     // Replace {{proposal.total}} → proposal total
     // etc.
   }
   ```

2. Supported variables:
   - `{{client.name}}` - Client full name
   - `{{client.email}}` - Client email
   - `{{client.phone}}` - Client phone
   - `{{client.company}}` - Client company
   - `{{studio.name}}` - Your business name (from settings)
   - `{{studio.email}}` - Your email
   - `{{date}}` - Current date (formatted)
   - `{{proposal.number}}` - Proposal number
   - `{{proposal.total}}` - Proposal total amount
   - `{{proposal.tax}}` - Tax amount
   - `{{proposal.subtotal}}` - Subtotal
   - `{{contract.number}}` - Contract number
   - `{{invoice.number}}` - Invoice number
   - `{{invoice.dueDate}}` - Invoice due date

3. Update proposal, contract, invoice creation endpoints to:
   - Accept a `useVariables: boolean` flag
   - Call `substituteVariables()` before saving
   - Return preview of substituted content before final save

**Frontend Changes:**
1. Add variable picker widget in proposal editor
   - Floating button "Insert variable"
   - Dropdown menu with categories (Client, Proposal, Studio, Dates)
   - Click inserts placeholder at cursor position

2. Template editor shows available variables
   - Hint text: "Use {{client.name}} to auto-fill"
   - Variable reference guide

3. Preview mode shows substituted values
   - "Preview as PDF" shows real values
   - Modal shows before/after

**UI/UX Details:**
- Show variable hint in editor tooltips
- Variable picker with search
- One-click insertion at cursor position
- Preview shows final rendered output

**Estimated Effort:** 6-8 hours

**Testing Checklist:**
- [ ] All variables substitute correctly
- [ ] Unmatched variables handled gracefully (left as-is or error?)
- [ ] Special characters escaped properly
- [ ] Preview shows correct values
- [ ] PDF export includes substituted values
- [ ] Email sends with substituted content

---

### STEP 1.3: Single-Click Conversion Chain

**What:** Proposal accepted → instantly create Contract → instantly create Invoice (with shared metadata)

**Implementation Details:**

**Backend Changes:**
1. Update `ProposalService.acceptProposal()` to:
   ```typescript
   async acceptProposal(proposalId: string, clientOtp: string) {
     // Verify OTP
     const proposal = await prisma.proposal.findUnique({...})

     // Accept proposal
     proposal.status = 'ACCEPTED'
     await prisma.proposal.update(...)

     // Auto-create contract
     const contract = await ContractService.createFromProposal(proposalId)

     // Auto-create invoice
     const invoice = await InvoiceService.createFromProposal(proposalId, contract.id)

     return { proposal, contract, invoice }
   }
   ```

2. Create new service methods:
   - `ContractService.createFromProposal(proposalId)`
     - Copy client, amount, terms to contract
     - Select default contract template
     - Set status to DRAFT

   - `InvoiceService.createFromProposal(proposalId, contractId?)`
     - Copy line items from proposal
     - Copy client and totals
     - Link to contract
     - Auto-generate invoice number
     - Set due date based on settings (default: 14 days)

3. Add settings for automation:
   - `autoCreateContractOnProposalAccept: boolean`
   - `autoCreateInvoiceOnProposalAccept: boolean`
   - `defaultContractTemplate: string`
   - `defaultInvoiceDueInDays: number`

**Frontend Changes:**
1. After proposal accepted (client side):
   - Show success modal
   - Display: "Contract created! Ready to send?"
   - Link to newly created contract
   - Link to newly created invoice
   - Option to auto-send contract

2. Admin proposal view:
   - Show linked contract and invoice (if created)
   - "View Contract" and "View Invoice" buttons
   - Show these documents in proposal timeline

3. Add automation toggle in settings
   - "Auto-create contract when proposal accepted"
   - "Auto-create invoice when proposal accepted"

**UI/UX Details:**
- Success toast with links to created documents
- One-click to review/send contract
- One-click to send invoice
- Timeline shows document chain (Proposal → Contract → Invoice)

**Estimated Effort:** 10-12 hours

**Testing Checklist:**
- [ ] Accepting proposal creates contract
- [ ] Contract inherits client data correctly
- [ ] Contract inherits terms correctly
- [ ] Contract uses default template
- [ ] Invoice created from proposal
- [ ] Invoice line items match proposal
- [ ] Invoice number auto-generated
- [ ] Due date calculated correctly
- [ ] Disabling automation works
- [ ] Timeline shows all linked documents
- [ ] Email notifications sent for new contract/invoice

---

### STEP 1.4: Client Unified Dashboard Page

**What:** Single page showing all client documents, galleries, and history

**Implementation Details:**

**Frontend Changes:**
1. Create new page at `/admin/clients/:id/unified` (or update existing detail page)

2. Layout:
   ```
   ┌─────────────────────────────────────┐
   │ CLIENT HEADER (photo, name, contact) │
   │ Quick stats: 3 invoices | 2 contracts │
   └─────────────────────────────────────┘

   ┌─ QUICK ACTIONS ──────────────────────┐
   │ [+ Proposal]  [+ Contract]  [+ Invoice] │
   │ [+ Gallery]   [+ Message]              │
   └──────────────────────────────────────┘

   ┌─ DOCUMENTS TIMELINE ──────────────────┐
   │ Nov 6: Invoice #2024-015 DUE → PAID   │
   │ Nov 4: Contract SIGNED ✓              │
   │ Oct 28: Proposal ACCEPTED             │
   │ Oct 20: Proposal SENT                 │
   └──────────────────────────────────────┘

   ┌─ ACTIVE PROPOSALS ───────────────────┐
   │ "Wedding Edit Package" → DRAFT        │
   │ "Retouching Services" → SENT (viewed) │
   └──────────────────────────────────────┘

   ┌─ CONTRACTS ──────────────────────────┐
   │ "Wedding Contract" → ACTIVE ✓        │
   │ "Photo License" → SIGNED              │
   └──────────────────────────────────────┘

   ┌─ INVOICES ───────────────────────────┐
   │ #2024-016 $2,500 DUE Oct 30 (3 days) │
   │ #2024-015 $1,200 PAID Nov 6          │
   │ #2024-014 $500 PARTIAL ($300 paid)   │
   └──────────────────────────────────────┘

   ┌─ GALLERIES ──────────────────────────┐
   │ "Wedding 2024-11-02" (98 photos)     │
   │ "Engagement Proofing" (32 photos)    │
   └──────────────────────────────────────┘

   ┌─ NOTES ──────────────────────────────┐
   │ "Prefers email over phone"            │
   │ "Needs invoices in Excel format"      │
   │ [Edit Notes button]                   │
   └──────────────────────────────────────┘
   ```

3. Components needed:
   - `ClientHeader` - Name, contact, photo, quick stats
   - `QuickActionsPanel` - Floating buttons for new docs
   - `DocumentTimeline` - Chronological view of all activity
   - `ProposalsSection` - List active proposals
   - `ContractsSection` - List contracts
   - `InvoicesSection` - List invoices with status
   - `GalleriesSection` - List galleries linked to client
   - `NotesSection` - Editable scratchpad

4. API Changes:
   - Enhance `GET /admin/clients/:id` to include:
     - All proposals for this client
     - All contracts for this client
     - All invoices for this client
     - All galleries for this client
     - Activity timeline (from audit logs)

**UI/UX Details:**
- Clean card-based layout
- Color-coded status badges
- Quick action buttons always visible
- Expandable sections
- Responsive for mobile (stack vertically)

**Estimated Effort:** 12-14 hours

**Testing Checklist:**
- [ ] All client info displays correctly
- [ ] Quick action buttons work
- [ ] Timeline shows all events in correct order
- [ ] Proposals section shows correct status
- [ ] Contracts section shows correct status
- [ ] Invoices show correct totals and due dates
- [ ] Galleries linked correctly
- [ ] Notes save and persist
- [ ] Responsive on mobile
- [ ] Quick stats calculate correctly

---

### STEP 1.5: Client Notes & Tags

**What:** Add scratchpad for private notes and categorization labels

**Implementation Details:**

**Backend Changes:**
1. Update `Client` model:
   ```prisma
   model Client {
     // ... existing fields
     notes String? // Private scratchpad
     tags String[] @default([]) // Array of tags
     // e.g., tags: ["Wedding", "VIP", "Repeat Client"]
   }
   ```

2. Add API endpoints:
   - `PATCH /admin/clients/:id/notes` - Update notes
   - `PATCH /admin/clients/:id/tags` - Update tags
   - `GET /admin/clients/filter/tag/:tag` - Filter clients by tag

**Frontend Changes:**
1. Add notes section to client page
   - Textarea field (always editable)
   - Auto-save on blur or Ctrl+S
   - Show last modified timestamp
   - Character count (optional limit: 1000?)

2. Add tags section
   - Pill-shaped tags displayed
   - Click to remove tag
   - Text input to add new tags
   - Autocomplete from existing tags (no duplicates)
   - Max 10 tags per client?

3. Client list page:
   - Add "Tags" column with pill badges
   - Add filter sidebar: "Filter by tag"
   - Quick tag click to filter

4. Search/filter enhancement:
   - Allow searching by tag: `tag:Wedding`
   - Allow searching by note content

**UI/UX Details:**
- Notes area with placeholder: "Add private reminders..."
- Tags with color coding (auto-assigned colors)
- Click tag to view all clients with that tag
- Tag suggestions based on existing tags

**Estimated Effort:** 4-5 hours

**Testing Checklist:**
- [ ] Notes save correctly
- [ ] Notes persist on page reload
- [ ] Auto-save works smoothly
- [ ] Tags add correctly
- [ ] Tags remove correctly
- [ ] Duplicate tags prevented
- [ ] Filter by tag works
- [ ] Tag appears on client list
- [ ] Tag autocomplete suggests existing tags
- [ ] Character limit enforced (if set)

---

## PHASE 1 SUMMARY

### Deliverables
✅ Proposal templates (save/reuse)
✅ Auto-variable substitution
✅ Single-click conversion chain
✅ Client unified dashboard
✅ Client notes & tags

### Time Estimate
Total: **40-50 hours** (1-1.5 weeks for full-time developer)

### Database Changes
- Add `ProposalTemplate` and `ProposalTemplateItem` tables
- Add `notes` and `tags` fields to `Client` table
- Add automation settings to `Setting` table

### Testing Effort
- 8-10 hours (unit tests, integration tests, manual QA)

### User Value
- 80% faster proposal creation (templates)
- 60% reduction in data entry (variables)
- One-click document chain (proposal → contract → invoice)
- Better client organization (notes, tags)

---

## PHASE 2: DELIVERY EXPERIENCE POLISH

### Overview
Enhance the client-facing gallery experience and enable rich internal/external communication.

---

### STEP 2.1: Gallery Auto-Watermarking

**What:** Add watermark presets to protect images before sharing

**Implementation Details:**

**Backend Changes:**
1. Create `WatermarkPreset` model:
   ```prisma
   model WatermarkPreset {
     id String @id @default(cuid())
     userId String
     name String // "Copyright Notice", "Logo Only"
     type 'text' | 'image' | 'both'
     textContent String? // "© 2024 Your Studio"
     textColor String @default("#FFFFFF")
     textSize Int @default(24)
     textOpacity Float @default(0.5)
     logoUrl String? // URL to logo image
     logoOpacity Float @default(0.3)
     logoSize Int @default(150) // pixels
     position 'center' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'tile'
     isActive Boolean @default(true)
     createdAt DateTime @default(now())
   }
   ```

2. Create watermarking service:
   ```typescript
   // apps/api/src/services/watermark.ts
   export async function applyWatermark(
     imagePath: string,
     presetId: string,
     outputPath: string
   ): Promise<string>
   ```
   - Use Sharp library (already in project)
   - Overlay text and/or image
   - Return path to watermarked image

3. Add API endpoints:
   - `POST /admin/watermark-presets` - Create preset
   - `GET /admin/watermark-presets` - List presets
   - `PATCH /admin/watermark-presets/:id` - Update
   - `DELETE /admin/watermark-presets/:id` - Delete
   - `POST /admin/galleries/:id/apply-watermark` - Apply to gallery

**Frontend Changes:**
1. Create watermark preset management page (`/admin/settings/watermarks`)
   - List presets with preview
   - Create new preset form
   - Live preview of watermark
   - Test watermark on sample image
   - Edit/delete presets

2. Gallery editor enhancements:
   - "Apply watermark" button in gallery settings
   - Preset selector dropdown
   - Preview watermarked image
   - Option to apply to all gallery images or selected only
   - Progress bar during batch watermarking

3. Public gallery view:
   - Option to watermark before sharing link
   - "Share as watermarked" toggle
   - Shows watermarked preview to client

**UI/UX Details:**
- Live preview of watermark on sample image
- Preset quick-select (favorite/recent)
- Watermark position visualizer
- Easy preset duplication for tweaks
- Undo watermark option (if original preserved)

**Estimated Effort:** 10-12 hours

**Testing Checklist:**
- [ ] Create watermark preset
- [ ] Text watermark renders correctly
- [ ] Logo watermark renders correctly
- [ ] Watermark position correct
- [ ] Opacity correct
- [ ] Apply to single image works
- [ ] Batch apply to gallery works
- [ ] Progress bar shows during processing
- [ ] Original image preserved
- [ ] PDF exports with watermark
- [ ] Performance acceptable for large galleries

---

### STEP 2.2: Client Messaging System

**What:** Single unified message thread per client

**Implementation Details:**

**Backend Changes:**
1. Create `ClientMessage` model:
   ```prisma
   model ClientMessage {
     id String @id @default(cuid())
     clientId String
     client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
     senderId String // AdminUser or Client
     senderType 'admin' | 'client'
     senderName String // Display name
     senderEmail String
     content String
     attachmentUrls String[] @default([])
     isRead Boolean @default(false)
     readAt DateTime?
     createdAt DateTime @default(now())
   }
   ```

2. Add API endpoints:
   - `GET /admin/messages/:clientId` - Get all messages for client
   - `POST /admin/messages/:clientId` - Send message to client
   - `PATCH /admin/messages/:id/read` - Mark as read
   - `POST /admin/messages/:id/delete` - Delete message (soft delete?)
   - `POST /messages/client/:clientId` - Send message as client (from portal)

3. Email integration:
   - When admin sends message → send email to client
   - When client replies via email → parse and insert message
   - Auto-link emails to thread (threading by clientId)

**Frontend Changes:**
1. Create message thread page (`/admin/clients/:id/messages`)
   - Full message thread view
   - Messages sorted by date (ascending)
   - Admin messages on right, client on left (bubble chat style)
   - Message timestamps and sender info
   - Read receipts (✓ Sent, ✓✓ Read)

2. Message compose:
   - Text input with autosave
   - Rich text editor (bold, italic, lists - using Markdown?)
   - File attachment support
   - Quick template button (see Step 3.3)
   - Send button (Ctrl+Enter to send)
   - Emoji picker (optional)

3. Floating message window:
   - Accessible from anywhere in app
   - Floating button (bottom right)
   - Shows unread count badge
   - Click opens side panel or modal
   - Quick message to current client

4. Client portal messages:
   - Similar thread view
   - Client can reply to messages
   - Clients see only their thread
   - Message notifications

5. Dashboard notification:
   - Unread message count in header
   - "X new messages" indicator
   - Jump to messages on click

**UI/UX Details:**
- Bubble chat layout (modern feel)
- Avatar/initials for sender
- Timestamp grouping (show once per hour)
- Message actions: reply, forward, delete, copy
- Typing indicator (client started typing)
- Attachment preview (images, PDFs)
- Search within thread
- Archive old threads

**Estimated Effort:** 14-16 hours

**Testing Checklist:**
- [ ] Send message to client
- [ ] Message appears in thread
- [ ] Read receipt updates
- [ ] Email sent to client
- [ ] Client can reply
- [ ] Reply appears in thread
- [ ] Timestamp correct
- [ ] File attachments upload
- [ ] File preview works
- [ ] Floating panel works
- [ ] Unread count badge updates
- [ ] Search finds messages
- [ ] Performance with large threads
- [ ] Mobile responsiveness

---

### STEP 2.3: Gallery Access Logging

**What:** Track when and how often clients view galleries

**Implementation Details:**

**Backend Changes:**
1. Create `GalleryAccessLog` model:
   ```prisma
   model GalleryAccessLog {
     id String @id @default(cuid())
     galleryId String
     gallery Gallery @relation(fields: [galleryId], references: [id], onDelete: Cascade)
     visitorEmail String? // If known
     visitorIp String
     userAgent String
     accessedAt DateTime @default(now())
     duration Int? // Seconds spent viewing
     assetsViewed String[] @default([]) // Asset IDs viewed
     viewCount Int @default(1) // How many times accessed
   }
   ```

2. Update public gallery endpoints:
   - When `/g/:token/assets` called, log access
   - Include: IP, user agent, timestamp
   - If email known (from password entry), link it

3. Add analytics endpoint:
   - `GET /admin/galleries/:id/analytics`
   - Returns: view count, unique visitors, top assets viewed, duration stats

**Frontend Changes:**
1. Add analytics tab to gallery detail page
   - "View Analytics" button/tab
   - Show metrics:
     - Total views
     - Unique visitors
     - Most viewed assets (sorted)
     - View dates/times
     - Average time spent
     - Client IP (if password protected)

2. Client section on gallery detail:
   - List of clients with access
   - Last viewed date
   - View count per client
   - Client email (if known)

3. Dashboard widget:
   - "Gallery Activity This Week"
   - Shows recently viewed galleries
   - Most popular gallery

**UI/UX Details:**
- Simple metrics cards
- Timeline of views
- Heatmap showing most-viewed assets (optional)
- Export analytics as PDF/CSV
- Graph showing views over time

**Estimated Effort:** 8-10 hours

**Testing Checklist:**
- [ ] Access logs created on gallery view
- [ ] IP captured correctly
- [ ] User agent captured
- [ ] View count increments
- [ ] Analytics endpoint returns correct data
- [ ] Dashboard widget shows recent activity
- [ ] Export works
- [ ] Performance acceptable
- [ ] Privacy: IPs don't expose sensitive info

---

### STEP 2.4: ZIP Export for Gallery

**What:** Download selected gallery images as a single ZIP file

**Implementation Details:**

**Backend Changes:**
1. Add ZIP export service:
   ```typescript
   // apps/api/src/services/zipExport.ts
   export async function createGalleryZip(
     galleryId: string,
     assetIds?: string[], // If undefined, export all
     includeWatermark?: boolean
   ): Promise<string>
   ```
   - Use `archiver` npm package
   - Create ZIP in temp directory
   - Return download URL

2. Add API endpoint:
   - `POST /admin/galleries/:id/export-zip`
   - Body: `{ assetIds?: string[], includeWatermark?: boolean }`
   - Returns: { downloadUrl: string, expiresIn: number }
   - File expires after 24 hours

3. Client-side export:
   - `POST /g/:token/export-zip` (public)
   - Body: `{ selectedAssetIds: string[] }`
   - Requires password or special permission
   - Returns signed download URL

**Frontend Changes:**
1. Gallery admin view:
   - Add "Download ZIP" button (exports all)
   - Bulk selection mode to choose images
   - "Download Selected" button
   - Include watermark option

2. Client gallery view:
   - Add "Download Selected" button (only for selected favorites)
   - Show file size before download
   - Progress indicator during download
   - Auto-download or show dialog

3. Export dialog:
   - Show file size estimate
   - Option to include watermark
   - Folder structure (flat or organized)
   - Filename format selector

**UI/UX Details:**
- Show estimated size before download
- Progress bar during ZIP creation
- Download automatically starts
- Email download link as fallback
- File naming convention (gallery name + date)

**Estimated Effort:** 6-8 hours

**Testing Checklist:**
- [ ] Single asset ZIP works
- [ ] Multiple assets ZIP works
- [ ] All assets ZIP works
- [ ] File size estimate correct
- [ ] ZIP extracts correctly
- [ ] Watermarked images in ZIP work
- [ ] Large galleries don't timeout
- [ ] Download link expires correctly
- [ ] Security: only authorized users can export
- [ ] Performance acceptable

---

### STEP 2.5: "Send Gallery" One-Click Feature

**What:** Generate and share gallery link in one action, with optional email

**Implementation Details:**

**Frontend Changes:**
1. Gallery list page:
   - Add "Send" button on each gallery
   - Opens modal with options:
     - "Send to client" - shows client selector
     - "Copy link" - copies to clipboard
     - "Email to client" - pre-fills email form
     - "Print QR code" - generates QR for gallery link

2. Gallery detail page:
   - "Share" button (floating or in header)
   - Same modal as above
   - Quick copy gallery link
   - Pre-generate short URL (optional)

3. Email integration:
   - Pre-fill email compose with:
     - Client email
     - Gallery link
     - Generic message: "Your photos are ready to view!"
     - Optional custom message
   - Click "Send email" uses existing email system

**Backend Changes:**
- No new backend needed if using existing email system
- Just compile gallery sharing link with client email

**UI/UX Details:**
- Modal dialog with clear options
- QR code large and scannable
- Copy-to-clipboard feedback ("Link copied!")
- One-click to email
- Show expiry date of gallery link
- Show gallery password (if set)

**Estimated Effort:** 4-5 hours

**Testing Checklist:**
- [ ] Copy link works
- [ ] Email pre-fills correctly
- [ ] QR code generates and scans
- [ ] Gallery link valid
- [ ] Email sends with link
- [ ] Gallery loads from link
- [ ] Multiple galleries can be sent
- [ ] Works on mobile

---

## PHASE 2 SUMMARY

### Deliverables
✅ Gallery auto-watermarking
✅ Client messaging system
✅ Gallery access logging & analytics
✅ ZIP export for galleries
✅ One-click gallery sharing

### Time Estimate
Total: **42-51 hours** (1-1.5 weeks full-time)

### Database Changes
- Add `WatermarkPreset` table
- Add `ClientMessage` table
- Add `GalleryAccessLog` table

### New Services
- Watermarking service (Sharp)
- ZIP export service (archiver)
- Message parsing service (email threading)

### Testing Effort
- 10-12 hours

### User Value
- Professional watermarked deliverables
- Rich client communication
- Access insights (who viewed, when)
- Easy file delivery (ZIP export)
- Simplified gallery sharing workflow

---

## PHASE 3: AUTOMATION & EFFICIENCY

### Overview
Reduce manual tasks with intelligent trigger-based automation and smart reminders.

---

### STEP 3.1: Workflow Automation Engine (Core)

**What:** Foundation for trigger-based actions without coding

**Implementation Details:**

**Backend Changes:**
1. Create workflow/automation models:
   ```prisma
   model WorkflowAutomation {
     id String @id @default(cuid())
     userId String
     name String // "Auto-create invoice on proposal accept"
     description String?
     isActive Boolean @default(true)
     triggers WorkflowTrigger[] // Can have multiple triggers
     actions WorkflowAction[]
     createdAt DateTime @default(now())
   }

   model WorkflowTrigger {
     id String @id @default(cuid())
     automationId String
     automation WorkflowAutomation @relation(fields: [automationId], references: [id], onDelete: Cascade)
     type 'proposal_accepted' | 'proposal_declined' | 'contract_signed' | 'invoice_paid' | 'invoice_overdue'
     conditions String // JSON for complex logic
   }

   model WorkflowAction {
     id String @id @default(cuid())
     automationId String
     automation WorkflowAutomation @relation(fields: [automationId], references: [id], onDelete: Cascade)
     type 'create_contract' | 'create_invoice' | 'send_email' | 'create_task' | 'update_status'
     params String // JSON with action parameters
     order Int
   }
   ```

2. Create automation engine service:
   ```typescript
   // apps/api/src/services/automation.ts

   // Trigger handlers
   async function onProposalAccepted(proposalId: string) {
     const automations = await getAutomationsByTrigger('proposal_accepted')
     for (const automation of automations) {
       await executeWorkflow(automation, { proposalId })
     }
   }

   async function executeWorkflow(automation: WorkflowAutomation, context: any) {
     for (const action of automation.actions) {
       switch (action.type) {
         case 'create_contract':
           await ContractService.createFromProposal(context.proposalId)
           break
         case 'create_invoice':
           await InvoiceService.createFromProposal(context.proposalId)
           break
         case 'send_email':
           await EmailService.send(action.params)
           break
         // ... other actions
       }
     }
   }
   ```

3. Hook automation into existing workflows:
   - Update `ProposalService.acceptProposal()` to call `onProposalAccepted()`
   - Update `ContractService.signContract()` to call `onContractSigned()`
   - Update `InvoiceService.markPaid()` to call `onInvoicePaid()`
   - Etc.

4. Add API endpoints:
   - `GET /admin/automations` - List automations
   - `POST /admin/automations` - Create automation
   - `PATCH /admin/automations/:id` - Update automation
   - `DELETE /admin/automations/:id` - Delete automation
   - `PATCH /admin/automations/:id/toggle` - Enable/disable
   - `POST /admin/automations/:id/test` - Test automation

**Frontend Changes:**
1. Create automation builder page (`/admin/settings/automations`)
   - List existing automations
   - "Create new automation" button
   - Visual workflow builder

2. Workflow builder UI:
   - Step 1: Select trigger (dropdown)
     - "When proposal is accepted"
     - "When contract is signed"
     - "When invoice is paid"
     - "When invoice is overdue"
   - Step 2: Add actions (buttons to add multiple)
     - "Create contract from proposal"
     - "Create invoice from proposal"
     - "Send email"
     - "Create task reminder"
     - Etc.
   - Step 3: Configure action details
     - For "Send email": select template, recipient
     - For "Create invoice": set due date offset
   - Preview of automation
   - "Save" and "Test" buttons

3. Visual timeline builder (alternative UX):
   - Drag-and-drop blocks: Trigger block → Action blocks
   - Color-coded (blue=trigger, green=actions)
   - Connection lines showing flow
   - Edit blocks inline
   - Real-time validation

4. Settings page enhancements:
   - "Automations" section
   - Toggle automations on/off quickly
   - List of active automations
   - "Create automation" quick button

**UI/UX Details:**
- Guided step-by-step builder
- Automation templates for common workflows
- Preview before saving
- Test automation (dry run)
- Visual representation of workflow
- Disable without deleting
- Automation log showing when triggered
- Undo capability (if action failed)

**Estimated Effort:** 18-22 hours

**Testing Checklist:**
- [ ] Create automation
- [ ] Trigger fires correctly
- [ ] Action executes
- [ ] Multiple actions in sequence work
- [ ] Automation can be disabled
- [ ] Test mode works
- [ ] Automation persists
- [ ] Update automation works
- [ ] Delete automation works
- [ ] Complex conditions work
- [ ] Dry run shows what would happen
- [ ] Error handling (failed actions don't break workflow)

---

### STEP 3.2: Pre-built Automation Templates

**What:** Common automation workflows ready to use

**Implementation Details:**

**Backend Changes:**
1. Create `AutomationTemplate` data (seed file or migration):
   ```typescript
   const templates = [
     {
       name: 'Auto-create invoice on proposal accept',
       description: 'When client accepts proposal, automatically generate invoice',
       trigger: 'proposal_accepted',
       actions: [
         { type: 'create_invoice', params: { setDueInDays: 14 } }
       ]
     },
     {
       name: 'Auto-create contract on proposal accept',
       description: 'When client accepts proposal, automatically generate contract',
       trigger: 'proposal_accepted',
       actions: [
         { type: 'create_contract', params: { useDefaultTemplate: true } }
       ]
     },
     {
       name: 'Send payment reminder for overdue invoices',
       description: 'When invoice becomes overdue, send payment reminder email',
       trigger: 'invoice_overdue',
       actions: [
         { type: 'send_email', params: { templateId: 'overdue_invoice_reminder' } },
         { type: 'create_task', params: { title: 'Follow up on overdue invoice' } }
       ]
     },
     {
       name: 'Full automation: Proposal → Contract → Invoice',
       description: 'Complete workflow: accept proposal, create contract and invoice',
       trigger: 'proposal_accepted',
       actions: [
         { type: 'create_contract', params: { useDefaultTemplate: true } },
         { type: 'create_invoice', params: { setDueInDays: 14 } }
       ]
     }
   ]
   ```

2. Create API endpoint to list templates:
   - `GET /admin/automations/templates` - List all templates
   - `POST /admin/automations/from-template/:templateId` - Create automation from template

**Frontend Changes:**
1. Update automation builder:
   - Add "Templates" tab
   - Show template cards with preview
   - Click "Use this template" button
   - Builder pre-fills with template actions
   - User can customize before saving

2. Automation creation flow:
   - Show templates first ("Quick start" recommendations)
   - "Create from template" button on each
   - Or "Create custom" for advanced users

**UI/UX Details:**
- Template cards show trigger and action summary
- Rating/popularity indicator
- "Use this template" one-click
- Easy to customize after selection
- Templates marked as "Recommended" for beginners

**Estimated Effort:** 4-6 hours

**Testing Checklist:**
- [ ] Templates load correctly
- [ ] Create automation from template works
- [ ] Template actions populate correctly
- [ ] User can customize template
- [ ] Customized automation works
- [ ] Template list shows helpful info

---

### STEP 3.3: Email Template Customization

**What:** Edit email messages for automated sends

**Implementation Details:**

**Backend Changes:**
1. Create `EmailTemplate` model:
   ```prisma
   model EmailTemplate {
     id String @id @default(cuid())
     userId String
     slug String // 'proposal_sent', 'payment_reminder', etc.
     name String
     subject String
     body String // HTML body
     variables String[] // Available placeholders
     isDefault Boolean @default(false)
     createdAt DateTime @default(now())
   }
   ```

2. Default templates (seed data):
   - `proposal_sent` - "Your proposal is ready"
   - `contract_sent` - "Please sign this contract"
   - `invoice_sent` - "Your invoice is ready"
   - `payment_reminder` - "Friendly payment reminder"
   - `payment_overdue` - "Invoice overdue notice"
   - `gallery_ready` - "Your photos are ready"

3. Update EmailService to:
   - Load user's custom template (or fallback to default)
   - Apply variables (client name, amounts, dates, etc.)
   - Send email

4. Add API endpoints:
   - `GET /admin/email-templates` - List templates
   - `PATCH /admin/email-templates/:slug` - Update template
   - `GET /admin/email-templates/:slug` - Get template
   - `POST /admin/email-templates/:slug/preview` - Preview with sample data

**Frontend Changes:**
1. Create email templates page (`/admin/settings/email-templates`)
   - List all templates (proposal_sent, payment_reminder, etc.)
   - Click to edit
   - Edit form:
     - Subject line editor
     - Body HTML editor (rich text or code)
     - Variable reference guide
     - Live preview pane
     - "Reset to default" button
   - Save changes

2. Template editor features:
   - Rich text editor (WYSIWYG) or code editor toggle
   - Insert variable button (shows list)
   - Preview pane shows rendered email
   - Test email button (send yourself a test)
   - Sample data selector (preview for different scenarios)

3. Variable reference panel:
   - {{client.name}}
   - {{client.email}}
   - {{proposal.number}}, {{proposal.total}}
   - {{contract.number}}
   - {{invoice.number}}, {{invoice.amount}}, {{invoice.dueDate}}
   - {{studio.name}}, {{studio.email}}
   - {{date}}, {{tomorrow}}, {{oneWeekFromNow}}

**UI/UX Details:**
- Side-by-side editor and preview
- Color syntax highlighting in code editor
- Variable autocomplete (start typing {{)
- Drag variable pills into template
- Markdown support optional
- Revert to default button
- Template versioning (optional)

**Estimated Effort:** 8-10 hours

**Testing Checklist:**
- [ ] Load custom template
- [ ] Edit template saves
- [ ] Variables substitute in preview
- [ ] Test email sends with correct content
- [ ] Fallback to default if custom missing
- [ ] Reset to default works
- [ ] Multiple templates don't interfere
- [ ] HTML renders correctly in email client
- [ ] Mobile email rendering good

---

### STEP 3.4: Smart Reminders & Task Management

**What:** Auto-generate and manage reminders for follow-ups

**Implementation Details:**

**Backend Changes:**
1. Create `Reminder` model:
   ```prisma
   model Reminder {
     id String @id @default(cuid())
     userId String
     type 'task' | 'notification' | 'email'
     title String
     description String?
     relatedEntity String? // e.g., "proposal:123", "invoice:456"
     scheduledFor DateTime
     sentAt DateTime?
     completedAt DateTime?
     status 'pending' | 'sent' | 'completed' | 'dismissed'
     createdAt DateTime @default(now())
   }
   ```

2. Reminder triggers (in automations):
   - Create reminder when invoice sent (due in 14 days: send reminder in 13 days)
   - Create reminder when contract sent (follow up in 3 days if not signed)
   - Create reminder for upcoming shoot date
   - Manual reminder creation

3. Background job to execute reminders:
   - Cron job checks for reminders due
   - Sends email/notification
   - Updates reminder `sentAt` timestamp

4. Add API endpoints:
   - `GET /admin/reminders` - List pending reminders
   - `POST /admin/reminders` - Create reminder
   - `PATCH /admin/reminders/:id` - Update (mark complete)
   - `DELETE /admin/reminders/:id` - Dismiss

**Frontend Changes:**
1. Create reminders section in dashboard:
   - "Upcoming reminders" widget
   - List of pending reminders
   - Checkmark to complete
   - Click to dismiss
   - Notification badge in header

2. Create reminder management page (`/admin/reminders`):
   - List all reminders (pending, completed, dismissed)
   - Create new reminder button
     - Title
     - Description
     - Related entity (client, proposal, etc.)
     - Date/time picker
     - Type (in-app notification, email)
   - Edit reminder
   - Soft delete (archive)
   - Filter by status

3. Floating reminder notification:
   - Toast/banner when reminder time comes
   - Click to view details
   - Snooze 1 hour / 1 day
   - Dismiss permanently

**UI/UX Details:**
- Reminder cards with time relative to now ("in 2 days")
- Color coding (urgent = red)
- Link to related document
- Quick actions (complete, snooze, dismiss)
- Calendar view of reminders (optional)
- Recurring reminders (optional)

**Estimated Effort:** 8-10 hours

**Testing Checklist:**
- [ ] Create reminder
- [ ] Reminder fires at scheduled time
- [ ] Email sent for email reminders
- [ ] Notification sent for in-app reminders
- [ ] Complete reminder marks it done
- [ ] Dismiss removes from list
- [ ] Filter by status works
- [ ] Recurring reminders work
- [ ] Cron job executes reliably
- [ ] No duplicate reminders
- [ ] Timezone handling correct

---

### STEP 3.5: Proposal Auto-Expiry & Follow-Up

**What:** Automatically expire old proposals and send gentle reminders

**Implementation Details:**

**Backend Changes:**
1. Add to `Proposal` model:
   ```prisma
   model Proposal {
     // ... existing fields
     expiresAt DateTime?
     status 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
     reminderSentAt DateTime?
   }
   ```

2. Background job (cron):
   - Daily check for proposals past `expiresAt`
   - Update status to 'EXPIRED'
   - Send follow-up email: "This proposal has expired, shall we discuss?"
   - Create reminder to follow up with client

3. Settings for automation:
   - `proposalExpiryDays: number` (default: 30)
   - `sendProposalReminderBeforeDays: number` (default: 3 - send reminder 3 days before expiry)
   - `autoSendExpiryEmail: boolean`

4. Add API endpoints:
   - `PATCH /admin/proposals/:id/extend-expiry` - Extend deadline
   - `POST /admin/proposals/:id/send-reminder` - Manually send reminder

**Frontend Changes:**
1. Proposal list enhancements:
   - Show "Expires in X days" on each proposal
   - Color-code expiring soon (orange) or expired (red)
   - "Extend expiry" button on expiring proposals
   - "Send reminder" button

2. Proposal editor:
   - Add "Expiry date" field (optional)
   - Show countdown timer
   - Quick actions: "Extend 2 weeks", "Remove expiry"

3. Settings:
   - Configure proposal expiry defaults
   - Configure reminder timing
   - Toggle auto-expire

**UI/UX Details:**
- Expiry date shown as relative time ("Expires in 8 days")
- Urgent visual indicator (red) for expiring soon
- One-click extend button
- Email preview before sending reminder

**Estimated Effort:** 6-8 hours

**Testing Checklist:**
- [ ] Proposals expire at correct time
- [ ] Status changes to EXPIRED
- [ ] Email sent before expiry
- [ ] Reminder created
- [ ] Extend expiry works
- [ ] Settings respected
- [ ] No duplicate reminders
- [ ] Edge case: DST/timezone

---

## PHASE 3 SUMMARY

### Deliverables
✅ Workflow automation engine
✅ Pre-built automation templates
✅ Email template customization
✅ Smart reminders & tasks
✅ Proposal auto-expiry & follow-up

### Time Estimate
Total: **44-56 hours** (1.5 weeks full-time)

### Database Changes
- Add `WorkflowAutomation`, `WorkflowTrigger`, `WorkflowAction` tables
- Add `EmailTemplate` table
- Add `Reminder` table
- Add `expiresAt`, `reminderSentAt` to `Proposal`

### New Services
- Automation engine (trigger and action execution)
- Reminder scheduler (background job)
- Email template renderer

### Testing Effort
- 12-14 hours (automation testing can be complex)

### User Value
- 50%+ reduction in manual follow-ups
- Seamless document workflow
- Customizable communications
- Never miss a deadline
- Task management integration

---

## PHASE 4: INSIGHT & RELIABILITY

### Overview
Provide business visibility through analytics and ensure data safety with backups and security.

---

### STEP 4.1: Enhanced Dashboard with Key Metrics

**What:** At-a-glance business insights

**Implementation Details:**

**Backend Changes:**
1. Update analytics service to calculate:
   - Monthly revenue (sum of paid invoices)
   - Outstanding amount (sum of unpaid/partial invoices)
   - Total clients (active)
   - Signed contracts (this month)
   - Proposals acceptance rate
   - Average project value

2. Add API endpoints:
   - `GET /admin/analytics/dashboard` - Dashboard metrics
   - `GET /admin/analytics/monthly/:year/:month` - Detailed monthly breakdown
   - `GET /admin/analytics/clients` - Client acquisition metrics
   - `GET /admin/analytics/revenue` - Revenue trends

**Frontend Changes:**
1. Enhanced dashboard page (`/` or `/admin/dashboard`)

   Layout:
   ```
   ┌── THIS MONTH ──────────────────────────────┐
   │ Revenue: $12,450 ↑ 15% vs last month       │
   │ Outstanding: $3,200 (2 invoices)            │
   │ Contracts Signed: 3 ✓                       │
   │ New Clients: 4                              │
   └────────────────────────────────────────────┘

   ┌── PROPOSALS ────────────────────────────────┐
   │ Acceptance Rate: 72% (13/18 accepted)       │
   │ Avg Project Value: $1,850                   │
   │ Pending: 2 (awaiting response)              │
   └────────────────────────────────────────────┘

   ┌── CASH FLOW (Chart) ───────────────────────┐
   │ [Line graph: revenue over time]              │
   │ Toggle: Weekly / Monthly / Yearly           │
   └────────────────────────────────────────────┘

   ┌── TOP SERVICES (Pie chart) ────────────────┐
   │ Wedding: $5,200 (42%)                       │
   │ Portrait: $3,100 (25%)                      │
   │ Commercial: $2,850 (23%)                    │
   │ Other: $1,300 (10%)                         │
   └────────────────────────────────────────────┘

   ┌── RECENT ACTIVITY ────────────────────────┐
   │ Nov 6: Invoice #2024-020 PAID ($2,500)      │
   │ Nov 5: Contract signed (Wedding)            │
   │ Nov 4: New client: Jane Smith               │
   │ Nov 3: Proposal accepted ($1,850)           │
   └────────────────────────────────────────────┘
   ```

2. Components:
   - `MetricsCard` - Big number with trend (up/down arrow)
   - `LineChart` - Revenue trends (Recharts library)
   - `PieChart` - Service breakdown
   - `ActivityTimeline` - Recent events
   - `ClientAcquisitionCard` - New clients this month
   - `OutstandingInvoicesCard` - Quick view of unpaid

3. Interactive features:
   - Click metric to see details
   - Toggle timeframe (weekly/monthly/yearly)
   - Export dashboard as PDF/image
   - Customize which metrics show
   - Drill-down to details (click "Revenue" → see invoice list)

**UI/UX Details:**
- Clean card layout with minimal design
- Color-coded (green=good, red=attention, blue=neutral)
- Trend indicators (↑↓ with % change)
- Responsive (mobile shows vertical stacking)
- Dark mode support
- Loading skeleton placeholders

**Estimated Effort:** 12-14 hours

**Testing Checklist:**
- [ ] Metrics calculate correctly
- [ ] Revenue totals accurate
- [ ] Outstanding amounts accurate
- [ ] Charts render correctly
- [ ] Timeframe filtering works
- [ ] Drill-down to details works
- [ ] Performance acceptable (large datasets)
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Export PDF works

---

### STEP 4.2: Client Engagement & Acquisition Insights

**What:** Track client sources and engagement patterns

**Implementation Details:**

**Backend Changes:**
1. Track client source:
   ```prisma
   model Client {
     // ... existing fields
     source 'website' | 'referral' | 'social' | 'email' | 'phone' | 'manual' | 'inquiry'
     sourceDetails String? // "Instagram", "Jane Smith referral", etc.
   }
   ```

2. Add API endpoints:
   - `GET /admin/analytics/acquisition` - Client acquisition by source
   - `GET /admin/analytics/engagement/:clientId` - Client engagement (proposals viewed, etc.)

3. Analytics calculations:
   - Clients by source (pie chart)
   - Acquisition trend (new clients per month)
   - Client lifetime value (total revenue per client)
   - Client retention rate
   - Repeat client percentage

**Frontend Changes:**
1. Create insights page (`/admin/analytics/clients`)
   - Client acquisition breakdown (pie chart by source)
   - New clients this month (number)
   - Client lifetime value (sorted list)
   - Retention rate (%)
   - Repeat client count
   - Client engagement heatmap (matrix: client vs engagement)

2. Client detail page enhancement:
   - Show "Client lifetime value"
   - Show "Acquisition source"
   - Show "Engagement score" (based on proposal views, gallery accesses)

3. Dashboard widget:
   - "Top 5 most valuable clients"
   - "Acquisition sources this month"

**UI/UX Details:**
- Pie chart for source breakdown
- Timeline showing new clients over time
- Sortable list of clients by lifetime value
- Engagement score visualization (bars)
- Acquisition source tags on client cards

**Estimated Effort:** 6-8 hours

**Testing Checklist:**
- [ ] Acquisition sources tracked correctly
- [ ] Charts display correct data
- [ ] Client lifetime value calculates correctly
- [ ] Retention rate accurate
- [ ] Engagement score calculated
- [ ] Performance with large client lists
- [ ] Filters work (date range, source)

---

### STEP 4.3: Encrypted Backup System

**What:** Automatic encrypted local backups for peace of mind

**Implementation Details:**

**Backend Changes:**
1. Create backup service:
   ```typescript
   // apps/api/src/services/backup.ts

   export async function createBackup(): Promise<BackupMetadata> {
     const backup = {
       timestamp: new Date(),
       encryption: 'AES-256',
       size: 0,
       recordCount: 0,
       data: {}
     }

     // Export all data
     backup.data.clients = await prisma.client.findMany()
     backup.data.proposals = await prisma.proposal.findMany()
     // ... all other models

     // Encrypt JSON
     const json = JSON.stringify(backup)
     const encrypted = encrypt(json, userMasterPassword)

     // Save to file
     const filename = `backup-${Date.now()}.bak`
     await fs.writeFile(path.join(BACKUP_DIR, filename), encrypted)

     return { filename, size: encrypted.length, timestamp: new Date() }
   }
   ```

2. Add API endpoints:
   - `POST /admin/backup/create` - Create backup now
   - `GET /admin/backup/history` - List backups
   - `POST /admin/backup/:backupId/restore` - Restore from backup
   - `DELETE /admin/backup/:backupId` - Delete backup
   - `GET /admin/backup/download/:backupId` - Download encrypted file

3. Background job:
   - Run automatic backup weekly (or configurable)
   - Delete old backups (keep last 4 weeks, then monthly)
   - Verify backup integrity

4. Settings for automation:
   - `backupFrequency: 'daily' | 'weekly' | 'monthly'`
   - `backupRetentionDays: number` (default: 90)
   - `autoBackupEnabled: boolean`

**Frontend Changes:**
1. Create backup management page (`/admin/settings/backups`)
   - Current backup status ("Last backup: 2 days ago")
   - Backup history (list with dates and sizes)
   - "Create backup now" button
   - "Restore from backup" button (with confirmation)
   - "Download backup" button (encrypted file)
   - "Delete backup" button (with warning)

2. Settings section:
   - Toggle "Auto-backup enabled"
   - Backup frequency selector
   - Backup retention days input
   - Show next scheduled backup

3. Dashboard widget:
   - "Backup status" card
   - Last backup date/time
   - "Create backup" button
   - Green indicator if recent backup exists

4. Security:
   - Password confirmation before restore
   - Show what data will be restored
   - Restore to sandbox first (optional dry-run)

**UI/UX Details:**
- "Create backup now" one-click
- List shows backup date, size, status
- Clear "Download" button with encryption info
- Restore requires confirmation and password
- Progress bar during backup creation
- Toast notifications (backup complete, restore complete)
- Warning: "Restore will overwrite current data"

**Estimated Effort:** 10-12 hours

**Testing Checklist:**
- [ ] Create backup successfully
- [ ] Backup file encrypted
- [ ] Backup contains all data
- [ ] List backups correctly
- [ ] Download backup file
- [ ] Restore from backup works
- [ ] Data integrity after restore
- [ ] Auto-backup runs on schedule
- [ ] Old backups deleted
- [ ] Backup size reasonable
- [ ] Restore password protection works
- [ ] Edge case: restore with foreign key constraints

---

### STEP 4.4: Data Export (JSON/CSV)

**What:** Manual export of all data for external use or analysis

**Implementation Details:**

**Backend Changes:**
1. Create export service:
   ```typescript
   export async function exportDataAsJSON(): Promise<Buffer> {
     const data = {
       exportDate: new Date(),
       clients: await prisma.client.findMany(),
       proposals: await prisma.proposal.findMany(),
       // ... all models
     }
     return JSON.stringify(data, null, 2)
   }

   export async function exportDataAsCSV(entityType: string): Promise<string> {
     // CSV format for given entity type
     // Uses libraries like 'csv' or 'papaparse'
   }
   ```

2. Add API endpoints:
   - `GET /admin/export/json` - Export all data as JSON
   - `GET /admin/export/csv/:entityType` - Export specific entity as CSV

**Frontend Changes:**
1. Create export page (`/admin/settings/export`)
   - "Export all data" button (downloads JSON)
   - Individual export buttons:
     - Clients (CSV)
     - Proposals (CSV)
     - Contracts (CSV)
     - Invoices (CSV)
     - Gallery info (CSV)
   - Show exported data size estimate
   - Timestamp in exported files

2. Features:
   - Select date range for exports (optional)
   - Select specific client for filtered export
   - Download as ZIP (all CSVs + JSON)

**UI/UX Details:**
- Simple "Download" buttons
- File naming includes date
- Show file size
- Confirmation: "This will download all your data"
- Success toast with filename

**Estimated Effort:** 4-6 hours

**Testing Checklist:**
- [ ] JSON export contains all data
- [ ] CSV exports formatted correctly
- [ ] Data integrity in export
- [ ] File naming correct
- [ ] Date formatting consistent
- [ ] Large exports don't timeout
- [ ] Sensitive data handled (passwords encrypted/excluded)
- [ ] Character encoding correct (UTF-8)

---

### STEP 4.5: Activity Log & Security Audit

**What:** Track user actions for security and compliance

**Implementation Details:**

**Backend Changes:**
1. Already have `AuditLog` model, enhance it:
   - Ensure all major actions logged
   - Add security-specific events (login, password change, 2FA)
   - Refine metadata captured

2. Track events:
   - LOGIN / LOGOUT
   - PASSWORD_CHANGED
   - 2FA_ENABLED / 2FA_DISABLED
   - BACKUP_CREATED / BACKUP_RESTORED / BACKUP_DELETED
   - DATA_EXPORTED
   - USER_SETTINGS_CHANGED
   - PROPOSAL_SENT / CONTRACT_SENT / INVOICE_SENT
   - CLIENT_DELETED / DATA_DELETED
   - Etc.

3. Add API endpoint:
   - `GET /admin/audit-logs/security` - Filter for security events
   - `GET /admin/audit-logs` - All activity

**Frontend Changes:**
1. Create activity log page (`/admin/settings/audit-logs`)
   - Timeline of all actions
   - Filter by action type
   - Filter by date range
   - Search by entity name
   - Show: who, what, when, where (IP)

2. Security-focused view:
   - Highlight: logins, password changes, data exports, deletions
   - Show IP address for logins
   - Show device/browser info (user agent)
   - Alert on suspicious patterns (multiple failed logins)

3. Dashboard widget:
   - "Recent activity" (last 5 events)
   - Security alerts section

**UI/UX Details:**
- Timeline view with event cards
- Color-coded severity (security events bold/red)
- Filterable by category
- Sortable by date
- Download activity report (PDF/CSV)

**Estimated Effort:** 4-6 hours

**Testing Checklist:**
- [ ] All actions logged
- [ ] Audit log entries accurate
- [ ] Timeline displays correctly
- [ ] Filters work
- [ ] IP logging works
- [ ] No performance impact from logging
- [ ] Sensitive data not logged (passwords)

---

### STEP 4.6: 2FA (Two-Factor Authentication) Setup

**What:** Optional 2FA for account security

**Implementation Details:**

**Backend Changes:**
1. Add 2FA support using TOTP (Time-based One-Time Password)
   ```prisma
   model AdminUser {
     // ... existing fields
     twoFactorEnabled Boolean @default(false)
     twoFactorSecret String? // Encrypted seed
     backupCodes String[]? // Recovery codes
   }
   ```

2. Services:
   - Generate TOTP secret (speakeasy library)
   - Generate QR code for authenticator apps
   - Verify TOTP code
   - Generate backup codes
   - Verify backup code

3. Add API endpoints:
   - `POST /auth/2fa/setup` - Initiate 2FA setup
   - `POST /auth/2fa/verify` - Verify TOTP during login
   - `POST /auth/2fa/backup-codes` - Get backup codes
   - `PATCH /auth/2fa/disable` - Disable 2FA

4. Authentication flow:
   - Login with email/password
   - If 2FA enabled: ask for TOTP code
   - Validate code
   - Create session

**Frontend Changes:**
1. Create 2FA setup page (`/admin/settings/security/2fa`)
   - Current status (enabled/disabled)
   - Enable button:
     - Show QR code for authenticator
     - Show manual entry code
     - User scans with authenticator app
     - User confirms with 6-digit code
     - Show backup codes (generate and save)
   - Disable button (with current password confirmation)
   - Manage backup codes

2. Login page enhancement:
   - After password, if 2FA enabled:
     - "Enter 6-digit code from authenticator"
     - "Use backup code instead" link
     - Input field with auto-focus
     - Submit on Enter key

3. Settings page:
   - "Security" section
   - 2FA status toggle
   - Link to 2FA setup

**UI/UX Details:**
- Large QR code for easy scanning
- Manual code option if QR doesn't work
- Clear backup code copy-paste
- Download backup codes as PDF
- Recovery mode info (what to do if lost authenticator)
- List of authenticator apps (Google Authenticator, Authy, etc.)

**Estimated Effort:** 8-10 hours

**Testing Checklist:**
- [ ] 2FA setup works
- [ ] QR code scans correctly
- [ ] TOTP code validates
- [ ] Login with 2FA works
- [ ] Backup codes work
- [ ] Disable 2FA works
- [ ] Time sync (TOTP depends on correct time)
- [ ] Session created after 2FA verify
- [ ] No bypass of 2FA
- [ ] Recovery codes prevent lockout

---

## PHASE 4 SUMMARY

### Deliverables
✅ Enhanced dashboard with metrics
✅ Client engagement insights
✅ Encrypted backup system
✅ Data export (JSON/CSV)
✅ Activity log & security audit
✅ 2FA authentication

### Time Estimate
Total: **44-56 hours** (1.5 weeks full-time)

### Database Changes
- Add `source`, `sourceDetails` to `Client`
- Enhance `AuditLog` fields
- Add 2FA fields to `AdminUser`

### New Services
- Analytics service (extended)
- Backup/restore service
- Export service
- TOTP/2FA service

### Testing Effort
- 10-12 hours (backup/restore testing critical)

### User Value
- Business visibility and insights
- Data safety and recovery
- Account security
- Compliance/audit trail
- Peace of mind

---

## GENERAL UX ENHANCEMENTS (ONGOING)

These features should be implemented throughout all phases:

### STEP: Global Search (Ctrl+K)

**What:** Quick command palette for navigation

**Implementation:**
1. Add global search handler to `useKeyPress` hook
2. Show command palette modal on Ctrl+K
3. Searchable items:
   - Clients (type client name)
   - Proposals (type proposal number)
   - Invoices (type invoice number)
   - Galleries (type gallery name)
   - Pages (type "settings", "dashboard", etc.)
4. Show recent searches
5. Keyboard navigation (arrow keys, Enter to select)

**Estimated Effort:** 4-5 hours

---

### STEP: Autosave Drafts Everywhere

**What:** Never lose work

**Implementation:**
1. Debounced autosave on form changes
2. Show "Saving..." indicator
3. Store in localStorage as backup
4. Show "Draft saved" confirmation
5. Detect unsaved changes on page leave

**Estimated Effort:** 2-3 hours

---

### STEP: Quick Actions Floating Button

**What:** Fast access to common actions

**Implementation:**
1. Floating button (bottom right)
2. Menu with:
   - New proposal
   - New invoice
   - New contract
   - New client
   - New gallery
   - New message
3. Keyboard shortcut: `N` key
4. Collapse/expand states

**Estimated Effort:** 3-4 hours

---

### STEP: Keyboard Shortcuts

**What:** Power user efficiency

**Implementation:**
- `N` = New (shows quick action menu)
- `/` or `Ctrl+K` = Search
- `R` = Refresh
- `?` = Keyboard shortcuts help
- `Escape` = Close modal/dismiss
- `Ctrl+S` = Save
- Arrow keys = Navigate lists

**Estimated Effort:** 2-3 hours

---

### STEP: Onboarding Checklist

**What:** Guide new users through setup

**Implementation:**
1. Show on first login
2. Checklist of tasks:
   - [ ] Set up business info (settings)
   - [ ] Connect payment (Stripe)
   - [ ] Create first proposal template
   - [ ] Send first proposal
   - [ ] Add first gallery
   - [ ] Customize email templates
3. Each task links to relevant page
4. Track completion
5. Collapsible widget (not intrusive)

**Estimated Effort:** 4-5 hours

---

### STEP: Dark Mode Toggle

**What:** Already partially implemented, complete polish

**Implementation:**
- Toggle in header (already done)
- Persist preference to localStorage
- Respect system preference (prefers-color-scheme)
- Smooth transition animations
- Ensure all new components support dark mode

**Estimated Effort:** 2-3 hours

---

## IMPLEMENTATION CHECKLIST

Use this checklist to track progress through all phases:

### PHASE 1: CLIENT WORKFLOW FOUNDATION
- [ ] Proposal templates backend
- [ ] Proposal templates frontend
- [ ] Auto-variable substitution backend
- [ ] Auto-variable substitution frontend
- [ ] Single-click conversion chain
- [ ] Client unified dashboard
- [ ] Client notes system
- [ ] Client tags system
- [ ] Testing & QA

### PHASE 2: DELIVERY EXPERIENCE POLISH
- [ ] Watermark presets backend
- [ ] Watermark presets frontend
- [ ] Watermarking service
- [ ] Client messaging backend
- [ ] Client messaging frontend
- [ ] Gallery access logging
- [ ] Gallery analytics
- [ ] ZIP export service
- [ ] ZIP export UI
- [ ] Gallery sharing UI
- [ ] Testing & QA

### PHASE 3: AUTOMATION & EFFICIENCY
- [ ] Automation engine core
- [ ] Automation API endpoints
- [ ] Automation UI builder
- [ ] Automation templates
- [ ] Email template system
- [ ] Reminder system
- [ ] Proposal expiry automation
- [ ] Testing & QA

### PHASE 4: INSIGHT & RELIABILITY
- [ ] Dashboard metrics API
- [ ] Dashboard UI with charts
- [ ] Client acquisition tracking
- [ ] Engagement insights
- [ ] Backup service
- [ ] Backup UI
- [ ] Data export service
- [ ] Audit log enhancements
- [ ] 2FA implementation
- [ ] Testing & QA

### GENERAL UX (THROUGHOUT)
- [ ] Global search (Ctrl+K)
- [ ] Autosave drafts
- [ ] Floating quick actions
- [ ] Keyboard shortcuts
- [ ] Onboarding checklist
- [ ] Dark mode polish
- [ ] Testing & QA

---

## TIMELINE & RESOURCE ESTIMATE

### PHASE BREAKDOWN

| Phase | Hours | Timeline (1 Dev) | Timeline (2 Dev) |
|-------|-------|------------------|------------------|
| Phase 1 | 40-50 | 1-1.5 weeks | 4-5 days |
| Phase 2 | 42-51 | 1.5 weeks | 5-6 days |
| Phase 3 | 44-56 | 1.5-2 weeks | 5-7 days |
| Phase 4 | 44-56 | 1.5-2 weeks | 5-7 days |
| General UX | 17-23 | 3-4 days | 2-3 days |
| **TOTAL** | **187-236** | **6-8 weeks** | **3-4 weeks** |

### TESTING EFFORT
- Estimated: 50-60 hours (20-25% of development)
- QA timeline: 1.5-2 weeks (1 person)

### TOTAL PROJECT TIMELINE
- **Single Developer:** 8-10 weeks (including testing)
- **Team of 2:** 4-5 weeks
- **Team of 3:** 3 weeks

### RECOMMENDED APPROACH
1. **Week 1-2:** Phase 1 (high impact on core workflow)
2. **Week 3-4:** Phase 2 (delivery experience improves user satisfaction)
3. **Week 5-6:** Phase 3 (automation saves time long-term)
4. **Week 7-8:** Phase 4 (business insights and reliability)
5. **Week 9:** Final QA, bug fixes, polish

### RESOURCE REQUIREMENTS
- **Backend Developer:** 70% of time (database, APIs, business logic)
- **Frontend Developer:** 70% of time (UI, UX, interactions)
- **QA/Tester:** 1 person, 2 weeks
- **Designer (optional):** 5-10 hours (polish, design refinements)

### BUDGET ESTIMATE (Freelance Rates)
- Backend dev: 70 hours @ $75/hr = $5,250
- Frontend dev: 70 hours @ $75/hr = $5,250
- QA: 60 hours @ $50/hr = $3,000
- **Total:** ~$13,500 (or lower if in-house team)

---

## CRITICAL SUCCESS FACTORS

1. **Start with Phase 1** - The client workflow foundation is the highest impact
2. **Iterate & Validate** - Get user feedback after each phase
3. **Database Migrations** - Plan schema changes carefully
4. **Testing** - Automate tests as you go (unit, integration, e2e)
5. **Documentation** - Keep API docs and feature docs updated
6. **Performance** - Monitor for N+1 queries, optimize as needed
7. **Security** - Validate inputs, sanitize outputs, use prepared statements

---

## RECOMMENDED NEXT STEP

**Start with Phase 1, Step 1.1: Proposal Templates**

This is the highest-impact, lowest-complexity enhancement. A solo creator can immediately start saving 15-20 minutes per proposal with templates. Success here will:
- Validate the implementation approach
- Build confidence for subsequent phases
- Provide quick user value
- Create a pattern for similar features

---

**This roadmap is flexible.** Adjust based on:
- User feedback
- Business priorities
- Development velocity
- Resource availability
- Market needs

**Good luck with the Kori Solo Upgrade!** 🚀

