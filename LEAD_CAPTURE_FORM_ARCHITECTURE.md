# Lead Capture Form Builder & Enquiry Journey - Architecture & Implementation Plan

**Purpose:** Implement a lead capture form system for the public website to inquire about photography shoots, integrated into Mizu Studio platform

**Status:** Planning Phase
**Date:** November 5, 2025

---

## Executive Summary

**Recommendation:** Implement lead capture forms **WITHIN the existing Mizu Studio application** rather than as a separate application.

**Rationale:**
1. **Single source of truth** - All customer data in one place
2. **Better CRM integration** - Leads automatically become clients
3. **Consistent user experience** - Same branding and design
4. **Reduced operational complexity** - One database, one authentication system
5. **Easier workflow automation** - Links directly to proposals and contracts

---

## Architecture Decision: Integrated vs. Separate

### Option A: Integrated (RECOMMENDED) ✅

**Pros:**
- Single application, single database
- Leads automatically become clients
- Real-time synchronization
- Shared authentication and authorization
- One deployment pipeline
- Reduced operational overhead
- Better analytics and reporting
- Easier workflow automation

**Cons:**
- Slightly larger application
- Public form and admin form in same codebase

**Estimated Effort:** 8-12 hours

---

### Option B: Separate Application

**Pros:**
- Completely independent deployment
- Can use different tech stack
- Simpler form-only application
- Isolated scaling

**Cons:**
- Duplicate database or API integration complexity
- Multiple applications to maintain
- Harder to link to proposals/contracts
- More operational overhead
- Data synchronization issues

**Estimated Effort:** 20-30 hours (includes API integration)

---

## Recommendation: INTEGRATED APPROACH

We recommend implementing the lead capture forms **within Mizu Studio** because:

1. **Operational Simplicity** - One application to deploy, monitor, and maintain
2. **Data Integrity** - Single source of truth for all customer data
3. **Workflow Automation** - Inquiries automatically become potential clients
4. **Better CRM** - Complete customer journey from inquiry to contract/invoice
5. **Cost Efficiency** - Fewer resources needed
6. **Scalability** - Easily handle growth without architectural changes

---

## Implementation Architecture

### System Overview

```
Public Website
├── Lead Capture Form (public, no login required)
└── Portfolio/Gallery Showcase

                ↓ (form submission via API)

Mizu Studio Backend
├── Inquiry Endpoint (POST /inquiries)
├── Inquiry Service (validation, CRM creation)
└── Database (Inquiry model linked to Client)

                ↓ (internal workflow)

Admin Dashboard
├── Inquiry Management Page
├── Lead Scoring/Prioritization
└── Conversion to Client workflow
```

### Database Schema

```prisma
model Inquiry {
  id                String      @id @default(cuid())

  // Contact Information
  fullName          String
  email             String
  phone             String
  company           String?

  // Inquiry Details
  inquiryType       InquiryType  // "Wedding", "Portrait", "Commercial", "Event", "Other"
  shootDate         DateTime?
  shootType         String       // Description of what they want
  message           String
  budget            Decimal?

  // Media
  attachments       String[]?    // File paths of uploaded images

  // Tracking
  source            String?      // "Website", "Google", "Referral", etc.
  status            InquiryStatus // "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED", "ARCHIVED"

  // Links
  clientId          String?      // Link to Client if converted
  client            Client?      @relation(fields: [clientId], references: [id])

  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  contactedAt       DateTime?
  convertedAt       DateTime?

  // Notes
  internalNotes     String?     // Admin notes
  tags              String[]    // "Wedding", "High-Value", "Rush", etc.
}

enum InquiryType {
  WEDDING
  PORTRAIT
  COMMERCIAL
  EVENT
  FAMILY
  PRODUCT
  REAL_ESTATE
  OTHER
}

enum InquiryStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  REJECTED
  ARCHIVED
}
```

---

## Components to Build

### 1. Public Lead Capture Form (Frontend)

**Path:** `apps/web/src/routes/inquiry.tsx` (or `/contact`)

**Features:**
- Multi-step form wizard (Progressive disclosure)
  - Step 1: Contact Information (name, email, phone)
  - Step 2: Shoot Details (type, date, description)
  - Step 3: Budget & Attachments (optional)
  - Step 4: Confirmation

- Form Validation:
  - Email validation
  - Phone number formatting
  - Required field validation
  - File upload validation (for portfolio references)

- File Upload:
  - Image uploads for portfolio examples (optional)
  - Max file size: 10MB
  - Allowed types: .jpg, .png, .gif

- User Experience:
  - Progress indicator
  - Save draft capability (localStorage)
  - Success confirmation
  - Auto-reply email to user
  - Mobile responsive design

