# Amazon SES Setup Checklist - Domain Verification Approach

**Project:** Mizu Studio Photography Platform
**Date:** November 4, 2025
**Setup Type:** Domain Verification (shotbymizu.co.uk)
**AWS Region:** eu-west-2 (CRITICAL - NOT eu-north-1)
**Email Address:** michael@shotbymizu.co.uk (Microsoft 365)
**DNS Manager:** Cloudflare

---

## Quick Start (1-Page Summary)

### Phase 1: AWS Setup (15 minutes)
- [ ] Create AWS account at https://aws.amazon.com
- [ ] Create IAM user (`mizu-ses-user`)
- [ ] Attach `AmazonSESFullAccess` policy
- [ ] Generate access keys
  - [ ] Copy **Access Key ID**
  - [ ] Copy **Secret Access Key**
  - [ ] Save to password manager

### Phase 2: Domain Verification in SES (10 minutes)
- [ ] **VERIFY YOU'RE IN eu-west-2 REGION** (top right dropdown)
- [ ] Go to SES Console → Verified Identities → Create Identity
- [ ] Select **Domain** (NOT Email Address)
- [ ] Enter: `shotbymizu.co.uk`
- [ ] Check **Generate DKIM tokens**
- [ ] Click **Create Identity**
- [ ] Copy the 3 DKIM tokens and CNAME values
- [ ] Status will show "Verification in progress"

### Phase 3: Cloudflare DNS Configuration (20 minutes)
- [ ] Log into Cloudflare: https://dash.cloudflare.com
- [ ] Select domain: `shotbymizu.co.uk`
- [ ] Go to **DNS** section
- [ ] **Add 3 DKIM CNAME Records:**
  - [ ] Add Record 1: `token1._domainkey` → `token1.dkim.amazonses.com` (DNS only)
  - [ ] Add Record 2: `token2._domainkey` → `token2.dkim.amazonses.com` (DNS only)
  - [ ] Add Record 3: `token3._domainkey` → `token3.dkim.amazonses.com` (DNS only)
- [ ] **Modify SPF Record:**
  - [ ] Find TXT record: `v=spf1 include:outlook.com ~all`
  - [ ] Click Edit
  - [ ] Change to: `v=spf1 include:outlook.com include:amazonses.com ~all`
  - [ ] Click Save
- [ ] **Add DMARC Record:**
  - [ ] Click **Add Record**
  - [ ] Type: **TXT**
  - [ ] Name: **_dmarc**
  - [ ] Content: `v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100`
  - [ ] Proxy: **DNS only** (gray cloud)
  - [ ] Click Save

### Phase 4: DNS Verification (10 minutes)
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Open PowerShell/Terminal
- [ ] Run: `nslookup -type=txt shotbymizu.co.uk`
  - [ ] Should show: `v=spf1 include:outlook.com include:amazonses.com ~all`
- [ ] Run: `nslookup -type=cname token1._domainkey.shotbymizu.co.uk`
  - [ ] Should show CNAME record (repeat for token2 and token3)
- [ ] Go to AWS SES console
  - [ ] Domain should show **Verified** ✓
  - [ ] DKIM should show **Verified** ✓ for all 3 tokens

### Phase 5: Request Production Access (5 minutes + 24 hour wait)
- [ ] Go to SES Dashboard → Account dashboard
- [ ] Click "Request sending limit increase"
- [ ] Fill details:
  - [ ] Use case: Transactional
  - [ ] Website: shotbymizu.co.uk
  - [ ] Description: "Transactional emails for photography studio (contracts, proposals, invoices)"
- [ ] Click Submit
- [ ] Wait for approval email (usually 24 hours)
- [ ] Status changes to **Production** ✓

### Phase 6: Code Implementation (1-2 hours)
- [ ] Install SDK: `pnpm add @aws-sdk/client-ses`
- [ ] Create: `apps/api/src/services/ses.ts` (copy from EMAIL_SETUP_GUIDE.md)
- [ ] Update: `apps/api/.env` with AWS credentials
- [ ] Create: `apps/api/src/scripts/test-email.ts`
- [ ] Update: `apps/api/src/services/contract.ts` to send emails

### Phase 7: Testing (30 minutes)
- [ ] Run: `npx tsx src/scripts/test-email.ts`
- [ ] Check inbox for test email
- [ ] Verify email headers show SPF=pass, DKIM=pass
- [ ] Test contract email (if production approved)
- [ ] Monitor SES dashboard for metrics

