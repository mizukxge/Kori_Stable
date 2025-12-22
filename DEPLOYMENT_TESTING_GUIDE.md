# Appointments System: Deployment & Testing Guide

**System Status:** v0.5 — All 5 Slices Complete + Build Verified ✅
**Total Code:** 6,000+ lines (Backend + Frontend)
**Last Updated:** 2025-12-22

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [x] Build passes without errors (`pnpm build`)
- [x] No TypeScript errors (10 errors fixed)
- [x] All type safety verified
- [x] Git history clean and committed
- [ ] Code review completed
- [ ] Security audit passed

### Functionality Verification
- [ ] API server starts successfully
- [ ] Web server starts successfully
- [ ] Database migrations applied
- [ ] Test data seeded (optional)

### Environment Setup
- [ ] Database credentials validated
- [ ] SMTP configuration tested
- [ ] Teams OAuth credentials configured
- [ ] Session secrets rotated (non-default)
- [ ] CORS origins configured correctly
- [ ] All environment variables set

### Database
- [ ] Database backups configured
- [ ] Connection pooling configured (if using)
- [ ] Database indexes verified
- [ ] Migration scripts tested on staging
- [ ] Rollback procedures documented

---

## 🧪 Testing Phases

### Phase 1: Local Development Testing (1-2 hours)

#### 1.1 Application Startup
```bash
# Terminal 1: Start API
pnpm dev:api

# Terminal 2: Start Web
pnpm dev:web
```

**Checklist:**
- [ ] API starts on port 3001 without errors
- [ ] Web starts on port 3000 without errors
- [ ] No console errors or warnings (except React strict mode)
- [ ] Health check: `curl http://localhost:3001/healthz` → 200 OK
- [ ] Readiness check: `curl http://localhost:3001/readyz` → 200 OK

#### 1.2 Admin Authentication
- [ ] Login page loads
- [ ] Can create admin user (first-time setup)
- [ ] Session cookie created after login
- [ ] Can logout successfully
- [ ] Session persists on page refresh
- [ ] Logout clears session

#### 1.3 Appointments Slice 1: CRUD Operations
- [ ] Create new appointment (admin form)
- [ ] List appointments (with pagination)
- [ ] View appointment details
- [ ] Edit appointment (reschedule, update status, add notes)
- [ ] Delete appointment
- [ ] Audit log entries created for all operations
- [ ] Client dropdown populated correctly

#### 1.4 Appointments Slice 2: Public Booking
- [ ] Create invitation link (generate token)
- [ ] Token appears in admin interface
- [ ] Token is unique and valid
- [ ] Public booking page loads with token
- [ ] Can see available time slots (Mon-Sat, 11:00-16:00 UTC)
- [ ] Can book appointment (client form)
- [ ] Email confirmation sent (check SMTP logs)
- [ ] Token becomes single-use after booking
- [ ] Token expires after configured period
- [ ] Cannot re-use expired token

#### 1.5 Appointments Slice 3: Calendar UI
- [ ] Calendar page loads
- [ ] Week navigation works (previous/next)
- [ ] Current week highlighted
- [ ] Appointments appear in correct time slots
- [ ] Appointments colored by type
- [ ] Status indicators visible
- [ ] Click appointment to open detail panel
- [ ] Detail panel shows all information
- [ ] Can reschedule from detail panel
- [ ] Can cancel from detail panel
- [ ] Settings page accessible
- [ ] Can update working hours
- [ ] Can update booking window
- [ ] Can manage blocked times

#### 1.6 Appointments Slice 4: Email & Teams
- [ ] Booking confirmation email sent
- [ ] Email contains client details
- [ ] Email contains Teams meeting link
- [ ] Teams meeting created in account
- [ ] Meeting includes recording enabled
- [ ] 24-hour reminder email sent automatically
- [ ] 1-hour reminder email sent automatically
- [ ] Reschedule notification sent
- [ ] Cancellation notification sent
- [ ] Recording link captured after meeting
- [ ] Teams integration working with real API

#### 1.7 Appointments Slice 5: Metrics
- [ ] Metrics page loads
- [ ] Summary stats calculated correctly:
  - Total appointments
  - Completed appointments
  - No-show rate
  - This week count
