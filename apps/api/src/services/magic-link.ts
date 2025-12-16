import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { addMinutes, addHours, isPast } from 'date-fns';
import { sendEmail } from './email.js';
import { contractOTPEmail, contractMagicLinkEmail } from './email-templates.js';

const prisma = new PrismaClient();

/**
 * Magic Link Service
 *
 * Handles passwordless authentication for contract signing.
 * Generates secure, time-limited magic links with optional OTP verification.
 */

export interface MagicLinkOptions {
  expiresInHours?: number;
  requireOTP?: boolean;
  otpExpiresInMinutes?: number;
}

export interface OTPVerificationResult {
  success: boolean;
  sessionId?: string;
  expiresAt?: Date;
  attemptsRemaining?: number;
}

export class MagicLinkService {
  private static readonly DEFAULT_LINK_EXPIRY_HOURS = 72; // 3 days
  private static readonly DEFAULT_OTP_EXPIRY_MINUTES = 10;
  private static readonly DEFAULT_SESSION_EXPIRY_HOURS = 24;
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly OTP_LENGTH = 6;

  /**
   * Generate a secure random token
   */
  private static generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Generate a numeric OTP code
   */
  private static generateOTPCode(): string {
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    return otp.toString();
  }

  /**
   * Create magic link for contract signing
   */
  static async createMagicLink(
    contractId: string,
    options: MagicLinkOptions = {}
  ): Promise<{
    magicLinkToken: string;
    magicLinkUrl: string;
    expiresAt: Date;
  }> {
    const {
      expiresInHours = this.DEFAULT_LINK_EXPIRY_HOURS,
      requireOTP = true,
    } = options;

    const token = this.generateToken();
    const expiresAt = addHours(new Date(), expiresInHours);

    // Update contract with magic link token
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        magicLinkToken: token,
        magicLinkExpiresAt: expiresAt,
        failedAttempts: 0, // Reset failed attempts
      },
    });

    // Generate the magic link URL
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/contract/sign/${token}`;

    return {
      magicLinkToken: token,
      magicLinkUrl,
      expiresAt,
    };
  }

  /**
   * Validate magic link token
   */
  static async validateMagicLink(token: string): Promise<{
    valid: boolean;
    contractId?: string;
    expired?: boolean;
    notFound?: boolean;
  }> {
    const contract = await prisma.contract.findUnique({
      where: { magicLinkToken: token },
      select: {
        id: true,
        magicLinkExpiresAt: true,
        status: true,
        failedAttempts: true,
      },
    });

    if (!contract) {
      return { valid: false, notFound: true };
    }

    // Check if link has expired
    if (contract.magicLinkExpiresAt && isPast(contract.magicLinkExpiresAt)) {
      return { valid: false, expired: true, contractId: contract.id };
    }

    // Check if contract is already signed
    if (contract.status === 'SIGNED') {
      return { valid: false, contractId: contract.id };
    }

    // Check if too many failed attempts
    if (contract.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      return { valid: false, contractId: contract.id };
    }

    return { valid: true, contractId: contract.id };
  }

  /**
   * Generate and send OTP for additional verification
   */
  static async generateOTP(
    contractId: string,
    email: string,
    options: { expiresInMinutes?: number } = {}
  ): Promise<{
    otpCode: string;
    expiresAt: Date;
  }> {
    const { expiresInMinutes = this.DEFAULT_OTP_EXPIRY_MINUTES } = options;

    const otpCode = this.generateOTPCode();
    const expiresAt = addMinutes(new Date(), expiresInMinutes);

    // Get contract details for email
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        title: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update contract with OTP
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        otpEmail: email,
        otpCode,
        otpExpiresAt: expiresAt,
        failedAttempts: 0, // Reset on new OTP generation
      },
    });

    // Send OTP via email
    const emailTemplate = contractOTPEmail({
      recipientName: contract?.client?.name,
      otpCode,
      contractTitle: contract?.title || 'Your Contract',
      expiresInMinutes,
    });

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      template: 'contract_otp',
      metadata: {
        contractId,
        otpCode,
        expiresAt,
      },
    });

    console.log(`OTP sent to ${email} for contract ${contractId}: ${otpCode} (expires at ${expiresAt})`);

    return {
      otpCode,
      expiresAt,
    };
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(
    contractId: string,
    otpCode: string
  ): Promise<OTPVerificationResult> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        otpCode: true,
        otpExpiresAt: true,
        failedAttempts: true,
      },
    });

    if (!contract || !contract.otpCode || !contract.otpExpiresAt) {
      return { success: false };
    }

    // Check if OTP has expired
    if (isPast(contract.otpExpiresAt)) {
      return { success: false };
    }

    // Check if too many failed attempts
    if (contract.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      return {
        success: false,
        attemptsRemaining: 0,
      };
    }

    // Verify OTP
    if (contract.otpCode !== otpCode) {
      // Increment failed attempts
      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: {
          failedAttempts: { increment: 1 },
        },
        select: {
          failedAttempts: true,
        },
      });

      const attemptsRemaining = Math.max(
        0,
        this.MAX_FAILED_ATTEMPTS - updatedContract.failedAttempts
      );

      return {
        success: false,
        attemptsRemaining,
      };
    }

    // OTP is valid - create signing session
    const sessionId = this.generateToken(16);
    const sessionExpiresAt = addHours(new Date(), this.DEFAULT_SESSION_EXPIRY_HOURS);

    await prisma.contract.update({
      where: { id: contractId },
      data: {
        signerSessionId: sessionId,
        signerSessionExpiresAt: sessionExpiresAt,
        otpCode: null, // Clear OTP after successful verification
        otpExpiresAt: null,
        failedAttempts: 0,
      },
    });

    // Log the verification event
    await prisma.contractEvent.create({
      data: {
        contractId,
        type: 'OTP_VERIFIED',
        meta: {
          sessionId,
          expiresAt: sessionExpiresAt,
        },
      },
    });

    return {
      success: true,
      sessionId,
      expiresAt: sessionExpiresAt,
    };
  }

  /**
   * Validate signing session
   */
  static async validateSession(
    contractId: string,
    sessionId: string
  ): Promise<boolean> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        signerSessionId: true,
        signerSessionExpiresAt: true,
        status: true,
      },
    });

    if (!contract) {
      return false;
    }

    // Check if contract is already signed
    if (contract.status === 'SIGNED') {
      return false;
    }

    // Check if session matches
    if (contract.signerSessionId !== sessionId) {
      return false;
    }

    // Check if session has expired
    if (
      !contract.signerSessionExpiresAt ||
      isPast(contract.signerSessionExpiresAt)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Extend session expiry
   */
  static async extendSession(
    contractId: string,
    sessionId: string,
    extendByHours: number = 1
  ): Promise<Date | null> {
    const isValid = await this.validateSession(contractId, sessionId);

    if (!isValid) {
      return null;
    }

    const newExpiresAt = addHours(new Date(), extendByHours);

    await prisma.contract.update({
      where: { id: contractId },
      data: {
        signerSessionExpiresAt: newExpiresAt,
      },
    });

    return newExpiresAt;
  }

  /**
   * Invalidate session (e.g., after signing)
   */
  static async invalidateSession(contractId: string): Promise<void> {
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        signerSessionId: null,
        signerSessionExpiresAt: null,
      },
    });
  }

  /**
   * Revoke magic link
   */
  static async revokeMagicLink(contractId: string): Promise<void> {
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        magicLinkToken: null,
        magicLinkExpiresAt: null,
        otpCode: null,
        otpExpiresAt: null,
        signerSessionId: null,
        signerSessionExpiresAt: null,
        failedAttempts: 0,
      },
    });

    // Log the revocation event
    await prisma.contractEvent.create({
      data: {
        contractId,
        type: 'REISSUED',
        meta: {},
      },
    });
  }

  /**
   * Get contract info for signing (without sensitive data)
   */
  static async getContractForSigning(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        contractNumber: true,
        title: true,
        content: true,
        bodyHtml: true,
        status: true,
        pdfPath: true,
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            name: true,
          },
        },
        signedAt: true,
        createdAt: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status === 'SIGNED') {
      throw new Error('Contract is already signed');
    }

    return contract;
  }

  /**
   * Record contract view event
   */
  static async recordView(contractId: string): Promise<void> {
    // Update contract status to VIEWED if it's currently SENT
    await prisma.contract.updateMany({
      where: {
        id: contractId,
        status: 'SENT',
      },
      data: {
        status: 'VIEWED',
        viewedAt: new Date(),
      },
    });

    // Log the view event
    await prisma.contractEvent.create({
      data: {
        contractId,
        type: 'VIEWED',
        meta: {
          timestamp: new Date(),
        },
      },
    });
  }
}
