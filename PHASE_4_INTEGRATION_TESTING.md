# Phase 4: Integration & Testing Guide
## Lead Capture Form Builder - Complete Testing Plan

**Status:** In Progress
**Date:** November 5, 2025
**Purpose:** Comprehensive testing and validation of the lead capture form system

---

## Test Environment Setup

### Prerequisites
- ✅ API Server running on http://localhost:3001
- ✅ Web Server running on http://localhost:3000
- ✅ Database connection established
- ✅ Email service configured (STUB provider in development)

### Current Status
- API: Running
- Web: Running
- Database: Connected
- All prior phases completed

---

## 1. End-to-End Form Submission Tests

### Test 1.1: Complete Public Form Submission
**Objective:** Verify a customer can submit a complete inquiry form

**Steps:**
1. Navigate to http://localhost:3000/inquiry
2. Fill all form fields across all 4 steps:
   - Step 1: Contact info (name, email, phone, company)
   - Step 2: Shoot details (type, date, description, location, requirements)
   - Step 3: Budget and attachments (budget range, file uploads)
   - Step 4: Review all data and confirm submission
3. Submit form

**Expected Results:**
- ✅ Form accepts all valid input
- ✅ Validation prevents incomplete submissions
- ✅ Success page displays with confirmation message
- ✅ Inquiry created in database with correct status (NEW)
- ✅ InquiryId returned and displayed

**Test Result:** [PENDING]

---

### Test 1.2: Form Validation - Required Fields
**Objective:** Verify form validation prevents submission with missing required fields

**Steps:**
1. Navigate to http://localhost:3000/inquiry
2. Attempt to submit with missing required fields:
   - Submit Step 1 with empty fullName
   - Submit Step 1 with invalid email format
   - Submit Step 1 with missing phone
   - Submit Step 2 with empty description
   - Submit Step 2 with description < 10 characters

**Expected Results:**
- ✅ Form shows error messages for each invalid field
- ✅ Submit button disabled until all required fields valid
- ✅ User cannot proceed to next step with invalid data

**Test Result:** [PENDING]

---

### Test 1.3: File Upload Validation
**Objective:** Verify file upload constraints are enforced

**Steps:**
1. Navigate to Step 3 (Budget & Attachments)
2. Test file upload constraints:
   - Upload JPG file (should succeed)
   - Upload PNG file (should succeed)
   - Upload PDF file (should fail)
   - Upload >10MB file (should fail)
   - Upload 6 files (should allow only 5, reject 6th)

**Expected Results:**
- ✅ Only JPG/PNG/GIF files accepted
- ✅ Files >10MB rejected with error message
- ✅ Maximum 5 files enforced
- ✅ File preview shown for accepted files
- ✅ Remove button works for each file

**Test Result:** [PENDING]

---

### Test 1.4: Draft Saving Functionality
**Objective:** Verify form data persists via localStorage

**Steps:**
1. Navigate to http://localhost:3000/inquiry
2. Fill Step 1 completely
3. Proceed to Step 2, fill partially
4. Close browser/reload page
5. Navigate back to http://localhost:3000/inquiry

**Expected Results:**
- ✅ Form restores previous data from localStorage
- ✅ Current step position restored
- ✅ All filled fields populated
- ✅ File previews remain if applicable
- ✅ localStorage cleared after successful submission

**Test Result:** [PENDING]

---

### Test 1.5: Budget Range Selection
**Objective:** Verify budget range selector works correctly

**Steps:**
1. Navigate to Step 3 (Budget & Attachments)
2. Test each budget preset:
   - "Under £500"
   - "£500 - £1,000"
   - "£1,000 - £2,000"
   - "£2,000 - £5,000"
   - "£5,000+"

**Expected Results:**
- ✅ Each preset selects correctly
- ✅ Selected state visually indicated
- ✅ Budget values sent correctly to API
- ✅ Admin can see budget range in inquiry

**Test Result:** [PENDING]

---

### Test 1.6: Inquiry Type Selection
**Objective:** Verify all inquiry type options work correctly

**Steps:**
1. Navigate to Step 2 (Shoot Details)
2. Test each inquiry type:
   - Wedding
   - Portrait
   - Commercial
   - Event
   - Family
   - Product
   - Real Estate
   - Headshot
   - Other

**Expected Results:**
- ✅ All 9 types selectable
- ✅ Selected type shows visually
- ✅ Correct type sent to API
- ✅ Admin can filter by type

**Test Result:** [PENDING]

---

## 2. Email Delivery Tests

### Test 2.1: Inquiry Confirmation Email
**Objective:** Verify confirmation email sent to customer

**Steps:**
1. Submit complete inquiry form
2. Check email service logs
3. Verify email content and formatting

