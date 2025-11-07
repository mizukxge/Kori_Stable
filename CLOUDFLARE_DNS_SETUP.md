# Cloudflare DNS Setup for Postmark Email

**Project:** Mizu Studio Photography Platform
**Date:** November 5, 2025
**Email Provider:** Postmark
**DNS Manager:** Cloudflare
**Domain:** shotbymizu.co.uk

---

## Overview

This guide walks you through configuring DNS records in Cloudflare for Postmark email authentication. You'll be adding DKIM records for email signing, modifying your SPF record to include Postmark, and adding a DMARC record for email policy.

### What You're Accomplishing

- **Maintain Microsoft 365** - Your existing email (michael@shotbymizu.co.uk) continues working
- **Add Postmark** - Enable sending transactional emails from your application
- **Email Authentication** - Set up DKIM, SPF, and DMARC for maximum deliverability

---

## Current DNS Structure

### Your Existing Microsoft 365 Records

Before making changes, here's what you already have for Microsoft 365:

```
MX Records (Email delivery):
- @ → shotbymizu-co-uk.mail.protection.outlook.com (Priority: 0)

TXT Records (Email authentication):
- @ → v=spf1 include:outlook.com ~all

CNAME Records (Optional M365 services):
- autodiscover → autodiscover.outlook.com
- etc.
```

**These will remain unchanged!** We're only adding Postmark alongside M365.

---

## Records to Add/Modify

### Summary

1. **ADD:** DKIM records from Postmark (varies, usually 1-3 CNAME records)
2. **ADD:** Return-Path CNAME from Postmark (for bounce handling)
3. **MODIFY:** Existing SPF record (add Postmark authorization)
4. **ADD:** DMARC TXT record (email authentication policy)

---

## Step-by-Step Instructions

### Step 1: Get DNS Records from Postmark

Before configuring Cloudflare, you need the exact DNS values from Postmark:

1. Log into https://account.postmarkapp.com
2. Go to **Sender Signatures**
3. Click on **shotbymizu.co.uk** (or add it if not present)
4. Postmark displays DNS records you need to add:
   - **DKIM records** (CNAME or TXT)
   - **Return-Path CNAME**

**Example Postmark provides:**
```
DKIM Record:
Name: 20230401._domainkey
Type: CNAME
Value: 20230401.dkim.postmarkapp.com

Return-Path:
Name: pm-bounces
Type: CNAME
Value: pm.mtasv.net
```

⚠️ **Your actual values will be different!** Copy the EXACT values shown by Postmark.

---

### Step 2: Log into Cloudflare

1. Go to https://dash.cloudflare.com
2. Log in with your Cloudflare account
3. Select your domain: **shotbymizu.co.uk**
4. Click **DNS** in the left sidebar

You should see your existing DNS records.

---

### Step 3: Add DKIM Records

Postmark will show you DKIM records to add (typically 1-3 records).

#### For Each DKIM Record:

1. Click **Add record** button
2. Fill in the form:

```
Type: CNAME (or TXT, as shown by Postmark)
Name: [exact hostname from Postmark, e.g., "20230401._domainkey"]
Content: [exact value from Postmark, e.g., "20230401.dkim.postmarkapp.com"]
TTL: Auto
Proxy status: DNS only (gray cloud icon) - CRITICAL!
```

3. Click **Save**
4. Verify the record appears in your DNS list

⚠️ **CRITICAL:**
- Use EXACT values from Postmark (copy-paste)
- Set "Proxy status" to "DNS only" (gray cloud)
- Do NOT use "Proxied" (orange cloud) for email records

**Repeat for all DKIM records shown by Postmark.**

---

### Step 4: Add Return-Path CNAME

Postmark uses this for bounce handling:

1. Click **Add record**
2. Fill in:

```
Type: CNAME
Name: pm-bounces (or exact value from Postmark)
Content: pm.mtasv.net (or exact value from Postmark)
TTL: Auto
Proxy status: DNS only (gray cloud icon)
```

3. Click **Save**

---

### Step 5: Modify SPF Record

SPF (Sender Policy Framework) tells email providers which servers can send email from your domain.

#### Find Existing SPF Record

1. In Cloudflare DNS, look for a TXT record with name **@**
2. The content should be: `v=spf1 include:outlook.com ~all`

#### Update SPF Record

1. Click the **Edit** button (pencil icon) next to the SPF record
2. Verify:
   - **Name:** @ (root domain)
   - **Type:** TXT
3. Change **Content** from:
   ```
   v=spf1 include:outlook.com ~all
   ```
   To:
   ```
   v=spf1 include:outlook.com include:spf.mtasv.net ~all
   ```
4. Click **Save**

**What this does:**
- `include:outlook.com` - Allows Microsoft 365 to send email
- `include:spf.mtasv.net` - Allows Postmark to send email
- `~all` - Soft fail for unauthorized senders

⚠️ **WARNING:** If you make a mistake here, Microsoft 365 email could break. Double-check the syntax!

