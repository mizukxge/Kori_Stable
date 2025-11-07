/**
 * Email Templates for Contract System
 *
 * Professional, branded email templates for contract-related communications
 */

const BRAND_COLOR = '#4F46E5';
const BRAND_NAME = 'Kori Photography';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base template wrapper for consistent branding
 */
function wrapTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: ${BRAND_COLOR};
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            margin: 0 0 20px 0;
            font-size: 24px;
            color: #1a1a1a;
          }
          .content p {
            margin: 0 0 16px 0;
            color: #4a5568;
            font-size: 16px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: ${BRAND_COLOR};
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            font-size: 16px;
          }
          .button:hover {
            background: #4338CA;
          }
          .info-box {
            background: #f7fafc;
            border-left: 4px solid ${BRAND_COLOR};
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
          }
          .code {
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: ${BRAND_COLOR};
            text-align: center;
            padding: 20px;
            background: #f7fafc;
            border-radius: 8px;
            margin: 24px 0;
          }
          .footer {
            text-align: center;
            padding: 30px;
            border-top: 1px solid #e2e8f0;
            background: #fafafa;
          }
          .footer p {
            margin: 8px 0;
            color: #718096;
            font-size: 14px;
          }
          .footer a {
            color: ${BRAND_COLOR};
            text-decoration: none;
          }
          .warning {
            background: #fff5f5;
            border-left: 4px solid #f56565;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #742a2a;
            font-size: 14px;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .content {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${BRAND_NAME}</h1>
          </div>
          ${content}
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Contract magic link email
 */
export function contractMagicLinkEmail(data: {
  recipientName?: string;
  contractTitle: string;
  contractNumber: string;
  magicLink: string;
  expiresInHours: number;
  photographerName?: string;
}): EmailTemplate {
  const content = `
    <div class="content">
      <h2>Contract Ready for Your Review</h2>
      <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
      <p>
        ${data.photographerName || 'Your photographer'} has sent you a contract to review and sign.
      </p>

      <div class="info-box">
        <p><strong>Contract:</strong> ${data.contractTitle}</p>
        <p><strong>Contract Number:</strong> ${data.contractNumber}</p>
      </div>

      <p>Click the button below to securely access and sign your contract:</p>

      <div style="text-align: center;">
        <a href="${data.magicLink}" class="button">Review & Sign Contract</a>
      </div>

      <div class="warning">
        <p><strong>Security Notice:</strong> This link will expire in ${data.expiresInHours} hours. Do not share this link with anyone.</p>
      </div>

      <p>
        If you have any questions about this contract, please contact ${data.photographerName || 'us'} directly.
      </p>
    </div>
  `;

  return {
    subject: `Contract Ready: ${data.contractTitle}`,
    html: wrapTemplate(content),
    text: `
Contract Ready for Your Review

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

${data.photographerName || 'Your photographer'} has sent you a contract to review and sign.

Contract: ${data.contractTitle}
Contract Number: ${data.contractNumber}

Click the link below to securely access and sign your contract:
${data.magicLink}

⚠️ Security Notice: This link will expire in ${data.expiresInHours} hours. Do not share this link with anyone.

If you have any questions about this contract, please contact ${data.photographerName || 'us'} directly.

---
${BRAND_NAME}
This is an automated email. Please do not reply to this message.
    `.trim(),
  };
}

/**
 * OTP verification email
 */
export function contractOTPEmail(data: {
  recipientName?: string;
  otpCode: string;
  contractTitle: string;
  expiresInMinutes: number;
}): EmailTemplate {
  const content = `
    <div class="content">
      <h2>Your Verification Code</h2>
      <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
      <p>
        Use the code below to verify your identity and access the contract:
        <strong>${data.contractTitle}</strong>
      </p>

      <div class="code">${data.otpCode}</div>

      <p style="text-align: center; color: #718096; font-size: 14px;">
        This code will expire in ${data.expiresInMinutes} minutes.
      </p>

      <div class="warning">
        <p><strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share this code with anyone.</p>
      </div>
    </div>
  `;

  return {
    subject: `Verification Code: ${data.otpCode}`,
    html: wrapTemplate(content),
    text: `
Your Verification Code

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

Use the code below to verify your identity and access the contract: ${data.contractTitle}

Verification Code: ${data.otpCode}

This code will expire in ${data.expiresInMinutes} minutes.

⚠️ Security Notice: If you didn't request this code, please ignore this email. Never share this code with anyone.

---
${BRAND_NAME}
This is an automated email. Please do not reply to this message.
    `.trim(),
  };
}

/**
 * Contract signed confirmation (to client)
 */
export function contractSignedClientEmail(data: {
  recipientName?: string;
  contractTitle: string;
  contractNumber: string;
  signedAt: Date;
  pdfUrl?: string;
}): EmailTemplate {
  const content = `
    <div class="content">
      <h2>✓ Contract Successfully Signed</h2>
      <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
      <p>
        Thank you for signing your contract. We've received your signature and your contract is now fully executed.
      </p>

      <div class="info-box">
        <p><strong>Contract:</strong> ${data.contractTitle}</p>
        <p><strong>Contract Number:</strong> ${data.contractNumber}</p>
        <p><strong>Signed:</strong> ${data.signedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
      </div>

      ${data.pdfUrl ? `
      <p>A copy of your signed contract is attached to this email for your records.</p>
      <div style="text-align: center;">
        <a href="${data.pdfUrl}" class="button">Download Signed Contract</a>
      </div>
      ` : `<p>A copy of your signed contract has been sent to you for your records.</p>`}

      <p>
        We're excited to work with you! If you have any questions, please don't hesitate to reach out.
      </p>
    </div>
  `;

  return {
    subject: `Contract Signed: ${data.contractTitle}`,
    html: wrapTemplate(content),
    text: `
Contract Successfully Signed

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

Thank you for signing your contract. We've received your signature and your contract is now fully executed.

Contract: ${data.contractTitle}
Contract Number: ${data.contractNumber}
Signed: ${data.signedAt.toLocaleString()}

${data.pdfUrl ? `Download your signed contract: ${data.pdfUrl}` : 'A copy of your signed contract has been sent to you for your records.'}

We're excited to work with you! If you have any questions, please don't hesitate to reach out.

---
${BRAND_NAME}
This is an automated email. Please do not reply to this message.
    `.trim(),
  };
}

/**
 * Contract signed notification (to admin/photographer)
 */
export function contractSignedAdminEmail(data: {
  contractTitle: string;
  contractNumber: string;
  signerName: string;
  signerEmail: string;
  signedAt: Date;
  contractUrl: string;
}): EmailTemplate {
  const content = `
    <div class="content">
      <h2>✓ Contract Signed</h2>
      <p>Great news! A contract has been signed.</p>

      <div class="info-box">
        <p><strong>Contract:</strong> ${data.contractTitle}</p>
        <p><strong>Contract Number:</strong> ${data.contractNumber}</p>
        <p><strong>Signed by:</strong> ${data.signerName} (${data.signerEmail})</p>
        <p><strong>Signed:</strong> ${data.signedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
      </div>

      <div style="text-align: center;">
        <a href="${data.contractUrl}" class="button">View Contract Details</a>
      </div>

      <p style="color: #718096; font-size: 14px;">
        The signed PDF has been generated and stored securely in your system.
      </p>
    </div>
  `;

  return {
    subject: `✓ Contract Signed: ${data.contractTitle}`,
    html: wrapTemplate(content),
    text: `
Contract Signed

Great news! A contract has been signed.

Contract: ${data.contractTitle}
Contract Number: ${data.contractNumber}
Signed by: ${data.signerName} (${data.signerEmail})
Signed: ${data.signedAt.toLocaleString()}

View contract details: ${data.contractUrl}

The signed PDF has been generated and stored securely in your system.

---
${BRAND_NAME}
This is an automated email. Please do not reply to this message.
    `.trim(),
  };
}

/**
 * Contract declined notification (to admin/photographer)
 */
export function contractDeclinedEmail(data: {
  contractTitle: string;
  contractNumber: string;
  declinedBy?: string;
  reason?: string;
  declinedAt: Date;
  contractUrl: string;
}): EmailTemplate {
  const content = `
    <div class="content">
      <h2>Contract Declined</h2>
      <p>A contract has been declined by the client.</p>

      <div class="info-box">
        <p><strong>Contract:</strong> ${data.contractTitle}</p>
        <p><strong>Contract Number:</strong> ${data.contractNumber}</p>
        ${data.declinedBy ? `<p><strong>Declined by:</strong> ${data.declinedBy}</p>` : ''}
        <p><strong>Declined:</strong> ${data.declinedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
      </div>

      ${data.reason ? `
      <div class="warning">
        <p><strong>Reason:</strong> ${data.reason}</p>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${data.contractUrl}" class="button">View Contract Details</a>
      </div>

      <p style="color: #718096; font-size: 14px;">
        You may want to reach out to the client to discuss their concerns.
      </p>
    </div>
  `;

  return {
    subject: `Contract Declined: ${data.contractTitle}`,
    html: wrapTemplate(content),
    text: `
Contract Declined

A contract has been declined by the client.

Contract: ${data.contractTitle}
Contract Number: ${data.contractNumber}
${data.declinedBy ? `Declined by: ${data.declinedBy}` : ''}
Declined: ${data.declinedAt.toLocaleString()}

${data.reason ? `Reason: ${data.reason}` : ''}

View contract details: ${data.contractUrl}

You may want to reach out to the client to discuss their concerns.

---
${BRAND_NAME}
This is an automated email. Please do not reply to this message.
    `.trim(),
  };
}

/**
 * Contract expiring reminder
 */
export function contractExpiringEmail(data: {
  recipientName?: string;
  contractTitle: string;
  contractNumber: string;
  expiresInDays: number;
  magicLink: string;
}): EmailTemplate {
  const content = `
    <div class="content">
      <h2>Reminder: Contract Signature Needed</h2>
      <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
      <p>
        This is a friendly reminder that you have a contract pending your signature.
      </p>

      <div class="info-box">
        <p><strong>Contract:</strong> ${data.contractTitle}</p>
        <p><strong>Contract Number:</strong> ${data.contractNumber}</p>
      </div>

      <div class="warning">
        <p><strong>⏰ This contract will expire in ${data.expiresInDays} day${data.expiresInDays === 1 ? '' : 's'}.</strong></p>
      </div>

      <p>Please review and sign the contract at your earliest convenience:</p>

      <div style="text-align: center;">
        <a href="${data.magicLink}" class="button">Review & Sign Contract</a>
      </div>

      <p>
        If you have any questions or concerns, please contact us.
      </p>
    </div>
  `;

  return {
    subject: `Reminder: Contract Expires in ${data.expiresInDays} Day${data.expiresInDays === 1 ? '' : 's'}`,
    html: wrapTemplate(content),
    text: `
Reminder: Contract Signature Needed

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

This is a friendly reminder that you have a contract pending your signature.

Contract: ${data.contractTitle}
Contract Number: ${data.contractNumber}

⏰ This contract will expire in ${data.expiresInDays} day${data.expiresInDays === 1 ? '' : 's'}.

Please review and sign the contract at your earliest convenience:
${data.magicLink}

If you have any questions or concerns, please contact us.

---
${BRAND_NAME}
This is an automated email. Please do not reply to this message.
    `.trim(),
  };
}