**Expected Results:**
- ✅ Email sent immediately after submission
- ✅ Email to: customer email from form
- ✅ Subject includes inquiry type and studio name
- ✅ Email body contains:
  - Customer name
  - Inquiry type
  - Shoot date (if provided)
  - Budget range
  - Next steps
  - Studio contact info

**Test Result:** [PENDING]

**Email Service Status:** STUB provider (dev only - no actual email sent)

---

### Test 2.2: Admin Notification Email
**Objective:** Verify admin notification sent when new inquiry received

**Steps:**
1. Submit complete inquiry form
2. Check API logs for email notification
3. Verify notification content

**Expected Results:**
- ✅ Notification email logged (STUB provider)
- ✅ Would include:
  - Customer name, email, phone
  - Inquiry type and date
  - Budget information
  - Description
  - File count
  - Link to admin dashboard

**Test Result:** [PENDING]

---

## 3. Admin Dashboard Tests

### Test 3.1: Inquiry List Page Display
**Objective:** Verify admin can view all inquiries

**Steps:**
1. Submit 3-5 test inquiries
2. Navigate to http://localhost:3000/admin/inquiries
3. Verify list displays correctly

**Expected Results:**
- ✅ Page loads without errors
- ✅ All submitted inquiries displayed in table
- ✅ Columns visible: Date, Name, Email, Type, Status, Budget, Actions
- ✅ Pagination works (if >20 items)
- ✅ Status badges show correct colors

**Test Result:** [PENDING]

---

### Test 3.2: Search and Filter Functionality
**Objective:** Verify search and filtering work correctly

**Steps:**
1. Submit test inquiries with different types and statuses
2. Test search by name
3. Test search by email
4. Test filter by status
5. Test filter by type
6. Test sort options

**Expected Results:**
- ✅ Search returns matching inquiries
- ✅ Status filter limits results correctly
- ✅ Type filter limits results correctly
- ✅ Multiple filters can be combined
- ✅ Results update in real-time
- ✅ Pagination works with filters

**Test Result:** [PENDING]

---

### Test 3.3: Inquiry Detail Page
**Objective:** Verify detail page shows all inquiry information

**Steps:**
1. Click on inquiry in list
2. Verify detail page loads
3. Review all sections

**Expected Results:**
- ✅ Page loads successfully
- ✅ Contact information displayed
- ✅ Shoot details visible
- ✅ Budget range shown
- ✅ Timeline shows status changes
- ✅ Internal notes section accessible
- ✅ All action buttons present

**Test Result:** [PENDING]

---

### Test 3.4: Status Change Workflow
**Objective:** Verify admin can change inquiry status

**Steps:**
1. Open inquiry detail page
2. Click status change button
3. Change status from NEW → CONTACTED
4. Verify status updates in list

**Expected Results:**
- ✅ Status change modal appears
- ✅ Dropdown shows available status options
- ✅ Status updates in database
- ✅ Timestamp recorded (contactedAt for CONTACTED)
- ✅ List view reflects status change
- ✅ Timeline shows status change event

**Test Result:** [PENDING]

---

### Test 3.5: Internal Notes Management
**Objective:** Verify admin can add/edit notes

**Steps:**
1. Open inquiry detail page
2. Click edit notes button
3. Add notes and save
4. Reload page
5. Verify notes persist

**Expected Results:**
- ✅ Notes field editable
- ✅ Changes saved to database
- ✅ Notes persist after reload
- ✅ Admin name/timestamp recorded

**Test Result:** [PENDING]

---

### Test 3.6: Statistics Cards
**Objective:** Verify dashboard metrics display correctly

**Steps:**
1. Navigate to inquiry list page
2. Review stats cards at top

**Expected Results:**
- ✅ "This Month" card shows count
- ✅ "Today" card shows new inquiries
- ✅ "Conversion Rate" shows percentage
- ✅ "Response Time" shows average hours
- ✅ Numbers update after new submissions

**Test Result:** [PENDING]

---

## 4. Conversion to Client Tests

### Test 4.1: Convert Inquiry to New Client
**Objective:** Verify inquiry can be converted to new client

**Steps:**
1. Open inquiry with no linked client
2. Click "Convert to Client" button
3. Confirm conversion
4. Verify client created

**Expected Results:**
- ✅ Conversion modal appears
- ✅ Confirmation required
- ✅ New Client record created with:
  - Name from inquiry
  - Email from inquiry
  - Phone from inquiry
  - Company from inquiry
  - Status: ACTIVE (or as selected)
- ✅ Inquiry.clientId linked to new Client
- ✅ Status changed to CONVERTED
- ✅ convertedAt timestamp recorded

**Test Result:** [PENDING]

---

### Test 4.2: Link Inquiry to Existing Client
**Objective:** Verify inquiry can be linked to existing client

**Setup:**
- Create client first via admin