- [ ] Date range filters work (7d, 30d, 90d, all)
- [ ] Breakdown by type shows correct counts
- [ ] Breakdown by outcome shows correct counts
- [ ] Quick statistics grid displays all values
- [ ] Quick statistics have correct colors
- [ ] CSV export button works
- [ ] CSV file contains correct columns
- [ ] CSV file opens correctly in Excel
- [ ] CSV data matches displayed metrics
- [ ] Performance acceptable with 100+ appointments

#### 1.8 API Integration
```bash
# Test API endpoints directly
curl -X GET http://localhost:3001/admin/appointments
curl -X GET http://localhost:3001/admin/appointments/stats
curl -X GET http://localhost:3001/admin/appointments/export
```

- [ ] All endpoints return correct status codes
- [ ] Response format matches documentation
- [ ] Error handling works (invalid input)
- [ ] Authentication required endpoints protected
- [ ] CORS headers present in responses

---

### Phase 2: Staging Environment Testing (2-3 days)

#### 2.1 Environment Parity
- [ ] Staging has production-like database
- [ ] Staging has production-like SMTP setup
- [ ] Staging has production-like Teams OAuth
- [ ] All environment variables match production format
- [ ] Secrets are rotated from development

#### 2.2 Load Testing
```bash
# Simulate concurrent users with 100+ appointments
# Using Apache Bench or similar tool
ab -n 1000 -c 100 http://staging-api.example.com/admin/appointments
```

- [ ] API handles 100+ concurrent requests
- [ ] Response time acceptable (<2s for list)
- [ ] Metrics page loads in <1 second with 1000 appointments
- [ ] CSV export completes in <5 seconds
- [ ] Database connection pool doesn't exhaust
- [ ] No memory leaks over 24 hours
- [ ] No SQL errors in logs

#### 2.3 User Acceptance Testing (UAT)

**Scenario 1: New Client Booking**
1. Admin creates invitation link
2. Share link with client via email
3. Client clicks link, sees availability
4. Client selects time slot
5. Client fills in details (name, email, notes)
6. Client submits booking
7. **Verify:**
   - [ ] Confirmation email received
   - [ ] Appointment appears in admin calendar
   - [ ] Teams meeting link working
   - [ ] Audit log shows booking

**Scenario 2: Admin Reschedules**
1. Admin opens calendar
2. Clicks appointment
3. Changes date/time
4. Saves changes
5. **Verify:**
   - [ ] Reschedule email sent to client
   - [ ] Teams meeting updated
   - [ ] Calendar updated immediately
   - [ ] Audit log shows reschedule

**Scenario 3: No-Show Handling**
1. Appointment scheduled time passes
2. Admin marks as "No-Show" with reason
3. **Verify:**
   - [ ] Status changes to "No-Show"
   - [ ] Email sent to client
   - [ ] No-show count updated in metrics
   - [ ] No-show rate recalculated

**Scenario 4: Metrics Review**
1. Admin views metrics page
2. Filters by different date ranges
3. Views breakdown by type and outcome
4. Exports to CSV
5. **Verify:**
   - [ ] Metrics match actual appointments
   - [ ] Filters apply correctly
   - [ ] CSV contains all data
   - [ ] Calculations correct

#### 2.4 Email Testing
- [ ] Test with real SMTP server
- [ ] Verify email delivery (not spam folder)
- [ ] Check email formatting and links
- [ ] Verify all reminder times work
- [ ] Test with various email clients (Gmail, Outlook)

#### 2.5 Teams Integration Testing
- [ ] Create real Teams meetings
- [ ] Verify meeting details correct
- [ ] Enable recording in Teams
- [ ] Join meeting to verify link works
- [ ] Recording uploads and URL captured
- [ ] Test rescheduling updates Teams meeting
- [ ] Test cancellation removes Teams meeting

#### 2.6 Performance Testing
- [ ] Metrics dashboard loads in <1 second
- [ ] Calendar renders smoothly with 50+ appointments
- [ ] Infinite scroll (if implemented) works smoothly
- [ ] No UI freezes or jank
- [ ] Mobile performance acceptable

