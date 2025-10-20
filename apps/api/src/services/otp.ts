import { randomInt } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OTPResult {
  code: string;
  expiresAt: Date;
}

export interface OTPValidation {
  valid: boolean;
  reason?: string;
  attemptsRemaining?: number;
}

export class OTPService {
  // OTP configuration
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 15;
  private static readonly MAX_ATTEMPTS = 5;

  /**
   * Generate a random OTP code
   */
  static generateCode(): string {
    // Generate 6-digit code
    const code = randomInt(0, 999999)
      .toString()
      .padStart(this.OTP_LENGTH, '0');
    
    return code;
  }

  /**
   * Generate OTP for proposal acceptance
   */
  static async generateForProposal(proposalId: string): Promise<OTPResult> {
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Update proposal with new OTP
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        otpCode: code,
        otpExpiresAt: expiresAt,
        otpAttempts: 0, // Reset attempts on new OTP
      },
    });

    return { code, expiresAt };
  }

  /**
   * Validate OTP for proposal acceptance
   */
  static async validateForProposal(
    proposalId: string,
    submittedCode: string
  ): Promise<OTPValidation> {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        otpCode: true,
        otpExpiresAt: true,
        otpAttempts: true,
        status: true,
      },
    });

    if (!proposal) {
      return {
        valid: false,
        reason: 'Proposal not found',
      };
    }

    // Check if proposal is already accepted/declined
    if (proposal.status === 'ACCEPTED' || proposal.status === 'DECLINED') {
      return {
        valid: false,
        reason: 'Proposal has already been processed',
      };
    }

    // Check if OTP exists
    if (!proposal.otpCode || !proposal.otpExpiresAt) {
      return {
        valid: false,
        reason: 'No OTP code has been generated. Please request a new code.',
      };
    }

    // Check if OTP has expired
    if (proposal.otpExpiresAt < new Date()) {
      return {
        valid: false,
        reason: 'OTP code has expired. Please request a new code.',
      };
    }

    // Check if max attempts exceeded
    if (proposal.otpAttempts >= this.MAX_ATTEMPTS) {
      return {
        valid: false,
        reason: 'Maximum attempts exceeded. Please request a new code.',
      };
    }

    // Increment attempt counter
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        otpAttempts: { increment: 1 },
      },
    });

    // Check if code matches
    if (proposal.otpCode !== submittedCode) {
      const attemptsRemaining = this.MAX_ATTEMPTS - (proposal.otpAttempts + 1);
      
      return {
        valid: false,
        reason: 'Invalid OTP code',
        attemptsRemaining: Math.max(0, attemptsRemaining),
      };
    }

    // Valid OTP - clear it so it can't be reused
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
    });

    return {
      valid: true,
    };
  }

  /**
   * Invalidate OTP (e.g., after use or on request)
   */
  static async invalidateForProposal(proposalId: string): Promise<void> {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
    });
  }

  /**
   * Check if OTP is still valid (without validating)
   */
  static async isValidForProposal(proposalId: string): Promise<boolean> {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        otpCode: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });

    if (!proposal || !proposal.otpCode || !proposal.otpExpiresAt) {
      return false;
    }

    if (proposal.otpExpiresAt < new Date()) {
      return false;
    }

    if (proposal.otpAttempts >= this.MAX_ATTEMPTS) {
      return false;
    }

    return true;
  }

  /**
   * Format OTP code for display (e.g., "123-456")
   */
  static formatCode(code: string): string {
    if (code.length === 6) {
      return `${code.slice(0, 3)}-${code.slice(3)}`;
    }
    return code;
  }

  /**
   * Parse formatted OTP code (remove dashes)
   */
  static parseCode(formattedCode: string): string {
    return formattedCode.replace(/[^0-9]/g, '');
  }
}