**Steps:**
1. Open inquiry
2. Click "Convert to Client"
3. Search for existing client by email
4. Select and confirm

**Expected Results:**
- ✅ Can search existing clients
- ✅ Inquiry linked to selected client
- ✅ No duplicate client created
- ✅ Status changed to CONVERTED

**Test Result:** [PENDING]

---

## 5. API Endpoint Tests

### Test 5.1: POST /inquiries/create
**Test:** Public inquiry creation endpoint

```bash
curl -X POST http://localhost:3001/inquiries/create \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "shootDescription": "Test shoot description here",
    "inquiryType": "WEDDING",
    "attachmentUrls": [],
    "attachmentCount": 0,
    "tags": []
  }'
```

**Expected:** 201 Created, inquiry stored

**Test Result:** ✅ PASS (tested in phase 3)

---

### Test 5.2: GET /admin/inquiries/stats
**Test:** Admin statistics endpoint

```bash
curl -H "Cookie: session=<valid_session>" \
  http://localhost:3001/admin/inquiries/stats
```

**Expected:** 200 OK, stats object with:
- totalThisPeriod
- newToday
- conversionRate
- avgResponseTimeHours

**Test Result:** [PENDING - requires auth]

---

### Test 5.3: GET /admin/inquiries
**Test:** Admin list inquiries endpoint

**Expected:** 200 OK, array of inquiries with pagination

**Test Result:** [PENDING - requires auth]

---

### Test 5.4: PUT /admin/inquiries/:id/status
**Test:** Update inquiry status endpoint

**Expected:** 200 OK, updated inquiry with new status

**Test Result:** [PENDING - requires auth]

---

### Test 5.5: PUT /admin/inquiries/:id/convert
**Test:** Convert inquiry to client endpoint

**Expected:** 200 OK, updated inquiry and new/linked client

**Test Result:** [PENDING - requires auth]

---

## 6. Performance Tests

### Test 6.1: Form Load Time
**Objective:** Verify form loads quickly

**Steps:**
1. Open DevTools Network tab
2. Navigate to http://localhost:3000/inquiry
3. Measure time to interactive

**Success Criteria:**
- ✅ Page load < 2 seconds
- ✅ Form interactive < 3 seconds
- ✅ No console errors

**Test Result:** [PENDING]

---

### Test 6.2: Form Submission Response Time
**Objective:** Verify submission responds quickly

**Steps:**
1. Submit complete inquiry
2. Measure response time from click to success page

**Success Criteria:**
- ✅ Response < 2 seconds
- ✅ No UI blocking
- ✅ Loading indicator shows

**Test Result:** [PENDING]

---

### Test 6.3: List Page Load Time
**Objective:** Verify admin list loads efficiently

**Steps:**
1. Open admin inquiries list with 100+ inquiries
2. Measure load time
3. Test pagination

**Success Criteria:**
- ✅ Page load < 1 second
- ✅ Pagination switches < 500ms
- ✅ Search < 1 second

**Test Result:** [PENDING]

---

### Test 6.4: Bundle Size
**Objective:** Verify bundle sizes are reasonable

**Steps:**
1. Build for production: `pnpm build:web`
2. Check bundle size in dist folder

**Success Criteria:**
- ✅ Main bundle < 300KB gzipped
- ✅ No unused dependencies
- ✅ Code splitting working

**Test Result:** [PENDING]

---

## 7. Mobile Testing

### Test 7.1: Form Responsiveness
**Objective:** Verify form works on mobile

**Test on:**
- iPhone 12/13/14
- Android (Samsung Galaxy S21/22)
- iPad

**Checklist:**
- ✅ Form fields readable on small screen
- ✅ Buttons easily tappable (44px minimum)
- ✅ File upload works on mobile
- ✅ Date picker mobile-friendly
- ✅ No horizontal scroll needed
- ✅ Keyboard doesn't hide form

**Test Result:** [PENDING]

---

### Test 7.2: Admin Dashboard Mobile
**Objective:** Verify admin dashboard works on tablet

**Checklist:**
- ✅ List table scrollable horizontally if needed
- ✅ Action buttons accessible
- ✅ Filters usable
- ✅ Detail page readable
- ✅ Edit modals display correctly

**Test Result:** [PENDING]

---

## 8. Security Tests

### Test 8.1: XSS Prevention
**Objective:** Verify form sanitizes input

**Steps:**
1. Submit form with XSS payload: `<script>alert('xss')</script>`
2. Verify payload doesn't execute in admin view
3. Check database stores escaped content

**Expected Results:**
- ✅ Script tags escaped or removed
- ✅ No alert appears
- ✅ Content displayed as text, not executed

**Test Result:** [PENDING]

---

### Test 8.2: SQL Injection Prevention
**Objective:** Verify SQL injection prevented