---

### Step 6: Add DMARC Record

DMARC (Domain-based Message Authentication, Reporting & Conformance) tells email providers how to handle unauthenticated emails.

1. Click **Add record**
2. Fill in:

```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100
TTL: Auto
Proxy status: DNS only (gray cloud)
```

3. Click **Save**

**What this does:**
- `v=DMARC1` - DMARC version
- `p=quarantine` - Put unauthenticated emails in spam
- `rua=mailto:dmarc@shotbymizu.co.uk` - Send DMARC reports here
- `pct=100` - Apply policy to 100% of emails

---

### Step 7: Verify All Records in Cloudflare

Before leaving Cloudflare, verify you see:

- [ ] **DKIM CNAME record(s)** from Postmark (1-3 records)
- [ ] **Return-Path CNAME** (pm-bounces or similar)
- [ ] **SPF TXT record (@)** - modified to include `spf.mtasv.net`
- [ ] **DMARC TXT record (_dmarc)**
- [ ] All email records set to "DNS only" (gray cloud, not orange)
- [ ] Existing Microsoft 365 records still present and unchanged

---

## DNS Propagation & Verification

### Wait for Propagation

DNS changes take time to propagate globally:
- **Cloudflare → global:** 5-30 minutes typically
- **Can take up to:** 1-2 hours in rare cases

**Recommended wait:** 15-30 minutes before testing

---

### Verify DNS Records (Command Line)

Open PowerShell or Terminal and run these commands:

#### Check SPF Record
```bash
nslookup -type=txt shotbymizu.co.uk
```

**Expected output includes:**
```
v=spf1 include:outlook.com include:spf.mtasv.net ~all
```

#### Check DKIM Records
```bash
nslookup -type=cname [dkim-hostname]._domainkey.shotbymizu.co.uk
```
Replace `[dkim-hostname]` with the exact name from Postmark (e.g., `20230401`).

**Expected output:**
```
[hostname]._domainkey.shotbymizu.co.uk CNAME [value].dkim.postmarkapp.com
```

#### Check Return-Path
```bash
nslookup -type=cname pm-bounces.shotbymizu.co.uk
```

**Expected output:**
```
pm-bounces.shotbymizu.co.uk CNAME pm.mtasv.net
```

#### Check DMARC Record
```bash
nslookup -type=txt _dmarc.shotbymizu.co.uk
```

**Expected output includes:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100
```

---

### Verify in Postmark Dashboard

1. Go to https://account.postmarkapp.com
2. Navigate to **Sender Signatures**
3. Click on **shotbymizu.co.uk**
4. Check status:
   - **Domain Status:** Verified ✓
   - **DKIM:** Verified ✓
5. If still showing "Unverified", click **Re-verify**

**If verification fails:**
- Wait another 15-30 minutes (DNS may still be propagating)
- Re-check DNS records in Cloudflare
- Verify exact match with Postmark values
- Click "Re-verify" again

---

### Verify Using Online Tools

**MXToolbox** provides excellent DNS checking tools:

1. **SPF Check:** https://mxtoolbox.com/spf.aspx
   - Enter: `shotbymizu.co.uk`
   - Should show both `outlook.com` and `spf.mtasv.net`

2. **DKIM Check:** https://mxtoolbox.com/dkim.aspx
   - Enter: `shotbymizu.co.uk:[selector]`
   - Replace `[selector]` with your DKIM hostname from Postmark

3. **DMARC Check:** https://mxtoolbox.com/dmarc.aspx
   - Enter: `shotbymizu.co.uk`
   - Should show your DMARC policy

4. **Global DNS Propagation:** https://www.whatsmydns.net/
   - Check if records are visible worldwide

---

## Testing Email Delivery

### Test Microsoft 365 Still Works

Before testing Postmark, verify M365 wasn't broken:

1. Send a test email from michael@shotbymizu.co.uk (via Outlook/M365)
2. Send it to yourself or a test account
3. Verify email arrives normally
4. Check email headers for `spf=pass`

**If M365 email fails:**
- Check SPF record syntax in Cloudflare
- Ensure it includes `include:outlook.com`
- Wait 30 minutes for DNS propagation
- If still broken, revert SPF to original: `v=spf1 include:outlook.com ~all`

---

### Test Postmark Sends

Once domain is verified in Postmark:

1. Use your application's test script (see EMAIL_SETUP_GUIDE.md)
2. Send a test email via Postmark
3. Check that email arrives
4. View email headers and verify:
   - `spf=pass`
   - `dkim=pass`
   - Sender is `@shotbymizu.co.uk`

---

## Troubleshooting

### Issue: DKIM Records Not Verifying

**Symptom:** Postmark shows "Unverified" after 1+ hours

**Solution:**
1. Go to Cloudflare → DNS
2. Find DKIM CNAME records you added
3. Verify exact match with Postmark dashboard
4. Check "Proxy status" is "DNS only" (gray cloud)
5. Wait another 30 minutes
6. Click "Re-verify" in Postmark
7. Use https://mxtoolbox.com/dkim.aspx to check global status
8. If still failing, delete and re-add DNS records

---

### Issue: SPF Record Not Updating

**Symptom:** nslookup shows old SPF value

**Solution:**
1. Clear local DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS/Linux
   sudo dscacheutil -flushcache
   ```
