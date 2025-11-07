import { PrismaClient, ContractStatus } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { sendEmail } from './email.js';
import { contractSignedClientEmail, contractSignedAdminEmail, contractDeclinedEmail } from './email-templates.js';

const prisma = new PrismaClient();

/**
 * Signature Service
 *
 * Handles electronic signature capture, validation, and PDF stamping.
 */

export interface SignatureData {
  signatureDataUrl: string; // Base64 data URL of signature image
  signerName: string;
  signerEmail: string;
  signerIP?: string;
  signerUserAgent?: string;
  agreedToTerms: boolean;
}

export interface SignatureResult {
  contractId: string;
  signedAt: Date;
  signedPdfPath: string;
  signedPdfHash: string;
}

export class SignatureService {
  /**
   * Apply signature to contract and generate signed PDF
   */
  static async signContract(
    contractId: string,
    sessionId: string,
    signatureData: SignatureData
  ): Promise<SignatureResult> {
    // Validate session
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        template: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status === 'SIGNED') {
      throw new Error('Contract is already signed');
    }

    if (contract.signerSessionId !== sessionId) {
      throw new Error('Invalid session');
    }

    if (!signatureData.agreedToTerms) {
      throw new Error('Must agree to terms to sign');
    }

    // Verify signature data
    if (!signatureData.signatureDataUrl || !signatureData.signatureDataUrl.startsWith('data:image')) {
      throw new Error('Invalid signature data');
    }

    if (!signatureData.signerEmail || !signatureData.signerName) {
      throw new Error('Signer name and email are required');
    }

    // Verify email matches contract client email (optional, for security)
    if (contract.client && contract.client.email.toLowerCase() !== signatureData.signerEmail.toLowerCase()) {
      throw new Error('Signer email does not match contract client');
    }

    const signedAt = new Date();

    // If contract has a PDF, stamp it with signature
    let signedPdfPath = contract.pdfPath;
    let signedPdfHash = contract.pdfHash;

    if (contract.pdfPath) {
      const result = await this.stampPDFWithSignature(
        contract.pdfPath,
        signatureData,
        {
          contractNumber: contract.contractNumber,
          signerName: signatureData.signerName,
          signerEmail: signatureData.signerEmail,
          signedAt,
        }
      );
      signedPdfPath = result.pdfPath;
      signedPdfHash = result.pdfHash;
    }

