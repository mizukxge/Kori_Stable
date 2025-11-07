# Email Setup Guide - Corrections & Important Notes

**Date:** November 4, 2025
**Status:** ✅ Updated
**Critical Issue:** AWS Region Selection

---

## Summary of Corrections

### The Issue
Initial setup documentation incorrectly suggested using **email address verification** instead of **domain verification** for Amazon SES.

### Root Cause Found
The user was on **eu-north-1 (Stockholm)** region instead of **eu-west-2 (Ireland)**. The eu-north-1 region has limited SES features available, which is why only the "Email Address" verification option was visible.

### The Correction
**Domain verification IS available and IS the correct approach** - but only in the correct AWS region (eu-west-2).

---

## Critical AWS Region Information

### ⚠️ MUST USE: eu-west-2 (Ireland)

**Why eu-west-2?**
- Domain verification option is available
- Full DKIM token support (3 CNAME records)
- Better email deliverability
- Recommended region for European users

**Why NOT eu-north-1 (Stockholm)?**
- Limited SES feature set
- Only email address verification available (not domain)
- Missing DKIM support in some configurations
- Will confuse setup process

### How to Switch Regions

1. Go to AWS Console: https://console.aws.amazon.com
2. Top right corner: Click region dropdown (currently shows your region)
3. Scroll and find: **Europe (Ireland) eu-west-2**
4. Click to select
5. Refresh page
6. Go back to SES Console
7. Now domain verification option should appear

---

## What Was Wrong in Initial Documentation

### Originally Suggested (INCORRECT)
```
Approach: Email Address Verification
- Verify: michael@shotbymizu.co.uk
- No DKIM tokens needed
- Simple but limited
```

### The Problem
This approach was suggested because:
1. User was in wrong AWS region (eu-north-1)
2. Email address verification was the only visible option
3. Domain verification option didn't appear in that region's console

### Now Recommended (CORRECT)
```
Approach: Domain Verification
- Verify: shotbymizu.co.uk (the domain)
- 3 DKIM tokens provided by AWS
- Full email authentication
- Better deliverability
- Scales to high volumes
```

---

## What Actually Works

### Correct Flow (Domain Verification)

1. **Create AWS account** (any region)
2. **Switch to eu-west-2 region** ⭐ CRITICAL STEP
3. **Go to AWS SES Console**
4. **Click "Create Identity"**
5. **Select "Domain"** (this option NOW appears in eu-west-2)
6. **Enter:** shotbymizu.co.uk
7. **Check:** "Generate DKIM tokens"
8. **Get 3 DKIM tokens** from AWS
9. **Add 3 DKIM CNAME records to Cloudflare**
10. **Modify SPF record** (add amazonses.com)
11. **Add DMARC record** (optional)
12. **Wait for DKIM verification** (15-30 minutes)
13. **Request production access** (24 hour wait)
14. **Implement in code**
15. **Test and deploy**

This is the approach documented in all the setup guides.

---

## Updated Documentation Status

All setup guides have been **REVERTED to domain verification approach**:

### 1. EMAIL_SETUP_GUIDE.md ✅
- **Status:** Reverted to domain verification
- **Key change:** Step 2 now uses domain verification (not email address)
- **DKIM tokens:** 3 tokens from AWS for Cloudflare
- **DMARC:** Full authentication setup
- **AWS Region Note:** Emphasizes eu-west-2 requirement

### 2. CLOUDFLARE_DNS_SETUP.md ✅
- **Status:** Updated to include DKIM CNAME records
- **New section:** "DKIM CNAME Records Setup" (Step 3.2-3.4)
- **Key additions:** 3 DKIM CNAME records must be added
- **SPF modification:** Still includes amazonses.com
- **DMARC:** Still recommended

### 3. SES_SETUP_CHECKLIST.md ✅
- **Status:** Complete rewrite with domain verification phases
- **Phase 2:** Domain verification (not email address)
- **Phase 3:** Add 3 DKIM CNAME records
- **Phase 4:** Verify DNS propagation including DKIM
- **Checklist format:** Easy to follow step-by-step

### 4. AMAZON_SES_IMPLEMENTATION_README.md ✅
- **Status:** Master guide updated
- **Navigation:** Points to all 3 guides above
- **Quick start:** Reflects domain verification
- **AWS Region:** Explicitly mentions eu-west-2 requirement

---

## Key Differences: Email vs Domain Verification

### Email Address Verification (Wrong Approach)
```
✗ Only sends from verified email address
✗ Limited authentication options
✗ Harder to scale
✗ Less professional
✗ Not recommended for production
✗ Only available in some AWS regions
```

**Example:** michael@shotbymizu.co.uk only

### Domain Verification (Correct Approach) ✅
```
✓ Sends from any address at your domain
✓ Full DKIM/SPF/DMARC support
✓ Professional authentication
✓ Scales to unlimited sending
✓ Production-ready
✓ Available in eu-west-2
```

**Example:** michael@shotbymizu.co.uk, contracts@shotbymizu.co.uk, etc.

---

## Why Domain Verification Is Better

### 1. Flexibility
- Send from any email address @shotbymizu.co.uk
- No need to verify each individual address
- Can add new addresses anytime

