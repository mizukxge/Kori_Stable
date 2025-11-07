# Amazon SES Email Implementation - Complete Documentation

**Project:** Mizu Studio Photography Platform
**Date:** November 4, 2025
**Your Setup:** Cloudflare DNS + Microsoft 365 Email + Amazon SES
**Email Address:** michael@shotbymizu.co.uk
**AWS Region:** eu-west-2 (Ireland) - CRITICAL REQUIREMENT

---

## 📚 Documentation Overview

Four comprehensive guides have been created for your SES implementation using **domain verification approach**:

### 1. **EMAIL_SETUP_GUIDE.md** (726 lines, ~22 KB)
**Main Reference Guide - Start Here for Technical Details**

Complete AWS SES setup guide covering:
- AWS account creation and IAM user setup
- **Domain verification** for shotbymizu.co.uk
- DKIM token management (3 tokens from AWS)
- SPF/DMARC record setup
- TypeScript SES service implementation
- Email template examples
- Testing procedures
- Production deployment

**Use this for:** Detailed technical implementation and code examples

**AWS Region:** Emphasis on eu-west-2 requirement throughout

---

### 2. **CLOUDFLARE_DNS_SETUP.md** (619 lines, ~17 KB)
**Cloudflare-Specific DNS Configuration**

Detailed instructions for managing DNS records with Cloudflare:
- Current Microsoft 365 DNS structure explanation
- **Adding 3 DKIM CNAME records** (from AWS SES tokens)
- How to modify SPF record to include Amazon SES
- Adding DMARC record for email authentication
- Cloudflare-specific settings (DNS only, proxy status)
- Verification commands (nslookup, dig)
- Troubleshooting DNS issues

**Use this for:** Cloudflare DNS configuration with DKIM CNAME records

**Key Addition:** Complete DKIM CNAME records section (critical for domain verification)

---

### 3. **EMAIL_SETUP_CORRECTIONS.md** (336 lines, ~9 KB)
**Important Corrections and AWS Region Information**

Documents the critical correction made to the setup process:
- Original issue: Email address verification suggested (incorrect approach)
- Root cause: Wrong AWS region selection (eu-north-1 vs eu-west-2)
- **The correction:** Domain verification IS the right approach in eu-west-2
- Why this approach works better
- Regional availability (which regions have which features)
- AWS region switching instructions

**Use this for:** Understanding the AWS region requirement and why domain verification is correct

**Critical Info:** eu-west-2 is REQUIRED for domain verification option

---

### 4. **SES_SETUP_CHECKLIST.md** (582 lines, ~18 KB)
**Step-by-Step Implementation Checklist**

Detailed, actionable checklist with every step spelled out:
- Phase 1: AWS Account Setup (15 min)
- Phase 2: Domain Verification (10 min) - now with domain, not email
- Phase 3: Cloudflare DNS Configuration (20 min) - includes 3 DKIM CNAME records
- Phase 4: DNS Verification (10 min)
- Phase 5: Production Access Request (5 min + 24 hr wait)
- Phase 6: Application Implementation (1-2 hrs)
- Phase 7: Testing & Verification (30 min)
- Success checklist and troubleshooting

**Use this for:** Step-by-step implementation with checkboxes

**Format:** Easy-to-follow checklist with clear checkboxes for each step

---

## 🎯 Quick Start Guide

### For the Impatient (TL;DR)

