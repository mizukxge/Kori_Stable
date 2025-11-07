# Postmark Setup Checklist - Domain Verification Approach

**Project:** Mizu Studio Photography Platform
**Date:** November 5, 2025
**Setup Type:** Domain Verification (shotbymizu.co.uk)
**Email Provider:** Postmark
**Email Address:** michael@shotbymizu.co.uk (Microsoft 365)
**DNS Manager:** Cloudflare

---

## Quick Start (1-Page Summary)

### Phase 1: Postmark Account Setup (10 minutes)
- [ ] Create Postmark account at https://postmarkapp.com
- [ ] Choose free tier (100 emails/month) or paid plan
- [ ] Verify email address
- [ ] Log into Postmark dashboard

### Phase 2: Domain Verification (10 minutes)
- [ ] Go to Postmark Dashboard → Sender Signatures
- [ ] Click **Add Domain**
- [ ] Enter: `shotbymizu.co.uk`
- [ ] Click **Verify Domain**
- [ ] Copy DNS records shown (DKIM and Return-Path)
- [ ] Save Server API Token from Settings

### Phase 3: Cloudflare DNS Configuration (15 minutes)
- [ ] Log into Cloudflare: https://dash.cloudflare.com
- [ ] Select domain: `shotbymizu.co.uk`
- [ ] Go to **DNS** section
- [ ] **Add DKIM records from Postmark** (exact records provided)
- [ ] **Add Return-Path CNAME** (if shown by Postmark)
- [ ] **Modify SPF Record:**
  - [ ] Find TXT record: `v=spf1 include:outlook.com ~all`
  - [ ] Change to: `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
- [ ] **Add DMARC Record:**
  - [ ] Type: **TXT**
  - [ ] Name: **_dmarc**
  - [ ] Content: `v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100`

### Phase 4: DNS Verification (10 minutes)
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Run: `nslookup -type=txt shotbymizu.co.uk` (verify SPF)
- [ ] Check Postmark dashboard
- [ ] Domain should show **Verified** ✓

### Phase 5: Code Implementation (1-2 hours)
- [ ] Install SDK: `pnpm add postmark`
- [ ] Update: `apps/api/src/services/ses.ts` (use Postmark)
- [ ] Update: `apps/api/.env` with Postmark API token
- [ ] Update: `apps/api/src/scripts/test-email.ts`

### Phase 6: Testing (30 minutes)
- [ ] Run: `npx tsx src/scripts/test-email.ts`
- [ ] Check inbox for test email
- [ ] Verify email headers show SPF=pass, DKIM=pass
- [ ] Monitor Postmark dashboard for activity

---

## Detailed Instructions

## Phase 1: Postmark Account Setup (10 minutes)

### Goal
Create Postmark account and access dashboard.

### Step 1.1: Create Postmark Account
- [ ] Go to https://postmarkapp.com
- [ ] Click "Start Free Trial" or "Sign Up"
- [ ] Provide email address (michael@shotbymizu.co.uk)
- [ ] Create password
- [ ] Verify email address
- [ ] Log into dashboard

### Step 1.2: Choose Plan
- [ ] Free tier: 100 emails/month (perfect for testing)
- [ ] Paid: $15/month for 10,000 emails (recommended for production)
- [ ] Select plan that fits your needs
- [ ] No credit card required for free tier

### Step 1.3: Access Dashboard
- [ ] Logged in successfully to Postmark dashboard
- [ ] Familiarize yourself with layout
- [ ] Note the "Servers" section (you'll have a default server)

---

## Phase 2: Domain Verification in Postmark (10 minutes)

### Step 2.1: Access Sender Signatures
- [ ] In Postmark Dashboard, click **Sender Signatures** (left sidebar)
- [ ] Click **Add Domain or Email Address**
- [ ] Select **Domain**

### Step 2.2: Add Your Domain
- [ ] Domain name: `shotbymizu.co.uk` (no www, no https)
- [ ] Click **Verify Domain**
- [ ] Postmark will show DNS records to add

### Step 2.3: Copy DNS Records
Postmark will display records similar to:

- [ ] **DKIM Record(s):**
  - [ ] Record type: CNAME or TXT
  - [ ] Hostname: (provided by Postmark)
  - [ ] Value: (provided by Postmark)

- [ ] **Return-Path CNAME:**
  - [ ] Hostname: pm-bounces (or similar)
  - [ ] Value: pm.mtasv.net (or similar)

**Important:** Copy these EXACT values - you'll add them to Cloudflare.

### Step 2.4: Get API Token
- [ ] Go to Postmark Dashboard → Servers
- [ ] Click on your server (e.g., "My First Server")
- [ ] Go to **API Tokens** tab
- [ ] Copy **Server API Token**
- [ ] Save to password manager (you'll need this for .env)

### Step 2.5: Note Current Status
- [ ] Domain appears in Sender Signatures list
- [ ] Status shows: "Pending" or "Unverified" (will change after DNS setup)

---

## Phase 3: Add DNS Records to Cloudflare (15 minutes)

### Step 3.1: Log into Cloudflare
- [ ] Go to https://dash.cloudflare.com
- [ ] Log in with your account
- [ ] Select domain: **shotbymizu.co.uk**
- [ ] Click **DNS** in left sidebar

### Step 3.2: Add DKIM Records from Postmark
For each DKIM record shown by Postmark:

- [ ] Click "Add record"
- [ ] **Type:** CNAME (or TXT, as shown by Postmark)
- [ ] **Name:** (exact hostname from Postmark)
- [ ] **Content:** (exact value from Postmark)
- [ ] **TTL:** Auto
- [ ] **Proxy status:** DNS only (gray cloud icon) - CRITICAL
- [ ] Click "Save"
- [ ] Verify record appears in list

### Step 3.3: Add Return-Path CNAME
- [ ] Click "Add record"
- [ ] **Type:** CNAME
- [ ] **Name:** pm-bounces (or as shown by Postmark)
- [ ] **Content:** pm.mtasv.net (or as shown by Postmark)
- [ ] **TTL:** Auto
- [ ] **Proxy status:** DNS only (gray cloud icon)
- [ ] Click "Save"

### Step 3.4: Modify SPF Record
- [ ] Find existing TXT record with `v=spf1 include:outlook.com ~all`
- [ ] Click edit (pencil icon)
- [ ] Verify **Name** is: **@** (root domain)
- [ ] **Current Content:** `v=spf1 include:outlook.com ~all`
- [ ] **Change to:** `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
- [ ] Click "Save"
- [ ] Verify record updated