### 2. Authentication
- 3 DKIM tokens for maximum security
- SPF record covers entire domain
- DMARC policy for email providers
- Much better inbox delivery

### 3. Scalability
- Can send to unlimited recipients (after production approval)
- No per-address limits
- Enterprise-grade setup

### 4. Professionalism
- Proper email authentication headers
- Shows DKIM/SPF/DMARC pass in email headers
- Builds domain reputation

---

## Regional Availability Note

### SES Feature Availability by Region

**eu-west-2 (Ireland) - ✅ RECOMMENDED**
- Domain verification: ✓
- DKIM tokens: ✓
- Email address verification: ✓
- Full feature set
- Recommended for European users

**eu-north-1 (Stockholm) - ⚠️ AVOID**
- Domain verification: ✗ (May not appear)
- DKIM tokens: ✗ (Not available)
- Email address verification: ✓ (Only option)
- Limited features
- Will cause confusion

**us-east-1 (N. Virginia) - ✓ Works**
- Domain verification: ✓
- DKIM tokens: ✓
- Full feature set
- But not recommended for UK users

---

## What You Should Do Now

### If You Haven't Started SES Setup Yet
1. Follow the guides in this order:
   - Start with SES_SETUP_CHECKLIST.md (step-by-step)
   - Reference EMAIL_SETUP_GUIDE.md (detailed explanations)
   - Use CLOUDFLARE_DNS_SETUP.md (DNS-specific steps)
2. **CRITICAL:** Use eu-west-2 region
3. **CRITICAL:** Select "Domain" verification (not email address)

### If You Already Started with Email Address Verification
1. You can either:
   - **Option A:** Continue with email address verification (works, but limited)
   - **Option B:** Start over with domain verification (recommended, better)
2. Both approaches work with Microsoft 365
3. Domain verification is more professional

### If You're Stuck on Wrong Region
1. Go to AWS Console
2. Top right: Change region to eu-west-2
3. Go back to SES Console
4. Now "Domain" option should appear
5. Continue with domain verification

---

## Testing the Correct Approach

Once you've verified your domain (shotbymizu.co.uk) in eu-west-2:

```bash
# Check DKIM records are in place
nslookup -type=cname token1._domainkey.shotbymizu.co.uk
nslookup -type=cname token2._domainkey.shotbymizu.co.uk
nslookup -type=cname token3._domainkey.shotbymizu.co.uk

# Check SPF record includes SES
nslookup -type=txt shotbymizu.co.uk
# Should show: v=spf1 include:outlook.com include:amazonses.com ~all

# Check DMARC record
nslookup -type=txt _dmarc.shotbymizu.co.uk

# Test email sending
npx tsx src/scripts/test-email.ts

# Verify in AWS SES console
# Domain should show: Verified ✓
# DKIM should show: Verified ✓ for all 3 tokens
```

---

## Summary of Changes

### What Was Wrong
- Initial guides suggested email address verification
- This was due to wrong AWS region selection (eu-north-1)
- Caused confusion and limited functionality

### What Was Fixed
- All guides reverted to domain verification approach
- DKIM CNAME records re-added to Cloudflare setup
- AWS region requirement emphasized throughout
- Step-by-step checklist clarified

### What Now Works
- Domain verification in eu-west-2
- 3 DKIM tokens for authentication
- Professional DKIM/SPF/DMARC setup
- Full production email capability
- Can send from any address @shotbymizu.co.uk

---

## Important Notes for Future Reference

### ⚠️ Critical Points
1. **Always use eu-west-2 region for SES**
2. **Select Domain verification** (not email address)
3. **Generate DKIM tokens** during domain creation
4. **Add all 3 DKIM CNAME records** to Cloudflare
5. **Modify SPF** to include amazonses.com
6. **Add DMARC** for email authentication

### ✅ Best Practices
1. Store AWS credentials securely (not in Git)
2. Test with your own email first
3. Monitor SES dashboard for metrics
4. Check email headers for authentication
5. Wait for production approval before scaling

### 📚 Reference Documents
- **EMAIL_SETUP_GUIDE.md** - Technical implementation details
- **CLOUDFLARE_DNS_SETUP.md** - Cloudflare-specific DNS instructions
- **SES_SETUP_CHECKLIST.md** - Step-by-step checklist format
- **AMAZON_SES_IMPLEMENTATION_README.md** - Master guide and navigation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 4, 2025 | Initial email address verification (incorrect) |
| 1.1 | Nov 4, 2025 | Identified AWS region as root cause |
| 2.0 | Nov 4, 2025 | Reverted all guides to domain verification (correct) |

---

## Conclusion

**The original solution using domain verification WAS CORRECT.** The issue was simply being on the wrong AWS region (eu-north-1 instead of eu-west-2). Once you switch to eu-west-2, everything works as expected with domain verification.

All setup guides have been updated to reflect the correct approach with emphasis on the critical AWS region requirement.

**Follow the guides and you'll be up and running in about 2 hours (plus 24-hour wait for AWS approval).**

---

**Document Version:** 2.0
**Last Updated:** November 4, 2025
**Status:** ✅ All Corrections Applied