**Steps:**
1. Submit form with SQL payload: `'; DROP TABLE "Inquiry"; --`
2. Verify data stored correctly
3. Verify table still exists

**Expected Results:**
- ✅ Prisma parameterizes query
- ✅ Payload stored as literal text
- ✅ Database unaffected
- ✅ No errors thrown

**Test Result:** [PENDING]

---

### Test 8.3: Rate Limiting
**Objective:** Verify rate limiting on public endpoint

**Note:** Currently not implemented - document as needed

---

### Test 8.4: CORS Configuration
**Objective:** Verify CORS headers correct

**Steps:**
1. Submit form from http://localhost:3000
2. Check response headers
3. Verify credentials included

**Expected Results:**
- ✅ Access-Control-Allow-Origin: http://localhost:3000
- ✅ Access-Control-Allow-Credentials: true
- ✅ No CORS errors in console

**Test Result:** [PENDING]

---

### Test 8.5: Authentication Enforcement
**Objective:** Verify admin endpoints require authentication

**Steps:**
1. Try to access /admin/inquiries without auth
2. Try to access /admin/inquiries/stats without auth
3. Try to submit status change without auth

**Expected Results:**
- ✅ 401 Unauthorized response
- ✅ Error message shown
- ✅ Redirect to login (frontend)

**Test Result:** [PENDING]

---

## 9. Accessibility Tests

### Test 9.1: Keyboard Navigation
**Objective:** Verify form usable with keyboard only

**Steps:**
1. Use Tab key to navigate form
2. Use Enter/Space to submit steps
3. Use Tab through admin table

**Expected Results:**
- ✅ Logical tab order
- ✅ Focus indicator visible
- ✅ All actions keyboard accessible
- ✅ No keyboard traps

**Test Result:** [PENDING]

---

### Test 9.2: Screen Reader Testing
**Objective:** Verify form accessible to screen readers

**Tools:** NVDA (Windows) or JAWS

**Checklist:**
- ✅ Form labels associated with inputs
- ✅ Error messages announced
- ✅ Step indicators announced
- ✅ Buttons labeled correctly

**Test Result:** [PENDING]

---

## 10. Load Testing

### Test 10.1: Concurrent Submissions
**Objective:** Test system under load

**Steps:**
1. Use Apache Bench to send 100 concurrent requests
2. Monitor API response times
3. Check database write success

**Tools:**
```bash
ab -n 100 -c 10 -p data.json -T application/json http://localhost:3001/inquiries/create
```

**Success Criteria:**
- ✅ All requests succeed
- ✅ Response time < 500ms
- ✅ No database errors
- ✅ No memory leaks

**Test Result:** [PENDING]

---

## 11. Documentation

### 11.1: API Documentation
Create comprehensive API docs including:
- Endpoint descriptions
- Request/response formats
- Error codes
- Example cURL requests
- Rate limiting info

**Status:** [PENDING]

---

### 11.2: User Guide
Create documentation for:
- How customers submit inquiries
- How admins manage inquiries
- Conversion workflow
- Email templates
- Status definitions

**Status:** [PENDING]

---

### 11.3: Developer Guide
Create guide for developers:
- Architecture overview
- How to modify form fields
- How to add new inquiry types
- How to customize email templates
- Database schema reference

**Status:** [PENDING]

---

## Summary Checklist

### Must Pass (Critical)
- [ ] End-to-end form submission works
- [ ] Form validation prevents invalid data
- [ ] Admin can view inquiries
- [ ] Inquiry can be converted to client
- [ ] No XSS/SQL injection vulnerabilities
- [ ] Authentication enforced on admin endpoints

### Should Pass (Important)
- [ ] File upload validation works
- [ ] Draft saving works
- [ ] Search/filter functionality works
- [ ] Mobile form responsive
- [ ] Performance acceptable
- [ ] CORS configured correctly

### Nice to Have (Enhancement)
- [ ] Rate limiting implemented
- [ ] Load testing passes
- [ ] Accessibility tests pass
- [ ] Screen reader compatible
- [ ] Comprehensive documentation

---

## Testing Sign-Off

| Test Category | Status | Notes |
|---|---|---|
| End-to-End Submissions | [PENDING] | |
| Email Delivery | [PENDING] | Stub provider |
| Admin Dashboard | [PENDING] | |
| Conversion Workflow | [PENDING] | |
| API Endpoints | [PENDING] | |
| Performance | [PENDING] | |
| Mobile | [PENDING] | |
| Security | [PENDING] | |
| Accessibility | [PENDING] | |
| Load Testing | [PENDING] | |
| Documentation | [PENDING] | |

---

**Phase 4 Status:** In Progress
**Last Updated:** November 5, 2025
**Next Steps:** Execute all tests and document results