### Step 3.5: Add DMARC Record
- [ ] Click "Add record"
- [ ] **Type:** TXT
- [ ] **Name:** _dmarc
- [ ] **Content:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100`
- [ ] **TTL:** Auto
- [ ] **Proxy status:** DNS only (gray cloud icon)
- [ ] Click "Save"

### Step 3.6: Verify All Records
- [ ] DKIM records visible in DNS list
- [ ] Return-Path CNAME visible
- [ ] Modified SPF record visible
- [ ] DMARC TXT record visible
- [ ] All email records set to "DNS only" (gray cloud)

---

## Phase 4: Verify DNS Propagation (10 minutes)

### Step 4.1: Wait for Initial Propagation
- [ ] Wait **15-30 minutes** after adding Cloudflare records
- [ ] (Postmark checks for records during this time)

### Step 4.2: Verify SPF Record
Open PowerShell and run:
```
nslookup -type=txt shotbymizu.co.uk
```

- [ ] Output includes: `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
- [ ] If not visible, wait 10 more minutes and retry

### Step 4.3: Verify DKIM Records
Use the hostname from Postmark:
```
nslookup -type=cname [dkim-hostname]._domainkey.shotbymizu.co.uk
```

- [ ] Record resolves to Postmark CNAME target
- [ ] If not visible, wait 10 more minutes and retry

### Step 4.4: Verify DMARC Record
```
nslookup -type=txt _dmarc.shotbymizu.co.uk
```

- [ ] Output includes: `v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100`

