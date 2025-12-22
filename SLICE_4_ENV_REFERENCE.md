# Slice 4: Email Notifications + Teams Integration - Environment Variables Reference

This document provides a complete reference for configuring Slice 4 features: email notifications, Microsoft Teams integration, and appointment reminders.

## Email Configuration

### SMTP Settings
Configure these variables to enable email sending via your preferred SMTP provider.

```env
# SMTP server hostname
# Examples: smtp.gmail.com, smtp.office365.com, mail.example.com
SMTP_HOST=smtp.gmail.com

# SMTP server port (typically 587 for TLS or 465 for SSL)
SMTP_PORT=587

# SMTP authentication username (usually your email address)
SMTP_USER=noreply@kori.photography

# SMTP authentication password or app-specific password
# For Gmail: Use an app-specific password (not your regular password)
# For Office 365: Use your Office 365 password
# For other providers: Use SMTP password from account settings
SMTP_PASS=your_app_specific_password_here

# Email sender address (displayed in "From" field of emails)
# Default: appointments@kori.photography
EMAIL_FROM=appointments@kori.photography
```

### SMTP Provider Setup Examples

#### Gmail (using App Password)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@kori.photography
```

Steps:
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an App Password for "Mail" on "Windows Computer"
4. Use the 16-character password as SMTP_PASS

#### Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your_office365_password
EMAIL_FROM=noreply@company.com
```

#### SendGrid (transactional email)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@kori.photography
```

#### AWS SES (when implemented)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
EMAIL_FROM=noreply@kori.photography
```

## Appointment Reminder Configuration

### Reminder Scheduler Timings

```env
# How frequently to check for upcoming appointments (in seconds)
# Default: 300 (checks every 5 minutes)
# Set lower for more frequent checks (but increases CPU usage)
# Set higher to reduce server load
REMINDER_CHECK_INTERVAL_SECONDS=300

# How many minutes before appointment to send 24-hour reminder
# Default: 1440 (24 hours)
# Set lower for earlier reminder (e.g., 2880 for 48 hours)
REMINDER_24HOUR_MINUTES=1440

# How many minutes before appointment to send 1-hour reminder
# Default: 60 (1 hour)
# Set lower for earlier reminder (e.g., 120 for 2 hours)
REMINDER_1HOUR_MINUTES=60
```

