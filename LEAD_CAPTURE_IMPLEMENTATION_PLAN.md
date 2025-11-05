# Lead Capture Form Builder - Implementation Plan & Decision

**Project:** Mizu Studio Lead Capture & Inquiry System
**Date:** November 5, 2025
**Status:** Planning Complete - Ready for Implementation
**Recommendation:** INTEGRATE INTO EXISTING APPLICATION

---

## Executive Decision

After comprehensive analysis, we recommend implementing the lead capture form builder **within the existing Mizu Studio application** rather than as a separate standalone application.

**Key Reasons:**
1. **Operational Simplicity** - One application to deploy and maintain
2. **Better CRM** - Inquiries automatically become clients
3. **Faster Development** - 14-18 hours vs. 25-35 hours
4. **Real-time Data** - No synchronization delays
5. **Lower Cost** - Fewer resources needed
6. **Better User Experience** - Seamless workflow from inquiry to proposal

---

## Implementation Overview

### What Will Be Built

A complete lead capture and inquiry management system that:

**For Customers:**
- Multi-step public inquiry form
- File upload for portfolio examples
- Confirmation email with next steps
- Optional: Client portal to track inquiry status

**For Admin:**
- Dashboard to manage inquiries
- Lead filtering and prioritization
- Email templates for responses
- One-click conversion to client
- Status workflow (NEW → CONTACTED → QUALIFIED → CONVERTED)
- Bulk actions on inquiries
- Analytics on conversion rate

### Components to Create

```
Database:
├── Inquiry model with full schema
├── Relationships to Client
└── Status tracking

Backend APIs:
├── POST /inquiries/create
├── GET /inquiries/list
├── GET /inquiries/:id
├── PUT /inquiries/:id/status
├── PUT /inquiries/:id/convert
├── POST /inquiries/:id/email
└── DELETE /inquiries/:id

Frontend:
├── Public Form (multi-step wizard)
│   ├── Step 1: Contact Info
│   ├── Step 2: Shoot Details
│   ├── Step 3: Budget & Files
│   └── Step 4: Review & Confirm
│
├── Admin Dashboard
│   ├── Inquiry List (searchable, filterable)
│   ├── Stats Cards
│   └── Quick Actions
│
└── Inquiry Detail Page
    ├── Full inquiry details
    ├── Attachments viewer
    ├── Email history
    └── Conversion workflow
```

---

## Timeline & Effort

| Phase | Task | Duration | Effort |
|-------|------|----------|--------|
| 1 | Database Schema & API | 3-4 hrs | Backend |
| 2 | Admin Dashboard | 5-6 hrs | Frontend |
| 3 | Public Form | 4-5 hrs | Frontend |
| 4 | Integration & Testing | 2-3 hrs | Full Stack |
| **Total** | **Complete System** | **14-18 hrs** | **2-3 days** |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC WEBSITE                           │
│  (Contact Form, Portfolio, Gallery)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Multi-Step Inquiry Form                              │  │
│  │  - Contact Information                                │  │
│  │  - Shoot Details                                      │  │
│  │  - Budget & Attachments                               │  │
│  │  - Review & Submit                                    │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ POST /inquiries/create
                      ▼
        ┌─────────────────────────────────────┐
        │     MIZU STUDIO BACKEND API         │
        │  (Fastify + Prisma + PostgreSQL)    │
        │                                     │
        │  • Inquiry Service (validation)     │
        │  • Email Service (confirmations)    │
        │  • Client Conversion Logic          │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │      DATABASE                       │
        │  Inquiry Table                      │
        │  ├─ Contact Info                    │
        │  ├─ Shoot Details                   │
        │  ├─ Status & Tracking               │
        │  └─ Links to Client                 │
        └─────────────────────────────────────┘
                      │
                      │ (internal APIs)
                      ▼
        ┌─────────────────────────────────────┐
        │     ADMIN DASHBOARD                 │
        │  (React + React Router)              │
        │                                     │
        │  Inquiry Management:                │
        │  • List view (searchable)           │
        │  • Detail view                      │
        │  • Status workflow                  │
        │  • Email templates                  │
        │  • Convert to client                │
        │  • Analytics                        │
        └─────────────────────────────────────┘