2. Wait 30 minutes for propagation
3. Verify in Cloudflare that record was actually saved
4. Use https://mxtoolbox.com/spf.aspx to check global status

---

### Issue: Microsoft 365 Email Broken

**Symptom:** Can't send/receive email via M365 after DNS changes

**Solution:**
1. Check SPF record in Cloudflare
2. Must include: `include:outlook.com`
3. Correct format: `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
4. If syntax error, fix immediately
5. If still broken after 30 min, temporarily revert to:
   ```
   v=spf1 include:outlook.com ~all
   ```
6. This removes Postmark but fixes M365
7. Once M365 works, carefully re-add Postmark

---

### Issue: DNS Changes Not Propagating

**Symptom:** Records don't appear even after hours

**Solution:**
1. Verify records are actually saved in Cloudflare
2. Check for typos in record names/values
3. Ensure "DNS only" (gray cloud) not "Proxied"
4. Wait up to 24 hours (rare but possible)
5. Clear local DNS cache
6. Try different DNS server:
   ```bash
   nslookup -type=txt shotbymizu.co.uk 8.8.8.8
   ```
7. Contact Cloudflare support if records still don't appear

---

### Issue: DMARC Reports Not Arriving

**Symptom:** No DMARC reports emailed

**Solution:**
1. DMARC reports are sent weekly (not immediately)
2. Check spam folder for reports
3. Verify `rua` email address in DMARC record
4. Use https://dmarc.postmarkapp.com/ to monitor
5. Reports typically arrive within 7 days of first email sent

---

## Best Practices

### DO:
- ✅ Use "DNS only" for all email-related records
- ✅ Copy DNS values from Postmark exactly (no typos)
- ✅ Test Microsoft 365 email after SPF changes
- ✅ Wait 30 minutes after DNS changes before testing
- ✅ Use MXToolbox to verify records globally
- ✅ Keep DNS records organized with comments (if Cloudflare allows)

### DON'T:
- ❌ Use "Proxied" (orange cloud) for email records
- ❌ Modify records without noting original values first
- ❌ Delete Microsoft 365 records
- ❌ Add multiple SPF records (only one TXT record can contain SPF)
- ❌ Forget to verify after making changes

---

## Quick Reference

### DNS Records Summary

| Record Type | Name | Content | Proxy Status |
|-------------|------|---------|--------------|
| CNAME | [from Postmark] | [to Postmark] | DNS only |
| CNAME | pm-bounces | pm.mtasv.net | DNS only |
| TXT | @ | v=spf1 include:outlook.com include:spf.mtasv.net ~all | DNS only |
| TXT | _dmarc | v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100 | DNS only |

### Important URLs

- Cloudflare DNS: https://dash.cloudflare.com
- Postmark Dashboard: https://account.postmarkapp.com
- SPF Checker: https://mxtoolbox.com/spf.aspx
- DKIM Checker: https://mxtoolbox.com/dkim.aspx
- DMARC Checker: https://mxtoolbox.com/dmarc.aspx
- DNS Propagation: https://www.whatsmydns.net/

### Verification Commands

```bash
# Check SPF
nslookup -type=txt shotbymizu.co.uk

# Check DKIM (replace [selector] with yours)
nslookup -type=cname [selector]._domainkey.shotbymizu.co.uk

# Check Return-Path
nslookup -type=cname pm-bounces.shotbymizu.co.uk

# Check DMARC
nslookup -type=txt _dmarc.shotbymizu.co.uk

# Clear DNS cache (Windows)
ipconfig /flushdns
```

---

## Checklist

- [ ] Logged into Cloudflare
- [ ] Selected shotbymizu.co.uk domain
- [ ] Got DNS records from Postmark dashboard
- [ ] Added DKIM CNAME record(s) from Postmark
- [ ] Added Return-Path CNAME (pm-bounces)
- [ ] Modified SPF TXT record to include `spf.mtasv.net`
- [ ] Added DMARC TXT record
- [ ] All email records set to "DNS only" (gray cloud)
- [ ] Waited 30 minutes for propagation
- [ ] Verified SPF with nslookup
- [ ] Verified DKIM with nslookup
- [ ] Verified DMARC with nslookup
- [ ] Checked Postmark dashboard shows "Verified"
- [ ] Tested Microsoft 365 email still works
- [ ] Tested Postmark email sending
- [ ] Email headers show `spf=pass` and `dkim=pass`

---

**Document Version:** 1.0 (Postmark)
**Last Updated:** November 5, 2025
**Status:** ✅ Ready to Use