    // Update contract status
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.SIGNED,
        signedAt,
        signerSessionId: null, // Invalidate session
        signerSessionExpiresAt: null,
        pdfPath: signedPdfPath,
        pdfHash: signedPdfHash,
      },
    });

    // Log the signing event
    await prisma.contractEvent.create({
      data: {
        contractId,
        type: 'SIGNED',
        meta: {
          signerName: signatureData.signerName,
          signerEmail: signatureData.signerEmail,
          signerIP: signatureData.signerIP,
          signerUserAgent: signatureData.signerUserAgent,
          signedAt,
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'SIGN_CONTRACT',
        entityType: 'Contract',
        entityId: contractId,
        clientId: contract.clientId,
        metadata: {
          contractNumber: contract.contractNumber,
          signerName: signatureData.signerName,
          signerEmail: signatureData.signerEmail,
          signedPdfPath,
        },
      },
    });

    // Send confirmation email to client
    const clientEmailTemplate = contractSignedClientEmail({
      recipientName: signatureData.signerName,
      contractTitle: contract.title,
      contractNumber: contract.contractNumber,
      signedAt,
      pdfUrl: signedPdfPath ? `${process.env.PUBLIC_URL || 'http://localhost:3000'}${signedPdfPath}` : undefined,
    });

    await sendEmail({
      to: signatureData.signerEmail,
      subject: clientEmailTemplate.subject,
      html: clientEmailTemplate.html,
      text: clientEmailTemplate.text,
      template: 'contract_signed_client',
      metadata: {
        contractId,
        contractNumber: contract.contractNumber,
        signedAt,
      },
    });

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
    if (adminEmail) {
      const adminEmailTemplate = contractSignedAdminEmail({
        contractTitle: contract.title,
        contractNumber: contract.contractNumber,
        signerName: signatureData.signerName,
        signerEmail: signatureData.signerEmail,
        signedAt,
        contractUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin/contracts/${contractId}`,
      });

      await sendEmail({
        to: adminEmail,
        subject: adminEmailTemplate.subject,
        html: adminEmailTemplate.html,
        text: adminEmailTemplate.text,
        template: 'contract_signed_admin',
        metadata: {
          contractId,
          contractNumber: contract.contractNumber,
          signedAt,
        },
      });
    }

    console.log(`Contract ${contract.contractNumber} signed by ${signatureData.signerName}`);

    return {
      contractId,
      signedAt,
      signedPdfPath: signedPdfPath!,
      signedPdfHash: signedPdfHash!,
    };
  }

  /**
   * Stamp PDF with signature and signing information
   */
  private static async stampPDFWithSignature(
    originalPdfPath: string,
    signatureData: SignatureData,
    metadata: {
      contractNumber: string;
      signerName: string;
      signerEmail: string;
      signedAt: Date;
    }
  ): Promise<{ pdfPath: string; pdfHash: string }> {
    // Read the original PDF
    const fullPath = path.join(process.cwd(), originalPdfPath.replace(/^\//, ''));
    const pdfBytes = await fs.readFile(fullPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Extract signature image from data URL
    const signatureImageData = signatureData.signatureDataUrl.split(',')[1];
    const signatureImageBytes = Buffer.from(signatureImageData, 'base64');

    // Embed the signature image
    let signatureImage;
    if (signatureData.signatureDataUrl.includes('image/png')) {
      signatureImage = await pdfDoc.embedPng(signatureImageBytes);
    } else if (signatureData.signatureDataUrl.includes('image/jpeg') || signatureData.signatureDataUrl.includes('image/jpg')) {
      signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
    } else {
      throw new Error('Unsupported signature image format');
    }

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add signature to the last page
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    // Draw signature box
    const boxX = 50;
    const boxY = 100;
    const boxWidth = width - 100;
    const boxHeight = 120;

    // Background box
    lastPage.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    // Signature image
    const signatureWidth = 200;
    const signatureHeight = 60;
    lastPage.drawImage(signatureImage, {
      x: boxX + 20,
      y: boxY + 40,
      width: signatureWidth,
      height: signatureHeight,
    });

    // Signer information
    const textX = boxX + signatureWidth + 40;
    lastPage.drawText('Electronically Signed By:', {
      x: textX,
      y: boxY + 90,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    lastPage.drawText(metadata.signerName, {
      x: textX,
      y: boxY + 75,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    lastPage.drawText(metadata.signerEmail, {
      x: textX,
      y: boxY + 60,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    lastPage.drawText(`Date: ${metadata.signedAt.toLocaleString()}`, {
      x: textX,
      y: boxY + 45,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    lastPage.drawText(`Contract: ${metadata.contractNumber}`, {
      x: textX,
      y: boxY + 30,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Security notice
    lastPage.drawText('This document has been electronically signed and is legally binding.', {
      x: boxX + 20,
      y: boxY + 15,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Update PDF metadata
    pdfDoc.setTitle(`${metadata.contractNumber} - Signed`);
    pdfDoc.setSubject(`Electronically signed contract`);
    pdfDoc.setModificationDate(metadata.signedAt);

    // Save the signed PDF
    const signedPdfBytes = await pdfDoc.save();

    // Generate new file path for signed PDF
    const fileHash = createHash('sha256').update(signedPdfBytes).digest('hex');
    const filename = `contract_${metadata.contractNumber}_signed_${fileHash.substring(0, 16)}.pdf`;
    const signedPdfPath = path.join(process.cwd(), 'uploads', 'contracts', filename);

    // Write signed PDF
    await fs.writeFile(signedPdfPath, signedPdfBytes);

    return {
      pdfPath: `/uploads/contracts/${filename}`,
      pdfHash: fileHash,
    };
  }

  /**
   * Validate signature data format
   */
  static validateSignatureData(signatureData: SignatureData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!signatureData.signatureDataUrl) {
      errors.push('Signature image is required');
    } else if (!signatureData.signatureDataUrl.startsWith('data:image')) {
      errors.push('Invalid signature image format');
    }

    if (!signatureData.signerName || signatureData.signerName.trim().length < 2) {
      errors.push('Signer name is required (min 2 characters)');
    }

    if (!signatureData.signerEmail) {
      errors.push('Signer email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signatureData.signerEmail)) {
      errors.push('Invalid email format');
    }

    if (!signatureData.agreedToTerms) {
      errors.push('Must agree to terms and conditions');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Decline/reject contract
   */
  static async declineContract(
    contractId: string,
    sessionId: string,
    reason?: string
  ): Promise<void> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.signerSessionId !== sessionId) {
      throw new Error('Invalid session');
    }

    if (contract.status === 'SIGNED') {
      throw new Error('Cannot decline a signed contract');
    }

    const declinedAt = new Date();

    await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.DECLINED,
        voidedReason: reason || 'Declined by client',
        signerSessionId: null,
        signerSessionExpiresAt: null,
      },
    });

    // Log the decline event
    await prisma.contractEvent.create({
      data: {
        contractId,
        type: 'VOIDED',
        meta: {
          reason,
          declinedAt,
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'DECLINE_CONTRACT',
        entityType: 'Contract',
        entityId: contractId,
        metadata: {
          reason,
        },
      },
    });

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
    if (adminEmail) {
      const emailTemplate = contractDeclinedEmail({
        contractTitle: contract.title,
        contractNumber: contract.contractNumber,
        declinedBy: contract.client?.name,
        reason,
        declinedAt,
        contractUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin/contracts/${contractId}`,
      });

      await sendEmail({
        to: adminEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        template: 'contract_declined',
        metadata: {
          contractId,
          contractNumber: contract.contractNumber,
          reason,
          declinedAt,
        },
      });
    }

    console.log(`Contract ${contract.contractNumber} declined${reason ? `: ${reason}` : ''}`);
  }

  /**
   * Get signature preview (for testing/debugging)
   */
  static async getSignatureInfo(contractId: string) {
    const events = await prisma.contractEvent.findMany({
      where: {
        contractId,
        eventType: 'CONTRACT_SIGNED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    if (events.length === 0) {
      return null;
    }

    return events[0].metadata;
  }
}