```

---

## Database Schema

```prisma
model Inquiry {
  // Unique identifier
  id                String      @id @default(cuid())

  // Contact Information
  fullName          String      @db.VarChar(255)
  email             String
  phone             String
  company           String?     @db.VarChar(255)

  // Inquiry Details
  inquiryType       InquiryType // WEDDING, PORTRAIT, COMMERCIAL, EVENT, etc.
  shootDate         DateTime?   // Desired shoot date
  shootDescription  String      @db.Text

  // Budget Information
  budgetMin         Decimal?    @db.Decimal(10, 2)
  budgetMax         Decimal?    @db.Decimal(10, 2)

  // Files & Attachments
  attachmentUrls    String[]    @default([]) // URLs to uploaded images
  attachmentCount   Int         @default(0)

  // Inquiry Source & Tags
  source            String?     // "website", "google", "referral", etc.
  tags              String[]    @default([]) // "urgent", "high-value", etc.

  // Status & Workflow
  status            InquiryStatus  @default(NEW)
  internalNotes     String?     @db.Text

  // Relationships
  clientId          String?     // Links to existing/converted client
  client            Client?     @relation(fields: [clientId], references: [id], onDelete: SetNull)

  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  contactedAt       DateTime?
  qualifiedAt       DateTime?
  convertedAt       DateTime?

  // Metadata
  ipAddress         String?     // For spam detection
  userAgent         String?     // Browser info

  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@index([clientId])
}

enum InquiryType {
  WEDDING
  PORTRAIT
  COMMERCIAL
  EVENT
  FAMILY
  PRODUCT
  REAL_ESTATE
  HEADSHOT
  OTHER
}

enum InquiryStatus {
  NEW              // Just received
  CONTACTED        // Admin has reached out
  QUALIFIED        // Meets criteria
  PROPOSAL_SENT    // Proposal created
  NEGOTIATING      // In discussion
  CONVERTED        // Became a client
  REJECTED         // Not a good fit
  ARCHIVED         // No longer active
}
```

---

## Database Migration

```sql
-- Create inquiry table
CREATE TABLE "Inquiry" (
  id TEXT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company VARCHAR(255),
  inquiryType TEXT NOT NULL,
  shootDate TIMESTAMP,
  shootDescription TEXT NOT NULL,
  budgetMin DECIMAL(10,2),
  budgetMax DECIMAL(10,2),
  attachmentUrls TEXT[] DEFAULT '{}',
  attachmentCount INT DEFAULT 0,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'NEW',
  internalNotes TEXT,
  clientId TEXT REFERENCES "Client"(id) ON DELETE SET NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  contactedAt TIMESTAMP,
  qualifiedAt TIMESTAMP,
  convertedAt TIMESTAMP,
  ipAddress TEXT,
  userAgent TEXT
);