- Integration:
  - Captcha/bot prevention (hCaptcha)
  - Analytics tracking
  - Error handling and retry logic

**Estimated Time:** 4-5 hours

---

### 2. Inquiry Management Dashboard (Admin)

**Path:** `apps/web/src/routes/admin/inquiries/`

**Pages:**
- `/inquiries` - List with filters and search
- `/inquiries/[id]` - Detail view and conversion workflow

**Features:**

#### List View:
- Search by name, email, phone
- Filter by:
  - Status (NEW, CONTACTED, QUALIFIED, etc.)
  - Inquiry type (Wedding, Portrait, etc.)
  - Date range
  - Budget range
- Sort by date, status, or budget
- Bulk actions:
  - Change status
  - Add tags
  - Send email
  - Convert to client
- Stats cards:
  - Total inquiries (this month)
  - New inquiries (today)
  - Conversion rate
  - Average response time

#### Detail View:
- Full inquiry details
- Attachment viewer
- Internal notes
- Timeline of actions (contacted, qualified, converted)
- Quick actions:
  - Mark as contacted
  - Send template email
  - Convert to client
  - Archive
  - Delete
- Email history for this inquiry
- Linked client info (if converted)

**Estimated Time:** 5-6 hours

---

### 3. API Endpoints

**POST /inquiries/create**
- Creates new inquiry
- Validates input
- Sends confirmation email to customer
- Sends notification to admin

**GET /inquiries/list**
- List inquiries with filters
- Pagination support
- Admin only

**GET /inquiries/:id**
- Get inquiry details
- Admin only

**PUT /inquiries/:id/status**
- Update inquiry status
- Admin only

**PUT /inquiries/:id/convert**
- Convert inquiry to client
- Creates client record
- Links inquiry to client
- Admin only

**POST /inquiries/:id/email**
- Send template email to inquiry contact
- Admin only

**DELETE /inquiries/:id**
- Archive/delete inquiry
- Admin only

**Estimated Time:** 3-4 hours

---

### 4. Email Notifications

**Customer Emails:**
1. **Inquiry Confirmation** - Sent immediately after submission
   - Confirms receipt
   - Sets expectations ("We'll respond within 24 hours")
   - Links to portfolio/gallery

2. **Status Updates** - Optional, when status changes
   - Acknowledged: "We've received your inquiry"
   - Qualified: "We'd love to work with you"
   - Proposal Sent: "Check out our proposal"

**Admin Notifications:**
1. **New Inquiry Alert** - When inquiry submitted
   - Contact details
   - Quick link to dashboard
   - Call-to-action to review

---

## Implementation Steps

### Phase 1: Database & API (3-4 hours)
1. [ ] Create Inquiry model in Prisma schema
2. [ ] Create migration
3. [ ] Build inquiry service with validation
4. [ ] Build API endpoints
5. [ ] Add email templates
6. [ ] Test with Postman/curl

### Phase 2: Admin Dashboard (5-6 hours)
1. [ ] Create inquiry list page with filters
2. [ ] Create inquiry detail page
3. [ ] Build quick action buttons
4. [ ] Add status workflow
5. [ ] Implement conversion to client
6. [ ] Add email sending functionality
7. [ ] Style and polish UI

### Phase 3: Public Form (4-5 hours)
1. [ ] Create form component with step wizard
2. [ ] Build form validation
3. [ ] Implement file upload
4. [ ] Add progress indicator
5. [ ] Create success confirmation screen
6. [ ] Mobile responsiveness testing
7. [ ] Accessibility review

### Phase 4: Integration & Testing (2-3 hours)
1. [ ] End-to-end testing
2. [ ] Email delivery testing
3. [ ] Mobile testing
4. [ ] Performance optimization
5. [ ] Documentation

**Total Estimated Time: 14-18 hours (2-3 days of development)**

---

## User Flows

### Customer Journey

```
1. Customer visits website
2. Clicks "Request a Quote" or "Get in Touch"
3. Multi-step form opens:
   - Enter contact info
   - Describe shoot needs
   - Optional: upload portfolio examples
   - Optional: set budget
   - Review & submit
4. Confirmation screen shown
5. Confirmation email received with:
   - Expected response time
   - Link to portfolio
   - FAQ section
6. (Admin converts to client)
7. Customer receives follow-up proposal
8. Customer accepts/declines
9. If accepted → Invoice → Payment
```

### Admin Workflow

```
1. Notification of new inquiry
2. Admin reviews inquiry dashboard
3. Admin reads inquiry details
4. Admin sends template response email
5. Admin marks as "CONTACTED"
6. (If qualified) Admin creates proposal
7. Admin marks as "QUALIFIED"
8. Admin links proposal to inquiry
9. (If accepted) Admin marks as "CONVERTED"
10. Admin converts to official client
11. Workflow continues with proposal/contract
```

