import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Initialize SES Client with AWS credentials from environment variables
 * Region: eu-west-2 (Ireland)
 */
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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
 * Send email using Amazon SES
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

  // Ensure 'to' is an array
  const toAddresses = Array.isArray(to) ? to : [to];

  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: textBody
          ? {
              Data: textBody,
              Charset: 'UTF-8',
            }
          : undefined,
      },
    },
    ReplyToAddresses: [replyTo],
  });

  try {
    const result = await sesClient.send(command);
    console.log(`✅ Email sent successfully to ${toAddresses.join(', ')}`);
    console.log(`   Message ID: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${toAddresses.join(', ')}:`, error);
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
 * @param prospectEmail Prospect email address
 * @param proposalId Proposal ID
 * @param prospectName Prospect name for personalization
 * @returns Promise with message ID
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
 * @param clientEmail Client email address
 * @param contractId Contract ID for signing link
 * @param clientName Client name for personalization
 * @returns Promise with message ID
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