-- Create indexes for performance
CREATE INDEX idx_inquiry_email ON "Inquiry"(email);
CREATE INDEX idx_inquiry_status ON "Inquiry"(status);
CREATE INDEX idx_inquiry_createdAt ON "Inquiry"(createdAt);
CREATE INDEX idx_inquiry_clientId ON "Inquiry"(clientId);
```

---

## Form Structure (Public)

### Step 1: Contact Information
- Full Name (required)
- Email Address (required)
- Phone Number (required)
- Company Name (optional)

### Step 2: Shoot Details
- What type of shoot? (dropdown - Wedding, Portrait, etc.)
- When are you planning to shoot? (date picker)
- Tell us about your shoot needs (textarea)
- Location (optional)
- Any special requirements? (textarea)

### Step 3: Budget & Attachments
- Budget Range (slider or select)
- Upload portfolio examples or inspiration images (optional)
  - Max 5 files
  - Max 10MB each
  - Only .jpg, .png, .gif

### Step 4: Review & Confirmation
- Summary of all entered information
- Confirmation checkbox ("I want to receive a quote")
- Submit button

---

## Admin Dashboard Features

### List View
**Columns:**
- Date (when inquiry submitted)
- Name (customer name)
- Inquiry Type (Wedding, Portrait, etc.)
- Status (badge with color)
- Budget Range
- Action buttons (view, email, convert, delete)

**Filters:**
- By Status
- By Inquiry Type
- By Date Range
- By Budget Range
- Search by name/email

**Bulk Actions:**
- Change status for multiple
- Add tags
- Delete multiple

**Stats Cards:**
- Total This Month
- New Today
- Conversion Rate
- Avg Response Time

### Detail View
**Sections:**
1. **Inquiry Summary**
   - All contact and shoot details
   - Status and timeline

2. **Attachments**
   - Image gallery of uploaded files
   - Option to download

3. **Internal Notes**
   - Admin notes field
   - Edit and save

4. **Email History**
   - All emails sent to this contact
   - Templates used
   - Read receipts (if available)

5. **Timeline**
   - Created date
   - First contacted date
   - Status changes
   - Conversion date

6. **Quick Actions**
   - Send Email (with templates)
   - Change Status
   - Add Tags
   - Convert to Client
   - Delete/Archive

---

## Email Templates

### 1. Inquiry Confirmation (To Customer)
```
Subject: We Received Your Photography Inquiry - Mizu Studio

Hi [Name],

Thank you for reaching out to Mizu Studio! We've received your inquiry
and are excited to learn more about your photography needs.

Our team will review your request and get back to you within 24 hours
with next steps and a customized quote.

In the meantime, feel free to:
- Browse our portfolio: [link]
- Check our frequently asked questions: [link]
- See our client reviews: [link]

Best regards,
The Mizu Studio Team

---
Inquiry Details:
Type: [inquiryType]
Date: [shootDate]
Budget: [budgetRange]
```

### 2. New Inquiry Notification (To Admin)
```
Subject: New Inquiry from [Name] - Mizu Studio

A new inquiry has been submitted:

Name: [Name]
Email: [Email]
Phone: [Phone]
Type: [inquiryType]
Date: [shootDate]
Budget: [budgetRange]

Message:
[shootDescription]

Files: [attachmentCount] images uploaded

ACTION: Review this inquiry
[Link to dashboard]
```

### 3. Status Update Email (To Customer)
```
Subject: We're Qualified to Work with You - Mizu Studio

Hi [Name],

Great news! We've reviewed your inquiry and we're excited about the
possibility of working with you on your [inquiryType] project.

Our photographer and I would love to discuss your vision and create
a customized proposal for your shoot on [shootDate].

Next Steps:
1. I'll be reaching out via phone/email this week
2. We'll discuss your needs in detail
3. You'll receive a formal proposal within 48 hours

Looking forward to partnering with you!

Best regards,
[Admin Name]
Mizu Studio
```

---

## API Endpoint Specifications

### POST /inquiries/create
Creates a new inquiry from the public form.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+44 123 456 7890",
  "company": "ABC Events",
  "inquiryType": "WEDDING",
  "shootDate": "2025-06-15",
  "shootDescription": "Wedding photography for 200 guests",
  "budgetMin": 2000,
  "budgetMax": 5000,
  "attachmentUrls": ["file1.jpg", "file2.jpg"],
  "source": "website"
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "cxyz123",
  "message": "Inquiry received. Check your email for confirmation."
}
```

### GET /inquiries/list (Admin)
Lists all inquiries with filtering.

**Query Parameters:**
- `status` - Filter by status
- `type` - Filter by inquiry type
- `search` - Search by name/email
- `dateFrom` - Filter by date
- `dateTo` - Filter by date
- `page` - Pagination
- `limit` - Items per page