#### 2.7 Security Testing
- [ ] CSRF protection tested (if implemented)
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Authentication required endpoints protected
- [ ] Admin-only endpoints protected
- [ ] Rate limiting working (if implemented)
- [ ] Invitation tokens not exposed in URLs
- [ ] Session tokens secure (httpOnly, secure flags)

#### 2.8 Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### 2.9 Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Form labels associated

---

### Phase 3: Production Deployment (< 1 hour)

#### 3.1 Pre-Deployment Snapshot
```bash
# Document current state
git log --oneline -5
pnpm build
# Note: Build size and duration
```

- [ ] Build size documented
- [ ] Build time recorded
- [ ] Git commit hash saved
- [ ] All dependencies pinned

#### 3.2 Deployment Steps
```bash
# 1. Pull latest changes to production
git fetch origin claude/add-appointments-tab-QD5wD
git checkout claude/add-appointments-tab-QD5wD

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client
pnpm db:generate

# 4. Run migrations (backup database first!)
pnpm --filter @kori/api db:migrate:prod

# 5. Rebuild if needed
pnpm build

# 6. Start API server
NODE_ENV=production pnpm --filter @kori/api start

# 7. Start Web server (via PM2 or similar)
pm2 start "pnpm --filter @kori/web preview" --name "kori-web"
```

**Production PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'kori-api',
      script: 'apps/api/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'kori-web',
      script: 'pnpm --filter @kori/web preview',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

#### 3.3 Post-Deployment Verification
```bash
# Health checks
curl https://api.production.com/healthz
curl https://api.production.com/readyz
curl https://production.com/

# Check logs
tail -f /var/log/kori-api.log
tail -f /var/log/kori-web.log
```

- [ ] API responds to health check
- [ ] Web responds with 200
- [ ] No errors in logs
- [ ] Metrics accessible
- [ ] Appointments display correctly

#### 3.4 Database Migration Verification
- [ ] All Prisma migrations applied
- [ ] Schema matches expected state
- [ ] Indexes created
- [ ] Data intact and accessible
- [ ] Backups present and valid

---

## 🚨 Rollback Procedures

### Quick Rollback (< 5 minutes)
```bash
# If deployment failed, revert to previous version
git revert HEAD
pnpm build
# Restart services

# Or use git checkout
git checkout <previous-commit-hash>
pnpm build
# Restart services
```

### Database Rollback (< 15 minutes)
```bash
# If migration caused issues
pnpm --filter @kori/api db:migrate resolve --rolled-back
# Or restore from backup
psql $DATABASE_URL < backup-before-migration.sql
```

### Monitoring Before Rollback
- [ ] Check error rates in logs
- [ ] Monitor response times
- [ ] Verify email delivery
- [ ] Check Teams integration
- [ ] Monitor database performance

---

## 📊 Monitoring Setup

### Logging
```bash
# Set log level
LOG_LEVEL=info  # production
LOG_LEVEL=debug # staging for troubleshooting
```

**Log locations:**
- API logs: `/var/log/kori-api.log`
- Web logs: `/var/log/kori-web.log`
- System logs: `journalctl -u kori-api`

### Metrics
```bash
# Prometheus metrics endpoint
curl http://localhost:3001/metrics

# Key metrics to monitor:
# - http_request_duration_seconds
# - http_requests_total
# - db_query_duration_ms
# - appointments_count
```

### Alerts
Configure alerts for:
- [ ] API response time > 2 seconds
- [ ] Error rate > 5%
- [ ] Database connection pool exhausted
- [ ] SMTP failures
- [ ] Teams API failures
- [ ] High memory usage (> 80%)
- [ ] High CPU usage (> 80%)

---

## 📋 Testing Checklist by Feature

### Slice 1: Data Model & CRUD
- [ ] Create appointment via API
- [ ] Read appointment details
- [ ] Update appointment status
- [ ] Delete appointment (with cascade)
- [ ] Audit log created for each operation
- [ ] List with pagination works
- [ ] Filters work (status, type, date)
- [ ] Sorting works (date, status, client name)

