-- Add email template fields to appointment_settings table
ALTER TABLE "appointment_settings" ADD COLUMN IF NOT EXISTS "invitationEmailTemplate" TEXT NOT NULL DEFAULT 'Hi {clientName},

You''re invited to a {appointmentType} call on {proposedDate} at {proposedTime}.

Please confirm your availability:
{bookingLink}

Best regards,
{adminName}';

ALTER TABLE "appointment_settings" ADD COLUMN IF NOT EXISTS "confirmationEmailTemplate" TEXT NOT NULL DEFAULT 'Hi {clientName},

Your appointment is confirmed for {confirmedDate} at {confirmedTime}.

Teams Link: {teamsLink}

Best regards,
{adminName}';

ALTER TABLE "appointment_settings" ADD COLUMN IF NOT EXISTS "reminderEmailTemplate" TEXT NOT NULL DEFAULT 'Hi {clientName},

Reminder: Your appointment is on {appointmentDate} at {appointmentTime}.

Teams Link: {teamsLink}

Best regards,
{adminName}';

ALTER TABLE "appointment_settings" ADD COLUMN IF NOT EXISTS "recipientEmailCC" TEXT;

-- Add calendar sync fields (stubs for now)
ALTER TABLE "appointment_settings" ADD COLUMN IF NOT EXISTS "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "appointment_settings" ADD COLUMN IF NOT EXISTS "outlookCalendarEnabled" BOOLEAN NOT NULL DEFAULT false;
