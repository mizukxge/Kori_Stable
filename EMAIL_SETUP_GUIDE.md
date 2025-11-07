# Email System Setup Guide - Postmark Integration

**Project:** Mizu Studio Photography Platform
**Date:** November 5, 2025
**Email Provider:** Postmark (https://postmarkapp.com)
**Primary Email:** michael@shotbymizu.co.uk (Microsoft 365)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Postmark Setup](#postmark-setup)
4. [DNS Configuration](#dns-configuration)
5. [Application Configuration](#application-configuration)
6. [Email Templates](#email-templates)
7. [Testing & Validation](#testing--validation)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers setting up Postmark to send transactional emails (contracts, proposals, invoices) from your shotbymizu.co.uk domain. Your michael@shotbymizu.co.uk address remains on Microsoft 365 for personal email.

### Verification Approach

This guide uses **Domain Verification** for shotbymizu.co.uk, which allows you to:
- Send from any email address at your domain (michael@shotbymizu.co.uk or any other)
- Maintain Microsoft 365 as your primary email provider
- Use DKIM authentication for maximum deliverability
- Scale to high email volumes
- Get immediate production access (no approval waiting)

### Key Features
- **Cost-effective:** $15/month for 10,000 emails, free tier available
- **Reliable:** 99.99% uptime, excellent deliverability
- **Simple:** No complex AWS setup, immediate production access
- **Domain Authentication:** DKIM + SPF + DMARC for inbox delivery
- **Bounce/Complaint Handling:** Automatic suppression lists
- **Analytics:** Beautiful dashboard with real-time metrics
- **Templates:** Built-in template management with versioning

### Architecture
```
Your Application → Postmark API → Email Provider (Gmail, Outlook, etc.)
                      ↓
              Uses DKIM + SPF + DMARC authentication
              Sends from michael@shotbymizu.co.uk
              Domain verified: shotbymizu.co.uk
```

---

## Prerequisites

Before starting, you'll need:

1. **Postmark Account** - Create at https://postmarkapp.com
2. **Domain Ownership** - shotbymizu.co.uk (you own this)
3. **DNS Access** - Cloudflare (you manage DNS here)
4. **Node.js Environment** - v18+ (already installed)

### Current Setup
- **Email Address:** michael@shotbymizu.co.uk
- **Email Provider:** Microsoft 365
- **Domain:** shotbymizu.co.uk
- **DNS Manager:** Cloudflare
- **Target:** Send transactional emails via Postmark

---

## Postmark Setup

### Step 1: Create Postmark Account

1. Go to https://postmarkapp.com and sign up
2. Verify your email address
3. Choose a plan:
   - **Free tier:** 100 emails/month (perfect for testing)
   - **Paid:** $15/month for 10,000 emails
4. Access your dashboard

### Step 2: Add Sender Signature (Domain)

1. Go to **Sender Signatures** in left sidebar
2. Click **Add Domain or Email Address**
3. Select **Domain**
4. Enter domain: `shotbymizu.co.uk` (without www)
5. Click **Verify Domain**

Postmark will display DNS records you need to add:
- DKIM records (usually CNAME or TXT)
- Return-Path CNAME (for bounce handling)

### Step 3: Get Server API Token

1. Go to **Servers** in dashboard
2. Click on your server (e.g., "My First Server")
3. Go to **API Tokens** tab
4. Copy **Server API Token**
5. Save this securely - you'll need it for your application

⚠️ **CRITICAL:** Do NOT commit this token to Git. Store in `.env` file.

---

## DNS Configuration

### Cloudflare Setup Overview

You need to add:
1. **DKIM records** (from Postmark)
2. **Return-Path CNAME** (from Postmark, for bounce handling)
3. **Modify SPF record** (add spf.mtasv.net)
4. **Add DMARC record** (optional but recommended)

### Step 1: Add DKIM Records to Cloudflare

Go to https://dash.cloudflare.com and select your domain:

1. Click **DNS** in the left sidebar
2. Click **Add Record** button
3. For each DKIM record shown by Postmark:

**Example DKIM Record:**
```
Type: CNAME (or TXT, as shown by Postmark)
Name: [exact hostname from Postmark]
Content: [exact value from Postmark]
TTL: Auto
Proxy: DNS only (gray cloud)
```

⚠️ **Important:**
- Use EXACT values from Postmark dashboard
- Set proxy to "DNS only" (gray cloud icon)
- Copy both hostname and target value carefully

### Step 2: Add Return-Path CNAME

Postmark uses this for bounce handling:

```
Type: CNAME
Name: pm-bounces (or as shown by Postmark)
Content: pm.mtasv.net (or as shown by Postmark)
TTL: Auto
Proxy: DNS only (gray cloud)
```

### Step 3: Modify SPF Record

Find your existing SPF record in Cloudflare:

**Current (Microsoft 365 only):**
```
v=spf1 include:outlook.com ~all
```

**New (Microsoft 365 + Postmark):**
```
v=spf1 include:outlook.com include:spf.mtasv.net ~all
```

Steps:
1. In Cloudflare DNS, find the TXT record with `v=spf1 include:outlook.com ~all`
2. Click edit (pencil icon)
3. Change content to: `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
4. Click Save

### Step 4: Add DMARC Record (Optional but Recommended)

1. In Cloudflare, click **Add Record**
2. Fill in:
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100
TTL: Auto
Proxy: DNS only (gray cloud)
```

### Verification

Wait 15-30 minutes for DNS propagation, then verify:

**Check SPF:**
```bash
nslookup -type=txt shotbymizu.co.uk
# Should show: v=spf1 include:outlook.com include:spf.mtasv.net ~all
```

**Check DKIM:**
```bash
nslookup -type=cname [dkim-hostname]._domainkey.shotbymizu.co.uk
# Should show CNAME record to Postmark
```

**Check DMARC:**
```bash
nslookup -type=txt _dmarc.shotbymizu.co.uk
# Should show DMARC policy
```

**Check Postmark Dashboard:**
1. Go to Postmark → Sender Signatures
2. Click on shotbymizu.co.uk
3. Should show "Verified" status
4. Click "Re-verify" if needed

Or use online tools:
- SPF: https://mxtoolbox.com/spf.aspx
- DKIM: https://mxtoolbox.com/dkim.aspx
- DMARC: https://mxtoolbox.com/dmarc.aspx

---

## Application Configuration

### Step 1: Install Postmark SDK

```bash
pnpm add postmark
```

### Step 2: Update Email Service

Update `apps/api/src/services/ses.ts`:

```typescript
import { ServerClient } from 'postmark';

/**
 * Initialize Postmark Client with API token from environment variables
 */
const postmarkClient = new ServerClient(
  process.env.POSTMARK_SERVER_TOKEN || ''
);

/**
 * Interface for email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Postmark
 * @param options Email sending options
 * @returns Promise with message ID
 */
export async function sendEmail(options: SendEmailOptions) {
  const {
    to,
    subject,
    htmlBody,
    textBody = '',
    from = process.env.SENDER_EMAIL || 'michael@shotbymizu.co.uk',
    replyTo = process.env.SENDER_EMAIL || 'michael@shotbymizu.co.uk',
  } = options;

  // Ensure 'to' is a string (Postmark expects single recipient per call)
  const toAddress = Array.isArray(to) ? to[0] : to;

  try {
    const result = await postmarkClient.sendEmail({
      From: from,
      To: toAddress,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody || undefined,
      ReplyTo: replyTo,
      MessageStream: 'outbound',
    });

    console.log(`✅ Email sent successfully to ${toAddress}`);
    console.log(`   Message ID: ${result.MessageID}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${toAddress}:`, error);
    throw error;
  }
}

/**
 * Send contract signing email to client
 * @param clientEmail Client email address
 * @param contractId Contract ID for signing link
 * @param clientName Client name for personalization
 * @returns Promise with message ID
 */
export async function sendContractEmail(
  clientEmail: string,
  contractId: string,
  clientName: string
) {
  const signingLink = `${process.env.PUBLIC_URL || 'https://shotbymizu.co.uk'}/contract/${contractId}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .note {
            background-color: #f9f9f9;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #666;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #f0f0f0;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .footer-link {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Mizu Studio</div>
          </div>

          <div class="content">
            <p>Dear ${clientName},</p>

            <p>Thank you for choosing Mizu Studio for your photography needs. Your contract is ready for review and signature.</p>

            <p>Please click the button below to access your contract. You'll be able to review the terms and sign electronically.</p>

            <div style="text-align: center;">
              <a href="${signingLink}" class="button">Review & Sign Contract</a>
            </div>

            <div class="note">
              <strong>⏰ Important:</strong> This link will expire in 72 hours. If you need to sign after that time, please contact us to request a new link.
            </div>

            <p>If you have any questions about the contract or need any clarification, please don't hesitate to reach out. We're here to help!</p>

            <p>Best regards,<br>
            <strong>Mizu Studio</strong></p>
          </div>

          <div class="footer">
            <p>© 2025 Mizu Studio. All rights reserved.</p>
            <p>
              <a href="https://shotbymizu.co.uk" class="footer-link">Visit our website</a> |
              <a href="mailto:michael@shotbymizu.co.uk" class="footer-link">Contact us</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Dear ${clientName},

Thank you for choosing Mizu Studio for your photography needs. Your contract is ready for review and signature.

Please visit the following link to access your contract. You'll be able to review the terms and sign electronically.

${signingLink}

IMPORTANT: This link will expire in 72 hours. If you need to sign after that time, please contact us to request a new link.

If you have any questions about the contract or need any clarification, please don't hesitate to reach out. We're here to help!

Best regards,
Mizu Studio
https://shotbymizu.co.uk
michael@shotbymizu.co.uk
  `;

  return sendEmail({
    to: clientEmail,
    subject: 'Your Contract is Ready for Signature - Mizu Studio',
    htmlBody,
    textBody,
  });
}

/**
 * Send proposal email to prospect
 */
export async function sendProposalEmail(
  prospectEmail: string,
  proposalId: string,
  prospectName: string
) {
  const proposalLink = `${process.env.PUBLIC_URL || 'https://shotbymizu.co.uk'}/proposal/${proposalId}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #218838;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #f0f0f0;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .footer-link {
            color: #28a745;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Mizu Studio</div>
          </div>

          <div class="content">
            <p>Dear ${prospectName},</p>

            <p>Thank you for your interest in Mizu Studio! We've prepared a personalized proposal for your project.</p>

            <p>Please click the button below to view your proposal with detailed services, pricing, and timeline.</p>

            <div style="text-align: center;">
              <a href="${proposalLink}" class="button">View Proposal</a>
            </div>

            <p>We're excited about the possibility of working with you. If you have any questions or would like to discuss the proposal further, please feel free to reach out.</p>

            <p>Best regards,<br>
            <strong>Mizu Studio</strong></p>
          </div>

          <div class="footer">
            <p>© 2025 Mizu Studio. All rights reserved.</p>
            <p>
              <a href="https://shotbymizu.co.uk" class="footer-link">Visit our website</a> |
              <a href="mailto:michael@shotbymizu.co.uk" class="footer-link">Contact us</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Dear ${prospectName},

Thank you for your interest in Mizu Studio! We've prepared a personalized proposal for your project.

Please visit the following link to view your proposal with detailed services, pricing, and timeline:

${proposalLink}

We're excited about the possibility of working with you. If you have any questions or would like to discuss the proposal further, please feel free to reach out.

Best regards,
Mizu Studio
https://shotbymizu.co.uk
michael@shotbymizu.co.uk
  `;

  return sendEmail({
    to: prospectEmail,
    subject: 'Your Photography Proposal - Mizu Studio',
    htmlBody,
    textBody,
  });
}

/**
 * Send resend contract email (when client didn't sign first time)
 */
export async function sendResendContractEmail(
  clientEmail: string,
  contractId: string,
  clientName: string
) {
  const signingLink = `${process.env.PUBLIC_URL || 'https://shotbymizu.co.uk'}/contract/${contractId}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #f0f0f0;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .footer-link {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Mizu Studio</div>
          </div>

          <div class="content">
            <p>Dear ${clientName},</p>

            <p>We noticed that we haven't received your signed contract yet. Here's a fresh link to access and sign your contract.</p>

            <div style="text-align: center;">
              <a href="${signingLink}" class="button">Review & Sign Contract</a>
            </div>

            <div class="note">
              <strong>📋 Note:</strong> This is a new signing link. Your previous link has expired. This new link will be valid for 72 hours.
            </div>

            <p>If you have any questions or need any assistance, please reach out to us directly. We're here to help!</p>

            <p>Best regards,<br>
            <strong>Mizu Studio</strong></p>
          </div>

          <div class="footer">
            <p>© 2025 Mizu Studio. All rights reserved.</p>
            <p>
              <a href="https://shotbymizu.co.uk" class="footer-link">Visit our website</a> |
              <a href="mailto:michael@shotbymizu.co.uk" class="footer-link">Contact us</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Dear ${clientName},

We noticed that we haven't received your signed contract yet. Here's a fresh link to access and sign your contract.

${signingLink}

NOTE: This is a new signing link. Your previous link has expired. This new link will be valid for 72 hours.

If you have any questions or need any assistance, please reach out to us directly. We're here to help!

Best regards,
Mizu Studio
https://shotbymizu.co.uk
michael@shotbymizu.co.uk
  `;

  return sendEmail({
    to: clientEmail,
    subject: 'Action Required: Your Contract Signature - Mizu Studio',
    htmlBody,
    textBody,
  });
}

export default {
  sendEmail,
  sendContractEmail,
  sendProposalEmail,
  sendResendContractEmail,
};
```

### Step 3: Update Environment Variables

Add to `apps/api/.env`:

```env
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your_server_api_token_here
SENDER_EMAIL=michael@shotbymizu.co.uk
PUBLIC_URL=https://shotbymizu.co.uk
```

### Step 4: Integrate with Contract Service

Update `apps/api/src/services/contract.ts` to send emails when contracts are created:

```typescript
import { sendContractEmail } from './ses';

export async function createAndSendContract(data: ContractData) {
  // Create contract in database
  const contract = await prisma.contract.create({
    data: {
      // ... contract fields
    },
  });

  // Send email to client
  try {
    await sendContractEmail(
      data.clientEmail,
      contract.id,
      data.clientName
    );
  } catch (error) {
    console.error('Failed to send contract email:', error);
    // Log but don't fail - contract still created
  }

  return contract;
}
```

---

## Email Templates

Postmark also supports Templates feature for better management:

### Using Postmark Templates (Optional)

1. Go to Postmark Dashboard → Templates
2. Create a new template
3. Design using their visual editor
4. Save with alias (e.g., "contract-signing")
5. Update code to use template:

```typescript
const result = await postmarkClient.sendEmailWithTemplate({
  From: from,
  To: toAddress,
  TemplateAlias: 'contract-signing',
  TemplateModel: {
    client_name: clientName,
    signing_link: signingLink,
  },
});
```

---

## Testing & Validation

### Test 1: Verify Domain in Postmark

1. Go to Postmark → Sender Signatures
2. Find shotbymizu.co.uk
3. Status should show: **✓ Verified** and **✓ DKIM enabled**

### Test 2: Verify DNS Records

```bash
# Check SPF
nslookup -type=txt shotbymizu.co.uk

# Check DKIM (use hostname from Postmark)
nslookup -type=cname [hostname]._domainkey.shotbymizu.co.uk

# Check DMARC
nslookup -type=txt _dmarc.shotbymizu.co.uk
```

### Test 3: Test Email Sending

Create `apps/api/src/scripts/test-email.ts`:

```typescript
import { sendEmail } from '../services/ses';

async function testEmail() {
  try {
    const result = await sendEmail({
      to: 'michael@shotbymizu.co.uk',
      subject: 'Test Email from Postmark',
      htmlBody: '<p>This is a test email from Postmark</p>',
      textBody: 'This is a test email from Postmark',
    });
    console.log('✅ Email sent successfully');
    console.log('Message ID:', result.MessageID);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

testEmail();
```

Run test:
```bash
npx tsx src/scripts/test-email.ts
```

### Test 4: Check Email Headers

When you receive the test email:
1. Open email in Gmail/Outlook
2. View message source/headers
3. Look for:
   - `Authentication-Results: ... spf=pass ... dkim=pass`
   - `Received-SPF: pass`

This confirms email authentication is working.

### Test 5: Monitor Postmark Dashboard

1. Go to Postmark Dashboard → Activity
2. You should see:
   - Recent email sent
   - Delivered status
   - Click on message for details

---

## Production Deployment

### Prerequisites

- ✅ Domain verified in Postmark
- ✅ DKIM records added to Cloudflare
- ✅ SPF record updated
- ✅ DMARC record added (optional)
- ✅ Postmark API token in environment variables
- ✅ Test email sent and received

### Step 1: Deploy Application

```bash
# Build application
pnpm build

# Set environment variables in production
# (use environment variables or .env file)

# Start application
NODE_ENV=production pnpm start
```

### Step 2: Monitor Email Delivery

1. Check Postmark activity log regularly
2. Monitor bounce/complaint rates (should be <5% bounce, <0.1% complaint)
3. Check DMARC reports (emailed to dmarc@shotbymizu.co.uk)
4. Watch for any delivery failures

### Step 3: Set Up Webhooks (Optional)

Postmark can notify you of events:
1. Go to Postmark → Webhooks
2. Add webhook URL (e.g., https://shotbymizu.co.uk/api/webhooks/postmark)
3. Select events: Delivery, Bounce, Spam Complaint, Open (optional)
4. Implement webhook endpoint in your API

---

## Troubleshooting

### Issue: Domain Not Showing "Verified" in Postmark

**Cause:** DNS records not propagating
**Solution:**
1. Go to Postmark → Sender Signatures
2. Click on your domain
3. Verify DNS records match exactly
4. Copy exact values to Cloudflare
5. Wait 30 minutes for propagation
6. Click "Re-verify" in Postmark

### Issue: Email Going to Spam Folder

**Possible causes:**
1. DKIM not verified yet (wait 30 min)
2. SPF record not updated
3. DMARC policy too strict

**Solutions:**
1. Verify all DNS records with nslookup
2. Check email headers for SPF/DKIM pass
3. Try different content (some words trigger spam filters)
4. Test with Gmail account first
5. Postmark has excellent deliverability - should be rare

### Issue: "401 Unauthorized" Error When Sending

**Cause:** Invalid API token
**Solution:**
1. Check API token in .env file
2. Ensure it's the Server API Token (not Account token)
3. Copy from Postmark → Servers → API Tokens
4. Restart API server after changing .env

### Issue: Microsoft 365 Email Broken After SPF Change

**Cause:** SPF record syntax error
**Solution:**
1. Verify SPF is exactly: `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
2. No extra spaces or characters
3. Wait 30 minutes for propagation
4. If still broken, revert to: `v=spf1 include:outlook.com ~all`

### Issue: DKIM Verification Taking Too Long

**Normal Timeline:**
- DKIM records added to Cloudflare → 5 min propagation
- Postmark checks records → 5-10 min
- Shows verified → Can take up to 30 min

**If still unverified after 1 hour:**
1. Verify DNS records exactly match Postmark values
2. Check Cloudflare shows records correctly
3. Use online checker: https://mxtoolbox.com/dkim.aspx
4. Click "Re-verify" in Postmark dashboard
5. If still issues, contact Postmark support

---

## Security Best Practices

⚠️ **Never:**
- Commit Postmark API tokens to Git
- Share API tokens publicly
- Hardcode tokens in code

✅ **Always:**
- Store tokens in `.env` (not in Git)
- Rotate tokens periodically
- Monitor Postmark activity for suspicious sends
- Use HTTPS for email links
- Validate recipient email addresses

---

## Checklist

- [ ] Postmark account created
- [ ] Server created
- [ ] Domain added to Sender Signatures
- [ ] Domain verified in Postmark (shotbymizu.co.uk)
- [ ] DKIM records added to Cloudflare
- [ ] Return-Path CNAME added (if required)
- [ ] SPF record modified in Cloudflare
- [ ] DMARC record added (optional)
- [ ] DNS records verified with nslookup
- [ ] Postmark dashboard shows verified
- [ ] Postmark SDK installed: `pnpm add postmark`
- [ ] Email service updated (ses.ts)
- [ ] Environment variables configured (.env)
- [ ] Test email sent and received
- [ ] Email headers show SPF/DKIM pass
- [ ] Application updated to send contract emails
- [ ] Monitored Postmark activity log

---

## References

- **Postmark Documentation:** https://postmarkapp.com/developer
- **Postmark Getting Started:** https://postmarkapp.com/developer/user-guide/getting-started
- **Cloudflare DNS:** https://developers.cloudflare.com/dns/
- **SPF Reference:** https://www.dmarcian.com/spf/
- **DKIM Reference:** https://www.dmarcian.com/dkim/
- **DMARC Reference:** https://www.dmarcian.com/dmarc/

---

**Document Version:** 1.0 (Postmark)
**Last Updated:** November 5, 2025
**Status:** ✅ Ready to Implement
