import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email.js';
// TODO: Add envelope email templates to email-templates.ts
// Missing templates: envelopeSentEmail, envelopeSignedConfirmationEmail,
// envelopeSignedAdminEmail, envelopeDeclinedEmail

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
          // TODO: Send envelope notification email using proper template
          // For now, envelope email templates are not implemented
          console.log(`[Envelope Mail] Skipping email notification to ${signer.email} (template not implemented)`);
        } catch (error) {
          console.error(`[Envelope Mail] Error processing envelope notification:`, error);
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

      // TODO: Send signature confirmation email using proper template
      // For now, envelope email templates are not implemented
      console.log(`[Envelope Mail] Skipping signature confirmation to ${signer.email} (template not implemented)`);
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

      // TODO: Send admin notification email using proper template
      // For now, envelope email templates are not implemented
      console.log(`[Envelope Mail] Skipping admin notification for envelope ${signer.envelopeId} (template not implemented)`);
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

      // TODO: Send decline notification email using proper template
      // For now, envelope email templates are not implemented
      console.log(`[Envelope Mail] Skipping decline notification for envelope ${signer.envelopeId} (template not implemented)`);
    } catch (error) {
      console.error(`[Envelope Mail] Error sending decline notification:`, error);
      throw error;
    }
  }
}