---

## Integration Points with Existing System

### 1. Link to Client System
- Convert inquiry to client automatically
- Copy contact info from inquiry
- Create relationship for history tracking

### 2. Link to Proposal System
- Quick action to create proposal from inquiry
- Pre-fill proposal with inquiry details
- Track proposal for this lead

### 3. Link to Email System
- Use existing email infrastructure (SES/Nodemailer)
- Reuse email templates
- Track email delivery

### 4. Link to Audit Trail
- Log all inquiry actions
- Track inquiry status changes
- Document admin responses

### 5. Dashboard Integration
- Show inquiry metrics on admin dashboard
- Recent inquiry activity
- Conversion funnel stats

---

## Technical Implementation Details

### Frontend (React)

```typescript
// Inquiry form component structure
components/inquiries/InquiryForm.tsx
components/inquiries/InquiryFormStep1.tsx (contact info)
components/inquiries/InquiryFormStep2.tsx (shoot details)
components/inquiries/InquiryFormStep3.tsx (budget/attachments)
components/inquiries/InquiryFormStep4.tsx (review/submit)
components/inquiries/FileUpload.tsx
routes/admin/inquiries/index.tsx (list)
routes/admin/inquiries/[id].tsx (detail)
```

### Backend (Fastify)

```typescript
// Service and route structure
services/inquiry.ts (business logic)
routes/inquiries.ts (API endpoints)
services/email-templates.ts (inquiry emails)
schemas/inquiry.ts (validation)
```

---

## Security Considerations

1. **Input Validation**
   - Server-side validation on all fields
   - File type and size validation
   - SQL injection prevention (Prisma handles this)

2. **Rate Limiting**
   - Prevent form spam
   - Limit submissions per IP/email
   - CAPTCHA verification

3. **File Upload Security**
   - Validate file types
   - Scan for malware
   - Store in secure location

4. **Email Validation**
   - Verify email format
   - Prevent email bombing
   - Track bounces

5. **Admin Access**
   - Require authentication
   - Log all admin actions
   - Prevent unauthorized data access

---

## Optional Enhancements (Future)

1. **Lead Scoring**
   - Automatic scoring based on budget/type
   - Priority queue for high-value leads
   - Lead qualification automation

2. **CRM Automation**
   - Automatic follow-up emails
   - Scheduled reminders for admin
   - Lead nurturing sequences

3. **Analytics**
   - Conversion funnel visualization
   - Response time tracking
   - Source attribution

4. **Integration**
   - Zapier/Make integration
   - Slack notifications
   - Google Forms import

5. **AI Features**
   - Auto-categorization of inquiries
   - Lead quality estimation
   - Chatbot for initial questions

---

## Comparison: Integrated vs. Separate

| Aspect | Integrated | Separate |
|--------|-----------|-----------|
| **Development Time** | 14-18 hours | 25-35 hours |
| **Deployment** | Single app | Two apps |
| **Database** | Shared | Multiple/API |
| **User Data** | Real-time sync | May lag |
| **Cost** | Lower | Higher |
| **Complexity** | Moderate | Higher |
| **Maintenance** | Single codebase | Multiple codebases |
| **Scalability** | Good | Better for separating concerns |

---

## Recommendation Summary

**Implement within Mizu Studio application** because:

✅ Faster development (14-18 hours vs. 25-35 hours)
✅ Simpler operations (one application)
✅ Better CRM integration
✅ Faster lead-to-client conversion
✅ Real-time data synchronization
✅ Lower operational cost
✅ Easier to maintain
✅ Better user experience

---

## Next Steps

1. **Confirm Approach** - Approve integrated architecture
2. **Design Forms** - Finalize form fields and workflow
3. **Estimate Timeline** - Schedule 2-3 days for full implementation
4. **Assign Tasks** - Break into smaller tasks for development
5. **Begin Implementation** - Start with database schema

---

## Questions to Address

Before implementation, clarify:

1. **Form Fields** - What specific fields beyond the schema above?
2. **File Uploads** - What files should customers be able to upload?
3. **Budget Ranges** - What budget categories/tiers?
4. **Inquiry Types** - Any additional types beyond those listed?
5. **Email Templates** - What should confirmation emails say?
6. **Admin Workflow** - How should admins prioritize leads?
7. **Public URL** - Where should the form be accessible from?
8. **Branding** - Any specific design/color requirements?

---

**Document Version:** 1.0
**Recommendation:** INTEGRATED APPROACH
**Estimated Effort:** 14-18 hours
**Timeline:** 2-3 days of development
**Priority:** After all other features (currently complete)

