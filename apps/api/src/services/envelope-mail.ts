import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email.js';
import {
  envelopeSentEmail,
  envelopeSignedConfirmationEmail,
  envelopeSignedAdminEmail,
  envelopeDeclinedEmail,
} from './email-templates.js';

const prisma = new PrismaClient();

/**
 * Envelope Mail Service
 *
 * Handles email notifications for envelope operations:
 * - Sending envelopes to signers (with magic link)
 * - Confirming signatures
 * - Notifying admins of status changes
 * - Notifying declines
 */

export class EnvelopeMailService {
  /**
   * Send envelope to signers with magic link
   */
  static async sendEnvelopeNotifications(envelopeId: string): Promise<void> {
    try {
      // Get envelope with signers and creator
      const envelope = await prisma.envelope.findUnique({
        where: { id: envelopeId },
        include: {
          signers: {
            orderBy: { sequenceNumber: 'asc' },
          },
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          documents: true,
        },
      });

      if (!envelope) {
        throw new Error('Envelope not found');
      }

      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';

      // Send email to each signer
      for (const signer of envelope.signers) {
        try {
          const signingUrl = `${baseUrl}/sign/${signer.magicLinkToken}`;
          const expiresInHours = 7 * 24; // 7 days in hours

          const emailTemplate = envelopeSentEmail({
            recipientName: signer.name,
            envelopeName: envelope.name,
            senderName: envelope.createdBy?.name || 'Kori Photography',
            signingUrl,
            expiresInHours,
            documentCount: envelope.documents?.length || 0,
          });

          await sendEmail({
            to: signer.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
            template: 'envelope_sent',
            metadata: {
              envelopeId,
              signerId: signer.id,
              signerEmail: signer.email,
              magicToken: signer.magicLinkToken,
            },
          });

          console.log(`[Envelope Mail] Sent envelope notification to ${signer.email} for envelope ${envelopeId}`);
        } catch (error) {
          console.error(`[Envelope Mail] Failed to send notification to ${signer.email}:`, error);
          // Continue with next signer even if one fails
        }
      }
    } catch (error) {
      console.error(`[Envelope Mail] Error sending envelope notifications for ${envelopeId}:`, error);
      throw error;
    }
  }

  /**
   * Send confirmation email to signer after signing
   */
  static async sendSignatureConfirmationEmail(signerId: string): Promise<void> {
    try {
      // Get signer and envelope
      const signer = await prisma.signer.findUnique({
        where: { id: signerId },
        include: {
          envelope: true,
        },
      });

      if (!signer || !signer.envelope) {
        throw new Error('Signer or envelope not found');
      }

      const emailTemplate = envelopeSignedConfirmationEmail({
        recipientName: signer.name,
        envelopeName: signer.envelope.name,
        signedAt: signer.signedAt || new Date(),
      });

      await sendEmail({
        to: signer.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        template: 'envelope_signed_confirmation',
        metadata: {
          envelopeId: signer.envelopeId,
          signerId: signer.id,
          signerEmail: signer.email,
        },
      });

      console.log(`[Envelope Mail] Sent signature confirmation to ${signer.email} for envelope ${signer.envelopeId}`);
    } catch (error) {
      console.error(`[Envelope Mail] Error sending signature confirmation:`, error);
      throw error;
    }
  }

  /**
   * Send admin notification when signer signs
   */
  static async sendSignedAdminNotification(signerId: string): Promise<void> {
    try {
      // Get signer and envelope
      const signer = await prisma.signer.findUnique({
        where: { id: signerId },
        include: {
          envelope: {
            include: {
              createdBy: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!signer || !signer.envelope) {
        throw new Error('Signer or envelope not found');
      }

      if (!signer.envelope.createdBy?.email) {
        console.warn(`[Envelope Mail] No admin email found for envelope ${signer.envelopeId}`);
        return;
      }

      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
      const envelopeUrl = `${baseUrl}/admin/envelopes/${signer.envelopeId}`;

      const emailTemplate = envelopeSignedAdminEmail({
        envelopeName: signer.envelope.name,
        signerName: signer.name,
        signerEmail: signer.email,
        signedAt: signer.signedAt || new Date(),
        envelopeUrl,
      });

      await sendEmail({
        to: signer.envelope.createdBy.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        template: 'envelope_signed_admin',
        metadata: {
          envelopeId: signer.envelopeId,
          signerId: signer.id,
          signerEmail: signer.email,
        },
      });

      console.log(`[Envelope Mail] Sent admin notification for signed envelope ${signer.envelopeId}`);
    } catch (error) {
      console.error(`[Envelope Mail] Error sending admin notification:`, error);
      throw error;
    }
  }

  /**
   * Send notification when signer declines
   */
  static async sendDeclinedNotification(signerId: string): Promise<void> {
    try {
      // Get signer and envelope
      const signer = await prisma.signer.findUnique({
        where: { id: signerId },
        include: {
          envelope: {
            include: {
              createdBy: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!signer || !signer.envelope) {
        throw new Error('Signer or envelope not found');
      }

      if (!signer.envelope.createdBy?.email) {
        console.warn(`[Envelope Mail] No admin email found for envelope ${signer.envelopeId}`);
        return;
      }

      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
      const envelopeUrl = `${baseUrl}/admin/envelopes/${signer.envelopeId}`;

      const emailTemplate = envelopeDeclinedEmail({
        envelopeName: signer.envelope.name,
        declinedBy: signer.name,
        reason: signer.declinedReason || undefined,
        declinedAt: signer.declinedAt || new Date(),
        envelopeUrl,
      });

      await sendEmail({
        to: signer.envelope.createdBy.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        template: 'envelope_declined',
        metadata: {
          envelopeId: signer.envelopeId,
          signerId: signer.id,
          signerEmail: signer.email,
          reason: signer.declinedReason,
        },
      });

      console.log(`[Envelope Mail] Sent decline notification for envelope ${signer.envelopeId}`);
    } catch (error) {
      console.error(`[Envelope Mail] Error sending decline notification:`, error);
      throw error;
    }
  }
}