### Step 4.5: Check Postmark Dashboard
- [ ] Go to Postmark → Sender Signatures
- [ ] Click on **shotbymizu.co.uk**
- [ ] Status should show: **Verified** ✓
- [ ] DKIM should show: **Verified** ✓
- [ ] If still "Pending", wait and click "Re-verify"

**If still unverified after 1 hour:**
- [ ] Verify DNS records in Cloudflare match Postmark exactly
- [ ] Re-check records with nslookup
- [ ] Click "Re-verify" in Postmark dashboard
- [ ] Check Postmark support if issues persist

---

## Phase 5: Application Code Implementation (1-2 hours)

### Step 5.1: Install Postmark SDK
Navigate to `apps/api` directory:
```bash
cd apps/api
pnpm add postmark
```

- [ ] Package installed successfully
- [ ] `package.json` includes `postmark`

### Step 5.2: Update Email Service File
Edit: `apps/api/src/services/ses.ts`

- [ ] Replace AWS SES imports with Postmark
- [ ] Update `sendEmail()` function to use Postmark
- [ ] Update `sendContractEmail()` function
- [ ] Update `sendProposalEmail()` function
- [ ] Update `sendResendContractEmail()` function
- [ ] TypeScript types still work
- [ ] Error handling maintained

**See EMAIL_SETUP_GUIDE.md for complete code example**

### Step 5.3: Update Environment Variables
Edit: `apps/api/.env`

Remove AWS variables, add:
```env
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your_server_api_token_here
SENDER_EMAIL=michael@shotbymizu.co.uk
PUBLIC_URL=https://shotbymizu.co.uk
```

- [ ] Replace with actual Postmark Server API Token
- [ ] File is in `.gitignore` (not in Git)
- [ ] Token NOT shared

### Step 5.4: Update Test Script
Edit: `apps/api/src/scripts/test-email.ts`

- [ ] Update imports to use Postmark service
- [ ] Test function works with new service
- [ ] Can run: `npx tsx src/scripts/test-email.ts`

### Step 5.5: Update Contract Service
Edit: `apps/api/src/services/contract.ts`

- [ ] Import still works: `import { sendContractEmail } from './ses';`
- [ ] Call `sendContractEmail()` when creating contracts
- [ ] Error handling maintained
- [ ] Log email sending

### Step 5.6: Verify Code
- [ ] `pnpm typecheck` - No errors ✓
- [ ] `pnpm build` - Builds successfully ✓
- [ ] All imports resolve ✓

---

## Phase 6: Testing & Verification (30 minutes)

### Step 6.1: Verify Postmark Dashboard
- [ ] Postmark → Sender Signatures
- [ ] Domain shows **Verified** ✓
- [ ] DKIM shows **Verified** ✓
- [ ] Status: Ready for sending

### Step 6.2: Test Email Sending
- [ ] Start API: `pnpm dev:api`
- [ ] Run: `npx tsx src/scripts/test-email.ts`
- [ ] Console shows: "✅ Email sent successfully"
- [ ] Message ID appears

### Step 6.3: Check Email Received
- [ ] Open email client (Gmail, Outlook)
- [ ] Check inbox for test email
- [ ] Email subject: "Test Email from Postmark"
- [ ] Email NOT in spam folder
- [ ] Email body displays correctly

### Step 6.4: Check Email Headers
- [ ] Open received email
- [ ] View message source:
  - [ ] Gmail: More → Show original
  - [ ] Outlook: Actions → View message details
- [ ] Check for:
  - [ ] `Received-SPF: pass` ✓
  - [ ] `dkim=pass` ✓
  - [ ] `spf=pass` ✓

### Step 6.5: Monitor Postmark Dashboard
- [ ] Postmark → Activity
- [ ] Shows:
  - [ ] 1+ sent emails
  - [ ] Delivered status
  - [ ] 0 bounces
  - [ ] 0 spam complaints
  - [ ] Click on message to see details

### Step 6.6: Test Contract Email
- [ ] Create test contract in admin
- [ ] Send to test email
- [ ] Email arrives with:
  - [ ] Client name correct
  - [ ] Signing link works
  - [ ] Professional formatting