---

## Detailed Instructions

## Phase 1: AWS Account & IAM User Setup (15 minutes)

### Goal
Create AWS account and IAM user with SES permissions.

### Step 1.1: Create AWS Account
- [ ] Go to https://aws.amazon.com
- [ ] Click "Create an AWS Account"
- [ ] Provide email address (your email)
- [ ] Create password
- [ ] Provide payment method (required for SES, won't charge for first 60K emails/month)
- [ ] Complete account creation
- [ ] Verify email address

### Step 1.2: Create IAM User
- [ ] Go to AWS Console → IAM (https://console.aws.amazon.com/iam/)
- [ ] Click "Users" in left sidebar
- [ ] Click "Create user"
- [ ] User name: `mizu-ses-user`
- [ ] Check "Provide user access to AWS Management Console"
- [ ] Select "I want to create an IAM user"
- [ ] Password: Auto-generated or custom
- [ ] Click "Next"

### Step 1.3: Add SES Permissions
- [ ] Click "Attach policies directly"
- [ ] Search for: `AmazonSESFullAccess`
- [ ] Check the checkbox
- [ ] Click "Next"
- [ ] Review and click "Create user"

### Step 1.4: Create Access Keys
- [ ] Go to IAM → Users
- [ ] Click on `mizu-ses-user`
- [ ] Scroll to "Access keys"
- [ ] Click "Create access key"
- [ ] Select "Application running outside AWS"
- [ ] Click "Next"
- [ ] Click "Create access key"
- [ ] Copy and save securely:
  - [ ] **Access Key ID** → Password manager
  - [ ] **Secret Access Key** → Password manager
- [ ] Save the CSV file
- [ ] Click "Done"

### Step 1.5: Verify AWS Setup
- [ ] Logged in successfully to IAM user account
- [ ] Access keys saved securely (NOT in Git)

---

## Phase 2: Domain Verification in AWS SES (10 minutes)

### ⚠️ CRITICAL: Check AWS Region First!
- [ ] Top right of AWS console → Region dropdown
- [ ] **MUST be:** eu-west-2 (Ireland)
- [ ] If on eu-north-1: Click and change to eu-west-2
- [ ] If wrong region: Domain verification option won't appear

### Step 2.1: Access SES Console
- [ ] Go to AWS SES Console: https://console.aws.amazon.com/sesv2
- [ ] Verify you're in **eu-west-2 (Ireland)** region
- [ ] Click "Verified identities" in left sidebar

### Step 2.2: Create Domain Identity
- [ ] Click "Create identity" button
- [ ] Select **Domain** (THIS IS CRITICAL - NOT Email Address)
- [ ] Domain name: `shotbymizu.co.uk` (no www)
- [ ] Check "Generate DKIM tokens"
- [ ] Click "Create identity"

### Step 2.3: Get DKIM Token Information
AWS SES will display your domain with DKIM information. You need to copy:

- [ ] **Token 1:**
  - [ ] Token name: `xxxx._domainkey` (copy the xxxx part)
  - [ ] CNAME target: `xxxx.dkim.amazonses.com`

- [ ] **Token 2:**
  - [ ] Token name: `xxxx._domainkey` (copy the xxxx part)
  - [ ] CNAME target: `xxxx.dkim.amazonses.com`

- [ ] **Token 3:**
  - [ ] Token name: `xxxx._domainkey` (copy the xxxx part)
  - [ ] CNAME target: `xxxx.dkim.amazonses.com`

**Recommendation:** Paste all 6 values into a text file for easy Cloudflare setup reference.

### Step 2.4: Note Current Status
- [ ] Domain appears in Verified Identities list
- [ ] Status shows: "Verification in progress" (will change once DKIM is verified)
- [ ] DKIM status shows: "Pending" (will change once CNAME records added)

---

## Phase 3: Add DNS Records to Cloudflare (20 minutes)

### Step 3.1: Log into Cloudflare
- [ ] Go to https://dash.cloudflare.com
- [ ] Log in with your account
- [ ] Select domain: **shotbymizu.co.uk**
- [ ] Click **DNS** in left sidebar

### Step 3.2: Add DKIM CNAME Record 1
- [ ] Click "Add record"
- [ ] **Type:** CNAME
- [ ] **Name:** token1._domainkey (replace "token1" with your first token name)
- [ ] **Content:** token1.dkim.amazonses.com (exact value from AWS)
- [ ] **TTL:** Auto
- [ ] **Proxy status:** DNS only (gray cloud icon) - CRITICAL
- [ ] Click "Save"
- [ ] Verify record appears in list

### Step 3.3: Add DKIM CNAME Record 2
- [ ] Click "Add record"
- [ ] **Type:** CNAME
- [ ] **Name:** token2._domainkey (replace "token2" with your second token name)
- [ ] **Content:** token2.dkim.amazonses.com (exact value from AWS)
- [ ] **TTL:** Auto
- [ ] **Proxy status:** DNS only (gray cloud icon)
- [ ] Click "Save"
- [ ] Verify record appears in list

### Step 3.4: Add DKIM CNAME Record 3
- [ ] Click "Add record"
- [ ] **Type:** CNAME
- [ ] **Name:** token3._domainkey (replace "token3" with your third token name)
- [ ] **Content:** token3.dkim.amazonses.com (exact value from AWS)
- [ ] **TTL:** Auto
- [ ] **Proxy status:** DNS only (gray cloud icon)
- [ ] Click "Save"
- [ ] Verify record appears in list

### Step 3.5: Modify SPF Record
- [ ] Find existing TXT record with `v=spf1 include:outlook.com ~all`
- [ ] Click edit (pencil icon)
- [ ] Verify **Name** is: **@** (root domain)
- [ ] **Current Content:** `v=spf1 include:outlook.com ~all`
- [ ] **Change to:** `v=spf1 include:outlook.com include:amazonses.com ~all`
- [ ] Click "Save"
- [ ] Verify record updated

### Step 3.6: Add DMARC Record
- [ ] Click "Add record"
- [ ] **Type:** TXT
- [ ] **Name:** _dmarc
- [ ] **Content:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100`
- [ ] **TTL:** Auto (or 1 hour for faster testing)
- [ ] **Proxy status:** DNS only (gray cloud icon)
- [ ] Click "Save"
- [ ] Verify record appears in list

### Step 3.7: Verify All Records
- [ ] 3 DKIM CNAME records visible in DNS list
- [ ] Modified SPF record visible
- [ ] DMARC TXT record visible
- [ ] All email records set to "DNS only" (gray cloud)

---

## Phase 4: Verify DNS Propagation (10 minutes)

### Step 4.1: Wait for Initial Propagation
- [ ] Wait **15-30 minutes** after adding Cloudflare records
- [ ] (AWS SES checks for records during this time)

### Step 4.2: Verify SPF Record
Open PowerShell and run:
```
nslookup -type=txt shotbymizu.co.uk
```

- [ ] Output includes: `v=spf1 include:outlook.com include:amazonses.com ~all`
- [ ] If not visible, wait 10 more minutes and retry

### Step 4.3: Verify DKIM Records
For each token, run:
```
nslookup -type=cname token1._domainkey.shotbymizu.co.uk
nslookup -type=cname token2._domainkey.shotbymizu.co.uk
nslookup -type=cname token3._domainkey.shotbymizu.co.uk
```

- [ ] All 3 records resolve to their CNAME targets
- [ ] If not visible, wait 10 more minutes and retry

### Step 4.4: Verify DMARC Record
```
nslookup -type=txt _dmarc.shotbymizu.co.uk
```

- [ ] Output includes: `v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100`

### Step 4.5: Check AWS SES Console
- [ ] Go to AWS SES → Verified Identities
- [ ] Click on **shotbymizu.co.uk**
- [ ] Check **DKIM** section
- [ ] Status should show: **Verified** ✓ for all 3 tokens
- [ ] Domain status should show: **Verified** ✓

**If DKIM still "Pending" after 1 hour:**
- [ ] Verify CNAME records in Cloudflare match AWS exactly
- [ ] Re-check records with nslookup
- [ ] Delete and re-add if typo suspected
- [ ] AWS checks every 10-30 minutes

---

## Phase 5: Request Production Access (5 minutes + 24 hour wait)

### Step 5.1: Go to Account Dashboard
- [ ] AWS SES Console
- [ ] Click "Account dashboard" or "Dashboard" in sidebar

### Step 5.2: Find Production Access Section
- [ ] Scroll to "Sending limits"
- [ ] Current status: "Sandbox" (can only send to verified)
- [ ] Look for "Request sending limit increase" button

### Step 5.3: Submit Production Request
- [ ] Click the production access request button
- [ ] Fill the form:
  - [ ] **Use case:** Select "Transactional"
  - [ ] **Website URL:** `shotbymizu.co.uk`
  - [ ] **Use case description:**
    ```
    Sending transactional emails for a photography studio platform.
    Clients receive contracts, proposals, and invoices.
    No marketing emails, only transactional correspondence.
    ```
- [ ] Click "Submit"

### Step 5.4: Wait for Approval
- [ ] Check email for AWS SES approval (usually within 24 hours)
- [ ] Once approved:
  - [ ] SES console status changes to "Production" ✓
  - [ ] Sending limit shows higher number (e.g., 50,000/day)
  - [ ] Can now send to any email address

**While waiting:** Continue with Phase 6 (Code Implementation)

---

## Phase 6: Application Code Implementation (1-2 hours)

### Step 6.1: Install AWS SDK
Navigate to `apps/api` directory:
```bash
cd apps/api
pnpm add @aws-sdk/client-ses
```

- [ ] Package installed successfully
- [ ] `package.json` includes `@aws-sdk/client-ses`

### Step 6.2: Create SES Service File
Create: `apps/api/src/services/ses.ts`

- [ ] File created at correct path
- [ ] Copy SES service code from EMAIL_SETUP_GUIDE.md
- [ ] Includes:
  - [ ] `sendEmail()` function
  - [ ] `sendContractEmail()` function
  - [ ] TypeScript types
  - [ ] Error handling

### Step 6.3: Update Environment Variables
Edit: `apps/api/.env`

Add:
```env
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
SENDER_EMAIL=michael@shotbymizu.co.uk
PUBLIC_URL=https://shotbymizu.co.uk
```

- [ ] Replace with actual AWS credentials
- [ ] File is in `.gitignore` (not in Git)
- [ ] Credentials NOT shared

### Step 6.4: Create Test Script
Create: `apps/api/src/scripts/test-email.ts`

- [ ] File at correct path
- [ ] Copy test function from EMAIL_SETUP_GUIDE.md
- [ ] Imports from `src/services/ses`
- [ ] Can run: `npx tsx src/scripts/test-email.ts`

### Step 6.5: Update Contract Service
Edit: `apps/api/src/services/contract.ts`

- [ ] Import: `import { sendContractEmail } from './ses';`
- [ ] Call `sendContractEmail()` when creating contracts
- [ ] Include error handling
- [ ] Log email sending

### Step 6.6: Verify Code
- [ ] `pnpm typecheck` - No errors ✓
- [ ] `pnpm build` - Builds successfully ✓
- [ ] All imports resolve ✓

---

## Phase 7: Testing & Verification (30 minutes)

### Step 7.1: Verify SES Console
- [ ] AWS SES → Verified Identities
- [ ] Domain shows **Verified** ✓
- [ ] DKIM shows **Verified** ✓ for all 3
- [ ] Status: Ready for sending

### Step 7.2: Test Email Sending
- [ ] Start API: `pnpm dev:api`
- [ ] Run: `npx tsx src/scripts/test-email.ts`
- [ ] Console shows: "✅ Email sent successfully"
- [ ] Message ID appears

### Step 7.3: Check Email Received
- [ ] Open email client (Gmail, Outlook)
- [ ] Check inbox for test email
- [ ] Email subject: "Test Email from SES"
- [ ] Email NOT in spam folder
- [ ] Email body displays correctly

### Step 7.4: Check Email Headers
- [ ] Open received email
- [ ] View message source:
  - [ ] Gmail: More → Show original
  - [ ] Outlook: Actions → View message details
- [ ] Check for:
  - [ ] `Received-SPF: pass` ✓
  - [ ] `dkim=pass` ✓
  - [ ] `spf=pass` ✓

### Step 7.5: Monitor SES Dashboard
- [ ] AWS SES → Dashboard → Sending statistics
- [ ] Shows:
  - [ ] 1+ deliveries
  - [ ] 0 bounces
  - [ ] 0 complaints
  - [ ] Bounce rate < 5%

### Step 7.6: Test Contract Email (if approved)
- [ ] Create test contract in admin
- [ ] Send to test email
- [ ] Email arrives with:
  - [ ] Client name correct
  - [ ] Signing link works
  - [ ] Professional formatting

### Step 7.7: Verify M365 Still Works
- [ ] Send email from michael@shotbymizu.co.uk via M365
- [ ] Email delivers normally
- [ ] SPF/DKIM checks pass

---

## Success Checklist

You're done when ALL items are checked:

**AWS Setup:**
- [ ] AWS account created
- [ ] IAM user created (mizu-ses-user)
- [ ] Access keys saved securely
- [ ] Region is eu-west-2

**Domain Verification:**
- [ ] Domain verified in SES (shotbymizu.co.uk)
- [ ] DKIM status: Verified ✓
- [ ] Domain status: Verified ✓

**DNS Configuration:**
- [ ] 3 DKIM CNAME records added to Cloudflare
- [ ] SPF record modified (includes amazonses.com)
- [ ] DMARC TXT record added
- [ ] All records set to "DNS only"

**DNS Verification:**
- [ ] nslookup shows SPF record correct
- [ ] nslookup shows DKIM records correct
- [ ] nslookup shows DMARC record correct

**Production Access:**
- [ ] Production request submitted
- [ ] Approval email received (or approved)
- [ ] Status changed to "Production"

**Code Implementation:**
- [ ] AWS SDK installed
- [ ] SES service created (ses.ts)
- [ ] Test script created
- [ ] Environment variables set
- [ ] Contract service updated
- [ ] Code compiles without errors

**Testing:**
- [ ] Test email sends successfully
- [ ] Test email headers show SPF=pass, DKIM=pass
- [ ] Test email arrives in inbox
- [ ] Email NOT in spam folder
- [ ] Contract email integration works
- [ ] M365 email still works
- [ ] SES metrics look good

**Ready to send contracts via SES!** ✓

---

## Troubleshooting

### DKIM Verification Slow
- **Issue:** DKIM still "Pending" after 1 hour
- **Solution:**
  1. Verify CNAME records in Cloudflare match AWS exactly
  2. Use online tool: https://mxtoolbox.com/dkim.aspx
  3. Wait up to 2 hours (AWS checks periodically)
  4. Delete and re-add if typo suspected

### DNS Records Not Resolving
- **Issue:** nslookup returns nothing
- **Solution:**
  1. Confirm records are saved in Cloudflare
  2. Wait 30 minutes for propagation
  3. Clear DNS cache: `ipconfig /flushdns`
  4. Try online tools: https://mxtoolbox.com/

### Production Request Denied
- **Issue:** AWS rejects production access
- **Solution:**
  1. Resubmit with more details
  2. Include photography studio business info
  3. Usually approved on second attempt

### Email Goes to Spam
- **Issue:** Test email in spam folder
- **Solution:**
  1. Wait 60 minutes (full DNS propagation)
  2. Check DKIM status is "Verified" in AWS SES
  3. Check headers for SPF=pass, DKIM=pass
  4. Try Gmail first
  5. Check email content (some words trigger spam)

### "MessageRejected" Error
- **Issue:** Error when sending
- **Cause:** Still in sandbox mode
- **Solution:**
  1. Wait for production approval
  2. Until then: verify recipient email as identity
  3. After approval: can send to anyone

---

## Quick Reference

**Important Files:**
- AWS IAM User: mizu-ses-user
- Domain: shotbymizu.co.uk
- SES Service: apps/api/src/services/ses.ts
- Test Script: apps/api/src/scripts/test-email.ts
- Environment: apps/api/.env

**Important URLs:**
- AWS SES: https://console.aws.amazon.com/sesv2
- Cloudflare: https://dash.cloudflare.com
- MXToolbox: https://mxtoolbox.com/

**Important Commands:**
```bash
# Check SPF
nslookup -type=txt shotbymizu.co.uk

# Check DKIM
nslookup -type=cname token1._domainkey.shotbymizu.co.uk

# Check DMARC
nslookup -type=txt _dmarc.shotbymizu.co.uk

# Test email
npx tsx src/scripts/test-email.ts
```

---

**Document Version:** 2.0 (Domain Verification - Checklist Format)
**Last Updated:** November 4, 2025
**Status:** ✅ Ready to Follow