```
1. Switch to AWS region: eu-west-2 (CRITICAL!)
   → Not eu-north-1 (limited features)

2. Create AWS account & IAM user (15 min)
   → Get AWS Access Key ID and Secret Access Key

3. Verify domain in SES (NOT email address) (10 min)
   → Domain: shotbymizu.co.uk
   → Check: Generate DKIM tokens
   → Copy: 3 DKIM tokens and their CNAME values

4. In Cloudflare:
   - Add 3 DKIM CNAME records (20 min)
     → token1._domainkey → token1.dkim.amazonses.com
     → token2._domainkey → token2.dkim.amazonses.com
     → token3._domainkey → token3.dkim.amazonses.com
   - Modify SPF: v=spf1 include:outlook.com include:amazonses.com ~all
   - Add DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100

5. Verify DNS records propagated (10 min)
   → Use nslookup to confirm all records visible

6. Request production access in AWS SES (5 min, then wait 24 hrs)
   → Use case: "Transactional emails for photography studio"

7. Install SDK & implement in app (1-2 hrs)
   → pnpm add @aws-sdk/client-ses
   → Create ses.ts service
   → Update contract.ts to send emails
   → Add .env variables

8. Test! (30 min)
   → npx tsx src/scripts/test-email.ts
   → Create test contract, send email
   → Verify email arrives + headers show SPF=pass, DKIM=pass
```

**Total time: ~3 hours active work + 24 hour AWS wait**

---

## 📖 How to Use These Documents

### Scenario 1: "Just Tell Me How to Set It Up" (RECOMMENDED)
**Start with:** SES_SETUP_CHECKLIST.md
- Follow the 7 phases step-by-step
- Check off each item as you complete it
- Reference other guides if you need clarification
- Estimate: 3 hours (plus 24-hour AWS wait)

### Scenario 2: "I Need to Understand Everything"
**Read in order:**
1. EMAIL_SETUP_CORRECTIONS.md (understand AWS region issue)
2. EMAIL_SETUP_GUIDE.md (overview & concepts)
3. CLOUDFLARE_DNS_SETUP.md (DNS specifics)
4. SES_SETUP_CHECKLIST.md (implementation steps)

### Scenario 3: "I Need Help with Cloudflare"
**Read:** CLOUDFLARE_DNS_SETUP.md
- Explains Microsoft 365 + SES coexistence
- DKIM CNAME record setup (3 records from AWS)
- SPF record modification
- DMARC setup
- Verification commands
- Troubleshooting

### Scenario 4: "Something Went Wrong"
**Refer to:**
- **Wrong AWS region?** → EMAIL_SETUP_CORRECTIONS.md (section: "How to Switch Regions")
- **DKIM verification slow?** → CLOUDFLARE_DNS_SETUP.md (Troubleshooting section)
- **Email not arriving?** → EMAIL_SETUP_GUIDE.md (Troubleshooting section)
- **Lost track of steps?** → SES_SETUP_CHECKLIST.md (find your phase)

---

## 🔑 Key Points

### Your Current Setup
- **Email Host:** Microsoft 365 (michael@shotbymizu.co.uk)
- **DNS Manager:** Cloudflare
- **Email Service:** Amazon SES (for transactional emails)
- **AWS Region:** Must be eu-west-2 (Ireland)

### What SES Does
- Sends contract signing emails with magic links
- Sends proposal notifications
- Sends resend notifications
- **Does NOT:** Replace Microsoft 365 for normal email

### Critical AWS Region Requirement
**MUST USE: eu-west-2 (Ireland)**
- Domain verification option appears only in eu-west-2
- eu-north-1 (Stockholm) has limited features
- Wrong region will cause: "Only Email Address verification available"

### DNS Records You'll Add

**Add (3 records):**
```
DKIM Records (from AWS SES tokens):
- token1._domainkey.shotbymizu.co.uk → token1.dkim.amazonses.com
- token2._domainkey.shotbymizu.co.uk → token2.dkim.amazonses.com
- token3._domainkey.shotbymizu.co.uk → token3.dkim.amazonses.com
```

**Modify (1 record):**
```
SPF Record @ domain:
Old: v=spf1 include:outlook.com ~all
New: v=spf1 include:outlook.com include:amazonses.com ~all
```

**Add (1 record):**
```
DMARC Record @ _dmarc subdomain:
v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100
```