### Reminder Behavior
- Reminders are sent asynchronously (don't block the API response)
- Each reminder is tracked in `AppointmentAuditLog` to prevent duplicates
- Reminders are only sent for appointments in "Booked" status
- Failed reminder emails are logged but don't affect other operations

## Microsoft Teams Integration

### Azure AD Configuration Required

To enable real Microsoft Teams meeting creation, you need an Azure app registration:

1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Enter Name: "Kori Appointments"
5. Select "Accounts in this organizational directory only"
6. Click Register

### API Permissions Setup

1. In your app registration, click "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Click "Application permissions"
5. Search and select:
   - `OnlineMeetings.ReadWrite` (create/delete Teams meetings)
   - `User.Read.All` (read user information)
6. Click "Add permissions"
7. Click "Grant admin consent for [your directory]"

### Certificate/Secret Setup

1. In your app registration, click "Certificates & secrets"
2. Under "Client secrets", click "New client secret"
3. Set expiration to 24 months
4. Copy the secret value immediately (you won't see it again)

### Environment Variables

```env
# Azure app registration details
# Found in "Overview" page of your app registration
TEAMS_CLIENT_ID=your-client-id-uuid
TEAMS_CLIENT_SECRET=your-client-secret-value
TEAMS_TENANT_ID=your-tenant-id-uuid

# Set to 'teams' to enable real Teams integration
# Set to 'fake' for development/testing (returns synthetic URLs)
MEETING_PROVIDER=fake  # Use 'fake' until you have Teams credentials configured
```

### Finding Your IDs

**Client ID (Application ID):**
- Go to your app registration "Overview" page
- Copy the "Application (client) ID" value

**Tenant ID (Directory ID):**
- Go to your app registration "Overview" page
- Copy the "Directory (tenant) ID" value

**Client Secret:**
- Go to "Certificates & secrets"
- Copy the value from the secret you just created
- ⚠️ Store securely - never commit to version control

### Teams Meeting Features

With real Teams integration enabled:
- Meetings are automatically recorded (by Teams)
- Meeting links are sent to clients in confirmation emails
- Recordings can be retrieved via the API after meeting completion
- Meetings are cancelled when appointments are cancelled
- Meeting participants are auto-added based on appointment client

## Development vs Production

### Development Environment
```env
# Use fake provider for development
MEETING_PROVIDER=fake

# Optional: Use ethereal.email for email testing (free service)
# Ethereal generates test credentials automatically
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user@ethereal.email
SMTP_PASS=your_ethereal_password
```

### Production Environment
```env
# Use real Teams provider
MEETING_PROVIDER=teams

# Use production SMTP credentials
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=your_office365_password

# Use realistic reminder intervals
REMINDER_CHECK_INTERVAL_SECONDS=300
REMINDER_24HOUR_MINUTES=1440
REMINDER_1HOUR_MINUTES=60
```

## Testing Email Configuration

To test email configuration without sending to real addresses:

1. Use ethereal.email (free test email service):
   ```env
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=generated_user@ethereal.email
   SMTP_PASS=generated_password
   ```

2. Create account at https://ethereal.email
3. All emails are captured and available in your inbox
4. Perfect for development and testing

## Troubleshooting

### "Email service not available" message
- Check that SMTP_HOST, SMTP_USER, and SMTP_PASS are set
- Verify credentials are correct (especially SMTP_PASS)
- Check firewall allows outbound SMTP connections (port 587/465)
- Enable "Less secure app access" if using Gmail

### Teams meetings not creating
- Verify TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, and TEAMS_TENANT_ID are set
- Ensure app registration has OnlineMeetings.ReadWrite permission
- Check that admin consent has been granted
- Verify client secret hasn't expired
- Check server logs for detailed error messages

### Reminders not sending
- Verify SMTP configuration first (test with booking confirmation)
- Check REMINDER_CHECK_INTERVAL_SECONDS is reasonable (not too high)
- Verify appointments are in "Booked" status and in the future
- Check server logs for reminder scheduler messages
- Use `getReminderStatus` API to check if reminders were already sent

### Double emails being sent
- This can happen if multiple server instances are running
- Use a single reminder scheduler instance
- Lock-based reminder checking (planned for future)

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit secrets to version control**
   - Use `.env.local` for local development
   - Store secrets in environment variables on production servers
   - Use cloud secret management (AWS Secrets Manager, Azure Key Vault, etc.)

2. **Email addresses in templates**
   - Encrypted during transmission (via SMTP TLS)
   - Stored in database for audit trail
   - Implement GDPR compliance for data retention

3. **Teams meeting links**
   - Shared with clients via email
   - Links don't grant additional permissions
   - Teams controls access permissions independently

4. **Client secrets rotation**
   - Azure app secrets should be rotated regularly
   - Set up calendar reminders for secret expiration
   - Plan rotation at least 30 days before expiry

## Performance Considerations

- **Email sending:** Non-blocking async operations (responses don't wait for emails)
- **Reminder checking:** Runs every 5 minutes by default (adjustable)
- **Teams API:** Token cached and reused (minimal API calls)
- **Database:** Audit logging adds minimal overhead

Recommended settings for production:
- `REMINDER_CHECK_INTERVAL_SECONDS=300` (5 minutes)
- `SMTP_PORT=587` (more reliable than 465 for TLS)
- Use environment-specific SMTP credentials

## API Integration Examples

### Booking with automatic email
```typescript
// Client books appointment via invite link
POST /book/:token
// Automatic response:
// 1. Teams meeting created
// 2. Appointment marked as Booked
// 3. Booking confirmation email sent asynchronously
```

### Admin actions triggering emails
```typescript
// Admin reschedules appointment
PATCH /admin/appointments/:id/reschedule
// Automatic response:
// 1. Appointment updated
// 2. Reschedule notification email sent

// Admin cancels appointment
POST /admin/appointments/:id/cancel
// Automatic response:
// 1. Appointment marked Cancelled
// 2. Cancellation email sent
// 3. Teams meeting removed
```

### Reminder emails (automatic)
```typescript
// Scheduler runs every 5 minutes
// For each Booked appointment:
// - 24 hours before: Send reminder email
// - 1 hour before: Send final reminder email
// - All reminders tracked in AppointmentAuditLog
```

## Next Steps (Slice 5)

Planned improvements:
- CSV export of appointment data with email history
- Advanced metrics dashboard with email delivery status
- Email template customization UI
- Webhook integrations for external systems
- SMS reminders as alternative to email
- Multi-language email templates
