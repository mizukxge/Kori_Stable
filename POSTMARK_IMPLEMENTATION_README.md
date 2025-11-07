# Postmark Email Implementation - Complete Documentation

**Project:** Mizu Studio Photography Platform
**Date:** November 5, 2025
**Email Provider:** Postmark (https://postmarkapp.com)
**Primary Email:** michael@shotbymizu.co.uk (Microsoft 365)

---

## 📚 Documentation Overview

Three comprehensive guides have been created for your Postmark implementation using **domain verification approach**:

### 1. **EMAIL_SETUP_GUIDE.md** (Complete Technical Guide)
**Main Reference Guide - Start Here for Technical Details**

Complete Postmark setup guide covering:
- Postmark account creation and setup
- **Domain verification** for shotbymizu.co.uk
- DKIM token management (automatic configuration)
- SPF/DMARC record setup
- TypeScript Postmark service implementation
- Email template examples
- Testing procedures
- Production deployment

**Use this for:** Detailed technical implementation and code examples

---

### 2. **CLOUDFLARE_DNS_SETUP.md**
**Cloudflare-Specific DNS Configuration**

Detailed instructions for managing DNS records with Cloudflare:
- Current Microsoft 365 DNS structure explanation
- **Adding DKIM CNAME records** (from Postmark)
- How to modify SPF record to include Postmark
- Adding DMARC record for email authentication
- Cloudflare-specific settings (DNS only, proxy status)
- Verification commands (nslookup, dig)
- Troubleshooting DNS issues

**Use this for:** Cloudflare DNS configuration with DKIM CNAME records

---

### 3. **POSTMARK_SETUP_CHECKLIST.md**
**Step-by-Step Implementation Checklist**

Detailed, actionable checklist with every step spelled out:
- Phase 1: Postmark Account Setup (10 min)
- Phase 2: Domain Verification (10 min)
- Phase 3: Cloudflare DNS Configuration (15 min)
- Phase 4: DNS Verification (10 min)
- Phase 5: Application Implementation (1-2 hrs)
- Phase 6: Testing & Verification (30 min)
- Success checklist and troubleshooting

**Use this for:** Step-by-step implementation with checkboxes

**Format:** Easy-to-follow checklist with clear checkboxes for each step

---

## 🎯 Quick Start Guide

### For the Impatient (TL;DR)

```
1. Create Postmark account (10 min)
   → Sign up at https://postmarkapp.com
   → Free tier: 100 emails/month
   → Paid: $15/month for 10,000 emails

2. Add Sender Signature (10 min)
   → Add domain: shotbymizu.co.uk
   → Copy DKIM records from Postmark dashboard
   → Postmark automatically generates records

3. In Cloudflare:
   - Add DKIM records from Postmark (15 min)
     → Postmark provides exact records to add
   - Modify SPF: v=spf1 include:outlook.com include:spf.mtasv.net ~all
   - Add DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@shotbymizu.co.uk; pct=100

4. Verify DNS records propagated (10 min)
   → Use nslookup to confirm all records visible
   → Check Postmark dashboard for verification status

5. Install SDK & implement in app (1-2 hrs)
   → pnpm add postmark
   → Update services/ses.ts to use Postmark
   → Update contracts.ts to send emails
   → Add .env variables

6. Test! (30 min)
   → npx tsx src/scripts/test-email.ts
   → Create test contract, send email
   → Verify email arrives + headers show SPF=pass, DKIM=pass
```

**Total time: ~2.5 hours active work (no waiting for approval!)**

---

## 📖 How to Use These Documents

### Scenario 1: "Just Tell Me How to Set It Up" (RECOMMENDED)
**Start with:** POSTMARK_SETUP_CHECKLIST.md
- Follow the 6 phases step-by-step
- Check off each item as you complete it
- Reference other guides if you need clarification
- Estimate: 2.5 hours (no waiting!)

### Scenario 2: "I Need to Understand Everything"
**Read in order:**
1. EMAIL_SETUP_GUIDE.md (overview & concepts)
2. CLOUDFLARE_DNS_SETUP.md (DNS specifics)
3. POSTMARK_SETUP_CHECKLIST.md (implementation steps)

### Scenario 3: "I Need Help with Cloudflare"
**Read:** CLOUDFLARE_DNS_SETUP.md
- Explains Microsoft 365 + Postmark coexistence
- DKIM CNAME record setup (from Postmark)
- SPF record modification
- DMARC setup
- Verification commands
- Troubleshooting

### Scenario 4: "Something Went Wrong"
**Refer to:**
- **DKIM verification slow?** → CLOUDFLARE_DNS_SETUP.md (Troubleshooting section)
- **Email not arriving?** → EMAIL_SETUP_GUIDE.md (Troubleshooting section)
- **Lost track of steps?** → POSTMARK_SETUP_CHECKLIST.md (find your phase)

---

## 🔑 Key Points

### Your Current Setup
- **Email Host:** Microsoft 365 (michael@shotbymizu.co.uk)
- **DNS Manager:** Cloudflare
- **Email Service:** Postmark (for transactional emails)

### What Postmark Does
- Sends contract signing emails with magic links
- Sends proposal notifications
- Sends resend notifications
- **Does NOT:** Replace Microsoft 365 for normal email

### Why Postmark vs Amazon SES

**Advantages of Postmark:**
- ✅ No production access approval needed (immediate use)
- ✅ Simpler setup (no AWS IAM, regions, complex permissions)
- ✅ Automatic DKIM configuration
- ✅ Better deliverability rates (99%+)
- ✅ Built-in bounce/spam handling
- ✅ Beautiful analytics dashboard
- ✅ Excellent documentation and support
- ✅ No sandbox mode restrictions
- ✅ Templates built-in with versioning
- ✅ Webhooks for real-time events

**Pricing:**
- Free tier: 100 emails/month (perfect for testing)
- Paid: $15/month for 10,000 emails
- Additional: $1.25 per 1,000 emails

**Comparison with SES:**
| Feature | Postmark | Amazon SES |
|---------|----------|------------|
| Price (10k emails) | $15/month | $1/month |
| Setup time | 2.5 hours | 3 hours + 24hr wait |
| Production approval | None needed | Required (24hr) |
| Deliverability | 99%+ | 95%+ |
| Dashboard | Excellent | Basic |
| Support | Great | Limited |
| Complexity | Low | High |

**Recommendation:** Postmark is ideal for transactional emails with low-medium volume where deliverability and ease of use matter more than cost.

### DNS Records You'll Add

**Add (DKIM records from Postmark):**
```
Postmark provides exact records - typically:
- DKIM records (varies, Postmark auto-generates)
```

**Modify (1 record):**
```
SPF Record @ domain:
Old: v=spf1 include:outlook.com ~all
New: v=spf1 include:outlook.com include:spf.mtasv.net ~all
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
- Commit Postmark API tokens to Git
- Share API tokens publicly
- Include .env file in version control

✅ **Always:**
- Store credentials in password manager
- Use environment variables for sensitive data
- Rotate credentials periodically
- Monitor Postmark activity dashboard

---

## 📋 Document Contents Summary

| Document | Purpose | Format | Key Sections |
|----------|---------|--------|--------------|
| EMAIL_SETUP_GUIDE.md | Technical implementation | Detailed guide | Setup, Config, Code, Templates, Testing |
| CLOUDFLARE_DNS_SETUP.md | DNS configuration | Step-by-step | DNS structure, DKIM, SPF, DMARC |
| POSTMARK_SETUP_CHECKLIST.md | Implementation tracking | Checklist | 6 phases with checkboxes, troubleshooting |

---

## 🚀 Implementation Timeline

### Day 1: Complete Setup (Active Time)
- Phase 1: Postmark Account - 10 min
- Phase 2: Domain Verification - 10 min
- Phase 3: Cloudflare DNS - 15 min
- Phase 4: DNS Verification - 10 min
- **Subtotal: 45 minutes**

### Day 1: Implementation Phase
- Phase 5: Code Implementation - 1-2 hours
- Phase 6: Testing - 30 min
- **Subtotal: 1.5-2.5 hours**

### Total Timeline
- **Active work:** ~2.5 hours
- **Total clock time:** ~2.5 hours (no waiting!)

---

## 📊 Cost Breakdown

### Postmark Pricing
- **Free tier:** 100 emails/month (great for testing)
- **Starter:** $15/month for 10,000 emails
- **Additional emails:** $1.25 per 1,000 emails
- **No hidden fees:** No setup fees, no minimum

### Typical Monthly Cost for Photography Studio
- Low volume (200 emails/month): $15/month
- Medium volume (1,000 emails/month): $15/month
- High volume (5,000 emails/month): $15/month
- Very high (15,000 emails/month): $21.25/month

**Extremely predictable and transparent pricing**

---

## ✨ What You'll Have After Implementation

### Architecture
```
Your App
    ↓
Contract/Proposal Created
    ↓
Calls sendEmail() via Postmark service
    ↓
Postmark API
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
- ✅ Automatic bounce/complaint tracking
- ✅ Real-time delivery webhooks
- ✅ Email analytics dashboard
- ✅ Template management with versioning
- ✅ Production-grade email delivery

### Integration Points
- ✅ sendContract() method sends email
- ✅ resendContract() method sends email
- ✅ Contract signing links include expiry (72 hours)
- ✅ DMARC reports email to michael@shotbymizu.co.uk
- ✅ Postmark dashboard shows delivery metrics
- ✅ Webhook notifications for bounces/opens

---

## 🔗 Navigation Guide

### If You Want To...

**Understand the overall process**
→ Read this README.md file ✓

**Learn Postmark concepts and implementation**
→ Read EMAIL_SETUP_GUIDE.md sections 1-3

**Configure Cloudflare DNS**
→ Read CLOUDFLARE_DNS_SETUP.md

**Follow step-by-step implementation**
→ Follow POSTMARK_SETUP_CHECKLIST.md phases 1-6 ⭐ RECOMMENDED

**Find TypeScript code examples**
→ Read EMAIL_SETUP_GUIDE.md "Application Configuration" section

**Troubleshoot DNS issues**
→ CLOUDFLARE_DNS_SETUP.md "Troubleshooting"

**Troubleshoot Postmark issues**
→ EMAIL_SETUP_GUIDE.md "Troubleshooting"

---

## 💡 Pro Tips

### 1. Bookmark Important URLs
- Postmark Dashboard: https://account.postmarkapp.com
- Postmark API Docs: https://postmarkapp.com/developer
- Cloudflare Dashboard: https://dash.cloudflare.com
- SPF/DKIM/DMARC Checker: https://mxtoolbox.com/
- Global DNS Propagation: https://www.whatsmydns.net/

### 2. Save DKIM Records Immediately
When you add domain in Postmark:
1. Postmark shows exact DNS records to add
2. Copy ALL records exactly as shown
3. Paste into text file for easy Cloudflare entry
4. Don't close Postmark dashboard until you copy them

### 3. Use Password Manager
Store these securely:
- Postmark Server API Token
- Postmark Account API Token (if using)
- Cloudflare API Token (if using)

### 4. Test Before Production
- Always test email sending with test script
- Send to yourself first
- Check email headers
- Monitor Postmark dashboard
- Then send to real clients

### 5. Monitor Postmark Metrics
After implementation, check weekly:
- Bounce rate (should be <5%)
- Spam complaint rate (should be <0.1%)
- Open rates (if tracking enabled)
- Any delivery issues

---

## 🆘 Getting Help

### If You're Stuck

**DKIM Records Not Verifying?**
1. Check CLOUDFLARE_DNS_SETUP.md troubleshooting
2. Verify records in Cloudflare dashboard match Postmark exactly
3. Use https://mxtoolbox.com/dkim.aspx to check global status
4. Wait up to 1 hour (Postmark checks periodically)

**Email Not Sending?**
1. Check EMAIL_SETUP_GUIDE.md troubleshooting
2. Verify API token in .env file
3. Check Postmark activity log for errors
4. Look for bounce/complaint notifications

**Microsoft 365 Email Broken?**
1. Check SPF record is exactly: `v=spf1 include:outlook.com include:spf.mtasv.net ~all`
2. Verify other M365 records unchanged
3. Wait 30 min for DNS propagation
4. If still broken, revert SPF to: `v=spf1 include:outlook.com ~all`

---

## ✅ Completion Checklist

You're done when you can check all these:

- [ ] Postmark account created
- [ ] Sender Signature added for shotbymizu.co.uk
- [ ] DKIM records copied from Postmark
- [ ] DKIM records added to Cloudflare
- [ ] SPF record modified in Cloudflare
- [ ] DMARC record added in Cloudflare
- [ ] DNS propagated globally (verified with nslookup)
- [ ] Postmark shows domain verified ✓
- [ ] M365 email still works
- [ ] Postmark SDK installed: `pnpm add postmark`
- [ ] Email service updated (ses.ts → uses Postmark)
- [ ] Environment variables set (.env)
- [ ] Test email script runs successfully
- [ ] Test email arrives in inbox
- [ ] Email headers show SPF=pass, DKIM=pass
- [ ] Postmark dashboard shows activity
- [ ] No bounces or errors

**Once all checked: You're ready to send contracts via email!**

---

## 📞 Quick Reference

### Command Line Tools
```bash
# Check SPF record (should include spf.mtasv.net)
nslookup -type=txt shotbymizu.co.uk

# Check DKIM records (as shown by Postmark)
nslookup -type=cname [dkim-record]._domainkey.shotbymizu.co.uk

# Check DMARC record
nslookup -type=txt _dmarc.shotbymizu.co.uk

# Run test email
npx tsx src/scripts/test-email.ts

# Install Postmark SDK
pnpm add postmark
```

### Important File Locations
```
apps/api/src/services/ses.ts          # Email service (update for Postmark)
apps/api/src/services/contract.ts     # Update for emails
apps/api/.env                          # Add Postmark credentials
apps/api/src/scripts/test-email.ts    # Update for testing
```

### Important URLs
```
https://account.postmarkapp.com               # Postmark Dashboard
https://postmarkapp.com/developer            # API Documentation
https://dash.cloudflare.com                  # Cloudflare Dashboard
https://mxtoolbox.com/spf.aspx               # SPF Checker
https://mxtoolbox.com/dkim.aspx              # DKIM Checker
https://mxtoolbox.com/dmarc.aspx             # DMARC Checker
https://www.whatsmydns.net/                  # Global DNS Propagation
```

---

## 🎓 Learning Resources

### Postmark Documentation
- https://postmarkapp.com/developer/user-guide/getting-started
- https://postmarkapp.com/developer/api/overview
- https://postmarkapp.com/developer/user-guide/send-email-with-api

### Cloudflare DNS Documentation
- https://developers.cloudflare.com/dns/

### Email Authentication Information
- https://www.dmarcian.com/spf/
- https://www.dmarcian.com/dkim/
- https://www.dmarcian.com/dmarc/

---

## 🎯 Next Steps

**Right Now:**
1. Skim through each guide to understand structure
2. Create Postmark account

**Next:**
1. Follow POSTMARK_SETUP_CHECKLIST.md Phase 1-4 (today) - 45 min
2. Follow Phase 5-6 (code implementation & testing) - 2 hours

**Then:**
1. Implement email sending in contracts
2. Test with real clients
3. Monitor Postmark metrics
4. Celebrate! 🎉

---

## 🔑 Critical Remember

**⭐ MOST IMPORTANT: Postmark is simpler than AWS SES**

No AWS regions to worry about, no production approval waiting period, no IAM complexity. Just:
1. Create account
2. Add domain
3. Configure DNS
4. Start sending

All issues are usually DNS-related, which are easy to fix with the guides.

---

**Status:** ✅ Documentation Complete | Ready to Implement

**Questions?** Refer to the appropriate guide document listed above.

**Ready?** Start with: **POSTMARK_SETUP_CHECKLIST.md**

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Project:** Mizu Studio Photography Platform
**Setup:** Domain Verification with Cloudflare DNS + Microsoft 365