**Response:**
```json
{
  "inquiries": [
    {
      "id": "cxyz123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "inquiryType": "WEDDING",
      "shootDate": "2025-06-15",
      "status": "NEW",
      "budgetMin": 2000,
      "budgetMax": 5000,
      "createdAt": "2025-11-05T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

### GET /inquiries/:id (Admin)
Get full inquiry details.

### PUT /inquiries/:id/status (Admin)
Update inquiry status.

### PUT /inquiries/:id/convert (Admin)
Convert inquiry to client.

### POST /inquiries/:id/email (Admin)
Send email to inquiry contact.

---

## Security & Validation

### Input Validation
- ✅ Email format validation
- ✅ Phone number validation
- ✅ File type validation
- ✅ File size limits
- ✅ Required field validation
- ✅ XSS prevention
- ✅ SQL injection prevention (Prisma)

### Rate Limiting
- ✅ Max 5 submissions per email per day
- ✅ Max 10 submissions per IP per day
- ✅ CAPTCHA verification on form

### File Upload Security
- ✅ File type whitelist (.jpg, .png, .gif only)
- ✅ File size limit (10MB max)
- ✅ Virus scanning (optional)
- ✅ Secure file storage path

---

## Implementation Checklist

### Phase 1: Database & API
- [ ] Create Inquiry model in Prisma schema
- [ ] Run database migration
- [ ] Create inquiry service file
- [ ] Implement validation logic
- [ ] Create API route file
- [ ] Implement POST /inquiries/create endpoint
- [ ] Implement GET /inquiries/list endpoint
- [ ] Implement GET /inquiries/:id endpoint
- [ ] Implement PUT /inquiries/:id/status endpoint
- [ ] Implement PUT /inquiries/:id/convert endpoint
- [ ] Implement POST /inquiries/:id/email endpoint
- [ ] Add email templates
- [ ] Test all endpoints with Postman/curl

### Phase 2: Admin Dashboard
- [ ] Create inquiry list page component
- [ ] Implement search and filtering
- [ ] Create stats cards component
- [ ] Create inquiry detail page component
- [ ] Implement status workflow buttons
- [ ] Create email sending modal
- [ ] Implement convert to client workflow
- [ ] Add delete/archive functionality
- [ ] Create timeline component
- [ ] Style and responsive design
- [ ] Mobile testing

### Phase 3: Public Form
- [ ] Create inquiry form component
- [ ] Implement step wizard navigation
- [ ] Create step 1 (contact info) component
- [ ] Create step 2 (shoot details) component
- [ ] Create step 3 (budget/files) component
- [ ] Create step 4 (review) component
- [ ] Implement file upload functionality
- [ ] Add form validation
- [ ] Create success confirmation page
- [ ] Implement save draft (localStorage)
- [ ] Mobile responsiveness testing
- [ ] Accessibility review (WCAG)

### Phase 4: Integration & Testing
- [ ] End-to-end form submission test
- [ ] Email delivery test
- [ ] Admin dashboard test
- [ ] Conversion to client test
- [ ] Performance optimization
- [ ] Mobile cross-browser testing
- [ ] Load testing (simulate traffic)
- [ ] Security audit
- [ ] Documentation

---

## Success Metrics

After implementation, measure:

1. **Form Submission Rate**
   - Total submissions per month
   - Submission completion rate

2. **Lead Conversion Rate**
   - % of inquiries converted to clients
   - Average time from inquiry to conversion

3. **Response Time**
   - Average admin response time
   - Time to first email sent

4. **Quality Score**
   - % of qualified inquiries
   - Average budget per inquiry

5. **User Experience**
   - Form abandonment rate
   - Mobile vs. desktop completion
   - Form field error rates

---

## Conclusion

The lead capture form builder will integrate seamlessly into Mizu Studio, providing:

✅ **For Customers:** Easy way to inquire about shoots with professional confirmation
✅ **For Admin:** Complete CRM system for managing leads from inquiry to client
✅ **For Business:** Increased lead capture and conversion tracking
✅ **For Operations:** Streamlined workflow from inquiry to proposal to contract

**Status:** Ready to begin implementation
**Effort:** 14-18 hours (2-3 days)
**Priority:** Can be started immediately after current work

---

**Document Version:** 1.0
**Date Created:** November 5, 2025
**Recommendation:** PROCEED WITH INTEGRATED IMPLEMENTATION
**Next Step:** Confirm requirements and begin Phase 1 (Database & API)