**Keep (Don't touch):**
- All Microsoft 365 records (MX, CNAME, etc.)

### Important Security Points

⚠️ **Never:**
- Commit AWS credentials to Git
- Share access keys publicly
- Use root AWS account (use IAM user)
- Include .env file in version control
- Use wrong AWS region (must be eu-west-2)

✅ **Always:**
- Store credentials in password manager
- Use environment variables for sensitive data
- Rotate credentials periodically
- Monitor AWS billing
- Use eu-west-2 region for SES

---

## 📋 Document Contents Summary

| Document | Purpose | Format | Key Sections |
|----------|---------|--------|--------------|
| EMAIL_SETUP_GUIDE.md | Technical implementation | Detailed guide | Setup, Config, Code, Templates, Testing |
| CLOUDFLARE_DNS_SETUP.md | DNS configuration | Step-by-step | DNS structure, DKIM CNAME, SPF, DMARC |
| EMAIL_SETUP_CORRECTIONS.md | AWS region & approach | Corrections | Region info, Why domain verification, Differences |
| SES_SETUP_CHECKLIST.md | Implementation tracking | Checklist | 7 phases with checkboxes, troubleshooting |

**Total Documentation:** ~1,900 lines, ~66 KB of guides

---

## 🚀 Implementation Timeline

### Day 1: Setup Phase (Active Time)
- Phase 1: AWS Setup - 15 min
- Phase 2: Domain Verification - 10 min
- Phase 3: Cloudflare DNS - 20 min (includes 3 DKIM CNAME records)
- Phase 4: DNS Verification - 10 min
- **Subtotal: 55 minutes**

### Day 1: Waiting Phase
- Phase 5: Production Access Request - 5 min (then wait 24 hrs)
- ⏳ **Wait for AWS approval - 24 hours**

### Day 2: Implementation Phase
- Phase 6: Code Implementation - 1-2 hours
- Phase 7: Testing - 30 min
- **Subtotal: 1.5-2.5 hours**

### Total Timeline
- **Active work:** ~2.5 hours
- **Total clock time:** ~27 hours (mostly AWS processing)

---

## 📊 Cost Breakdown

### AWS SES Pricing
- **Email sending:** $0.10 per 1,000 emails
- **24-hour quota:** 50,000 emails/day (after production approval)
- **Estimated monthly cost:** <$10 for typical volumes
- **First 12 months:** 62,000 emails/month free (AWS free tier)

### Comparison with Alternatives
| Service | Price | Notes |
|---------|-------|-------|
| Amazon SES | $0.10/1k | Pay-as-you-go, no minimum ✓ |
| AWS free tier | Free* | 62,000 emails/month free for first 12 months |
| Mailgun | $19/month | Minimum monthly charge |
| SendGrid | $29/month | Minimum monthly charge |

**SES is most cost-effective for low to medium volumes**

---

## ✨ What You'll Have After Implementation

### Architecture
```
Your App
    ↓
Contract/Proposal Created
    ↓
Calls sendEmail() via SES service
    ↓
Amazon SES (AWS) - eu-west-2
    ↓
SMTP → Client Email (Gmail, Outlook, etc.)
    ↓
Email passes DKIM/SPF/DMARC authentication
```

### Features Enabled
- ✅ Contract signing emails with magic links
- ✅ Proposal notification emails
- ✅ Resend contract functionality
- ✅ Professional HTML + plain text emails
- ✅ DKIM/SPF/DMARC authentication (inbox delivery)
- ✅ Bounce/complaint tracking
- ✅ Production-grade email delivery

### Integration Points
- ✅ sendContract() method sends email
- ✅ resendContract() method sends email
- ✅ Contract signing links include expiry (72 hours)
- ✅ DMARC reports email to michael@shotbymizu.co.uk
- ✅ SES dashboard shows delivery metrics

---

## 🔗 Navigation Guide

### If You Want To...

**Understand the overall process**
→ Read this README.md file ✓

**Learn about AWS region requirement**
→ Read EMAIL_SETUP_CORRECTIONS.md "AWS Region Information"

**Learn SES concepts and implementation**
→ Read EMAIL_SETUP_GUIDE.md sections 1-3

**Configure Cloudflare DNS with DKIM**
→ Read CLOUDFLARE_DNS_SETUP.md "DKIM CNAME Records Setup"

**Follow step-by-step implementation**
→ Follow SES_SETUP_CHECKLIST.md phases 1-7 ⭐ RECOMMENDED

**Find TypeScript code examples**
→ Read EMAIL_SETUP_GUIDE.md "Application Configuration" section

**Troubleshoot DNS issues**
→ CLOUDFLARE_DNS_SETUP.md "Troubleshooting"

**Troubleshoot SES issues**
→ EMAIL_SETUP_GUIDE.md "Troubleshooting"

**Understand AWS region error**
→ EMAIL_SETUP_CORRECTIONS.md "Critical AWS Region Information"

---

## 💡 Pro Tips

### 1. Bookmark Important URLs
- AWS SES Console: https://console.aws.amazon.com/sesv2
- Cloudflare Dashboard: https://dash.cloudflare.com
- SPF/DKIM/DMARC Checker: https://mxtoolbox.com/
- Global DNS Propagation: https://www.whatsmydns.net/

### 2. Verify Your Region FIRST
Before doing anything in AWS:
1. Top right corner of AWS console
2. Check region: Should be **eu-west-2**
3. If not: Click dropdown and change to eu-west-2
4. This is CRITICAL for domain verification to appear

### 3. Save DKIM Tokens Immediately
When you create domain identity in SES:
1. You'll get 3 DKIM tokens
2. Copy ALL 6 values (token names + CNAME targets)
3. Paste into text file for easy Cloudflare entry
4. Don't close the AWS console until you copy them

### 4. Use Password Manager
Store these securely:
- AWS Access Key ID
- AWS Secret Access Key
- AWS Account ID
- Cloudflare API Token (if using)

### 5. Test Before Production
- Always test email sending with test script
- Send to yourself first
- Check email headers
- Monitor SES dashboard
- Then send to real clients

### 6. Monitor SES Metrics
After implementation, check weekly:
- Bounce rate (should be <5%)
- Complaint rate (should be <0.1%)
- Sending quota usage
- Any delivery issues

---

## 🆘 Getting Help

### If You're Stuck

**AWS region wrong (eu-north-1 vs eu-west-2)?**
1. Read EMAIL_SETUP_CORRECTIONS.md "How to Switch Regions"
2. Go to AWS console top right
3. Switch to eu-west-2
4. DKIM records should now be available

**DKIM Records Not Verifying?**
1. Check CLOUDFLARE_DNS_SETUP.md troubleshooting
2. Verify records in Cloudflare dashboard
3. Use https://mxtoolbox.com/dkim.aspx to check global status
4. Wait up to 2 hours (AWS checks periodically)

**Email Not Sending?**
1. Check EMAIL_SETUP_GUIDE.md troubleshooting
2. Verify credentials in .env file
3. Check AWS SES dashboard for errors
4. Look for bounce/complaint notifications

**Production Access Denied?**
1. Review your application use case
2. Be specific: "transactional emails for contracts"
3. Contact AWS Support with more details
4. Usually approved on second request

**Microsoft 365 Email Broken?**
1. Check SPF record is exactly: `v=spf1 include:outlook.com include:amazonses.com ~all`
2. Verify other M365 records unchanged
3. Wait 30 min for DNS propagation
4. If still broken, revert SPF to: `v=spf1 include:outlook.com ~all`

---

## ✅ Completion Checklist

You're done when you can check all these:

- [ ] AWS region switched to eu-west-2 ⭐ DO THIS FIRST
- [ ] AWS SES account created
- [ ] IAM user created (mizu-ses-user)
- [ ] Access keys saved securely
- [ ] Domain verified in SES (shotbymizu.co.uk, not email address)
- [ ] Status shows "Verified" in SES console
- [ ] DKIM status shows "Verified" for all 3 tokens
- [ ] 3 DKIM CNAME records added to Cloudflare
- [ ] SPF record modified in Cloudflare
- [ ] DMARC record added in Cloudflare
- [ ] DNS propagated globally (verified with nslookup)
- [ ] M365 email still works
- [ ] Production access requested in SES
- [ ] Production access approved by AWS (24 hr wait)
- [ ] AWS SDK installed: `pnpm add @aws-sdk/client-ses`
- [ ] SES service created (ses.ts)
- [ ] Contract service updated with emails
- [ ] Environment variables set (.env)
- [ ] Test email script runs successfully
- [ ] Test email arrives in inbox
- [ ] Email headers show SPF=pass, DKIM=pass
- [ ] SES dashboard shows metrics
- [ ] No bounces or errors

**Once all checked: You're ready to send contracts via email!**

---

## 📞 Quick Reference

### Command Line Tools
```bash
# Check SPF record (should include amazonses.com)
nslookup -type=txt shotbymizu.co.uk

# Check DKIM records (all 3 tokens)
nslookup -type=cname token1._domainkey.shotbymizu.co.uk
nslookup -type=cname token2._domainkey.shotbymizu.co.uk
nslookup -type=cname token3._domainkey.shotbymizu.co.uk

# Check DMARC record
nslookup -type=txt _dmarc.shotbymizu.co.uk

# Run test email
npx tsx src/scripts/test-email.ts

# Install AWS SDK
pnpm add @aws-sdk/client-ses
```

### Important File Locations
```
apps/api/src/services/ses.ts          # SES service (create)
apps/api/src/services/contract.ts     # Update for emails
apps/api/.env                          # Add AWS credentials
apps/api/src/scripts/test-email.ts    # Create for testing
```

### Important URLs
```
https://console.aws.amazon.com/sesv2      # AWS SES Console (eu-west-2)
https://dash.cloudflare.com               # Cloudflare Dashboard
https://mxtoolbox.com/spf.aspx            # SPF Checker
https://mxtoolbox.com/dkim.aspx           # DKIM Checker
https://mxtoolbox.com/dmarc.aspx          # DMARC Checker
https://www.whatsmydns.net/               # Global DNS Propagation
```

---

## 🎓 Learning Resources

### Amazon SES Documentation
- https://docs.aws.amazon.com/ses/latest/dg/

### Cloudflare DNS Documentation
- https://developers.cloudflare.com/dns/

### Email Authentication Information
- https://www.dmarcian.com/spf/
- https://www.dmarcian.com/dkim/
- https://www.dmarcian.com/dmarc/

### Email Best Practices
- https://www.mailgun.com/blog/email/email-authentication-101/

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------
| 1.0 | Nov 4, 2025 | Initial email address verification guides (incorrect) |
| 1.1 | Nov 4, 2025 | Identified AWS region as root cause of limitation |
| 2.0 | Nov 4, 2025 | Reverted to domain verification + Added AWS region emphasis |

---

## 🎯 Next Steps

**Right Now:**
1. Read EMAIL_SETUP_CORRECTIONS.md (understand AWS region issue)
2. Skim through each guide to understand structure
3. **Switch AWS region to eu-west-2** (CRITICAL)

**Next:**
1. Follow SES_SETUP_CHECKLIST.md Phase 1-4 (today) - 1 hour
2. Request production access Phase 5 (wait overnight) - 24 hours
3. Follow Phase 6-7 once approved (next day) - 2 hours

**Then:**
1. Implement email sending in contracts
2. Test with real clients
3. Monitor SES metrics
4. Celebrate! 🎉

---

## 🔑 Critical Remember

**⭐ MOST IMPORTANT: Use AWS Region eu-west-2**

If you only remember one thing: **The AWS region must be eu-west-2 (Ireland) for domain verification to work.** If you're in eu-north-1 (Stockholm), you'll only see email address verification option, which is not what we want.

All other issues stem from this one region selection mistake.

---

**Status:** ✅ Documentation Complete | Ready to Implement

**Questions?** Refer to the appropriate guide document listed above.

**Ready?** Start with: **EMAIL_SETUP_CORRECTIONS.md** → **SES_SETUP_CHECKLIST.md**

---

**Document Version:** 2.0
**Last Updated:** November 4, 2025
**Project:** Mizu Studio Photography Platform
**Setup:** Domain Verification in eu-west-2 with Cloudflare DNS + Microsoft 365