### Slice 2: Public Booking
- [ ] Generate invitation token
- [ ] Token format valid
- [ ] Public booking endpoint accessible
- [ ] Availability calculated correctly
- [ ] 14-day window enforced
- [ ] 15-minute buffer enforced
- [ ] Double-booking prevented
- [ ] Token single-use enforced
- [ ] Token expiry enforced

### Slice 3: Calendar UI
- [ ] Calendar loads for current week
- [ ] Week navigation works
- [ ] Appointments visible
- [ ] Color coding by type works
- [ ] Status indicators visible
- [ ] Click opens detail panel
- [ ] Can reschedule from panel
- [ ] Settings page accessible
- [ ] Settings changes save
- [ ] Blocked times displayed
- [ ] Blocked times prevent booking

### Slice 4: Email & Teams
- [ ] Booking email sent (SMTP)
- [ ] Reminder emails sent
- [ ] Reschedule email sent
- [ ] Cancellation email sent
- [ ] Teams meeting created
- [ ] Teams meeting includes Teams meeting link
- [ ] Recording enabled in Teams
- [ ] Recording URL captured
- [ ] Email variables correct (name, time, link)
- [ ] Reminder scheduler runs every 5 minutes
- [ ] Reminders don't send duplicates

### Slice 5: Metrics
- [ ] Total appointments calculated
- [ ] Completed appointments calculated
- [ ] No-show rate calculated
- [ ] Count by type accurate
- [ ] Count by outcome accurate
- [ ] This week/month counts accurate
- [ ] Average duration calculated
- [ ] Total minutes calculated
- [ ] Date range filtering works
- [ ] CSV export generates
- [ ] CSV format valid
- [ ] CSV columns complete
- [ ] Performance acceptable

---

## 🔐 Security Checklist

- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React escaping)
- [ ] CSRF tokens used (if applicable)
- [ ] Authentication required on admin endpoints
- [ ] Authorization enforced (admin-only routes)
- [ ] Session secrets not in code
- [ ] API keys not in code
- [ ] Database passwords not in code
- [ ] Invitation tokens have expiry
- [ ] Invitation tokens not logged
- [ ] Email addresses validated
- [ ] Rate limiting on public endpoints
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Helmet security headers enabled

---

## 📝 Testing Report Template

```markdown
# Testing Report - Appointments System v0.5
**Date:** YYYY-MM-DD
**Tested By:** [Name]
**Environment:** Staging / Production

## Summary
- Total Tests:
- Passed:
- Failed:
- Skipped:

## Issues Found
1. Issue Title
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected:
   - Actual:
   - Resolution:

## Performance Results
- Metrics page load: X ms
- CSV export time: X ms
- 100 concurrent users: X requests/sec
- Memory usage: X MB

## Security Assessment
- ✅ No SQL injection vulnerabilities found
- ✅ No XSS vulnerabilities found
- ✅ Authentication enforced
- ✅ Authorization working

## Sign-off
- [ ] Ready for production
- [ ] Requires fixes before production
- [ ] Schedule follow-up testing

**Approved By:** [Name]
**Date:** [Date]
```

---

## 🎯 Success Criteria

- ✅ Build passes without errors
- ✅ All 5 slices functioning correctly
- ✅ API responds to all endpoints
- ✅ Calendar UI renders smoothly
- ✅ Email sends successfully
- ✅ Teams integration working
- ✅ Metrics accurate
- ✅ CSV export working
- ✅ Load test: 100 concurrent users
- ✅ Response time: < 2 seconds
- ✅ Zero TypeScript errors
- ✅ Mobile responsive
- ✅ Accessibility compliant
- ✅ Security audit passed
- ✅ Database migrations applied
- ✅ Backups tested

---

## 📞 Support & Escalation

### If Issues Found
1. Document issue with steps to reproduce
2. Check logs for error messages
3. Rollback if critical
4. Create bug fix on separate branch
5. Re-test in staging
6. Deploy fix to production

### Key Contacts
- Database Support: [contact]
- Email Service: [contact]
- Teams API Support: [contact]
- Infrastructure: [contact]

---

**Status:** Ready for deployment testing 🚀

All code built successfully. Follow this guide for comprehensive testing and deployment.