### Step 6.7: Verify M365 Still Works
- [ ] Send email from michael@shotbymizu.co.uk via M365
- [ ] Email delivers normally
- [ ] SPF/DKIM checks pass

---

## Success Checklist

You're done when ALL items are checked:

**Postmark Setup:**
- [ ] Postmark account created
- [ ] Server created
- [ ] Server API token saved securely
- [ ] Domain added to Sender Signatures

**Domain Verification:**
- [ ] Domain verified in Postmark (shotbymizu.co.uk)
- [ ] DKIM status: Verified ✓
- [ ] Domain status: Verified ✓

**DNS Configuration:**
- [ ] DKIM records added to Cloudflare
- [ ] Return-Path CNAME added (if required)
- [ ] SPF record modified (includes spf.mtasv.net)
- [ ] DMARC TXT record added
- [ ] All records set to "DNS only"

**DNS Verification:**
- [ ] nslookup shows SPF record correct
- [ ] nslookup shows DKIM records correct
- [ ] nslookup shows DMARC record correct
- [ ] Postmark dashboard shows verified

**Code Implementation:**
- [ ] Postmark SDK installed
- [ ] Email service updated (ses.ts)
- [ ] Test script updated
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
- [ ] Postmark activity log shows delivery

**Ready to send contracts via Postmark!** ✓

---

## Troubleshooting

### DKIM Verification Slow
- **Issue:** DKIM still "Unverified" after 1 hour
- **Solution:**
  1. Verify DNS records in Cloudflare match Postmark exactly
  2. Use online tool: https://mxtoolbox.com/dkim.aspx
  3. Wait up to 2 hours (Postmark checks periodically)
  4. Click "Re-verify" in Postmark dashboard
  5. Contact Postmark support if still unverified

### DNS Records Not Resolving
- **Issue:** nslookup returns nothing
- **Solution:**
  1. Confirm records are saved in Cloudflare
  2. Wait 30 minutes for propagation
  3. Clear DNS cache: `ipconfig /flushdns`
  4. Try online tools: https://mxtoolbox.com/
  5. Verify "Proxy status" is "DNS only" (gray cloud)

### Email Goes to Spam
- **Issue:** Test email in spam folder
- **Solution:**
  1. Wait 60 minutes (full DNS propagation)
  2. Check DKIM status is "Verified" in Postmark
  3. Check headers for SPF=pass, DKIM=pass
  4. Try Gmail first (best deliverability testing)
  5. Check email content (some words trigger spam)
  6. Postmark has excellent deliverability - should be rare

### "401 Unauthorized" Error
- **Issue:** Error when sending
- **Cause:** Invalid API token
- **Solution:**
  1. Check API token in .env file
  2. Verify it's the Server API Token (not Account token)
  3. Copy from Postmark → Servers → API Tokens
  4. Restart API server after changing .env

### Email Not Sending
- **Issue:** sendEmail() throws error
- **Solution:**
  1. Check Postmark activity log for errors
  2. Verify domain is verified
  3. Check API token is correct
  4. Ensure sender email is @shotbymizu.co.uk
  5. Check Postmark account is active

---

## Quick Reference

**Important Information:**
- Postmark Dashboard: https://account.postmarkapp.com
- Domain: shotbymizu.co.uk
- Email Service: apps/api/src/services/ses.ts
- Test Script: apps/api/src/scripts/test-email.ts
- Environment: apps/api/.env

**Important URLs:**
- Postmark Dashboard: https://account.postmarkapp.com
- Postmark API Docs: https://postmarkapp.com/developer
- Cloudflare: https://dash.cloudflare.com
- MXToolbox: https://mxtoolbox.com/

**Important Commands:**
```bash
# Check SPF
nslookup -type=txt shotbymizu.co.uk

# Check DKIM (use hostname from Postmark)
nslookup -type=cname [hostname]._domainkey.shotbymizu.co.uk

# Check DMARC
nslookup -type=txt _dmarc.shotbymizu.co.uk

# Test email
npx tsx src/scripts/test-email.ts

# Install Postmark
pnpm add postmark
```

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Status:** ✅ Ready to Follow
