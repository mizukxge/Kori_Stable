/**
 * Contract Signing Service
 * Handles e-signature workflow including OTP verification, signature capture, and document signing
 */

import { prisma } from '../db.js';
import { randomBytes } from 'crypto';
import { hashSync, compareSync } from 'bcryptjs';

interface SignatureData {
  signerName: string;
  signerEmail: string;
  signatureType: 'draw' | 'type' | 'upload'; // Type of signature
  signatureDataUrl?: string; // Base64 encoded signature image (for draw)
  signatureText?: string; // Typed name (for type)
  signatureFile?: Buffer; // Uploaded signature file (for upload)
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface OTPVerificationResult {
  success: boolean;
  sessionId?: string;
  message: string;
  contractId?: string;
}

interface SigningSessionData {
  contractId: string;
  token: string;
  otpVerified: boolean;
  passwordVerified: boolean;
  sessionStarted: Date;
}

export class ContractSigningService {
  /**
   * Request OTP for contract signing
   */
  static async requestOTP(contractId: string, email: string): Promise<{ otpSent: boolean; expiresIn: number }> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Verify email matches contract
      if (contract.otpEmail && contract.otpEmail !== email) {
        throw new Error('Email does not match contract');
      }

      // Check if OTP was recently sent (rate limiting: 60 second cooldown)
      if (contract.otpExpiresAt && contract.otpExpiresAt > new Date()) {
        const now = new Date();
        const remaining = Math.ceil((contract.otpExpiresAt.getTime() - now.getTime()) / 1000);
        throw new Error(`OTP already sent. Try again in ${remaining} seconds`);
      }

      // Generate new OTP (6 digits)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Set OTP to expire in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Update contract with OTP
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          otpEmail: email,
          otpCode,
          otpExpiresAt: expiresAt,
          otpAttempts: 0, // Reset attempt counter
        },
      });

      // TODO: Send OTP via email (integrate with email service)
      console.log(`[DEV] OTP for contract ${contractId}: ${otpCode}`);

      return {
        otpSent: true,
        expiresIn: 15 * 60, // 15 minutes in seconds
      };
    } catch (error) {
      console.error('Error requesting OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP for contract signing
   */
  static async verifyOTP(contractId: string, otpCode: string): Promise<OTPVerificationResult> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return {
          success: false,
          message: 'Contract not found',
        };
      }

      // Check if OTP has expired
      if (!contract.otpExpiresAt || contract.otpExpiresAt < new Date()) {
        return {
          success: false,
          message: 'OTP has expired. Please request a new one',
        };
      }

      // Check if max attempts exceeded
      if (contract.otpAttempts && contract.otpAttempts >= 3) {
        // Lock the signing link
        await prisma.contract.update({
          where: { id: contractId },
          data: {
            magicLinkExpiresAt: new Date(), // Immediately expire the magic link
          },
        });

        return {
          success: false,
          message: 'Too many failed OTP attempts. Signing link has been revoked. Please request a new link from the sender.',
        };
      }

      // Verify OTP
      if (contract.otpCode !== otpCode) {
        // Increment failed attempts
        await prisma.contract.update({
          where: { id: contractId },
          data: {
            otpAttempts: (contract.otpAttempts || 0) + 1,
          },
        });

        return {
          success: false,
          message: 'Incorrect OTP. Please try again',
        };
      }

      // OTP verified successfully
      // Generate session ID
      const sessionId = randomBytes(32).toString('hex');
      const sessionExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minute session

      // Update contract with session
      const updated = await prisma.contract.update({
        where: { id: contractId },
        data: {
          signerSessionId: sessionId,
          signerSessionExpiresAt: sessionExpiresAt,
          otpAttempts: 0, // Reset attempts on successful verification
          // Clear OTP after successful verification
          otpCode: null,
          otpExpiresAt: null,
        },
      });

      return {
        success: true,
        sessionId,
        message: 'OTP verified successfully',
        contractId: updated.id,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Verify portal password
   */
  static async verifyPassword(contractId: string, password: string): Promise<OTPVerificationResult> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return {
          success: false,
          message: 'Contract not found',
        };
      }

      // Check if password hash exists
      if (!contract.portalPasswordHash) {
        return {
          success: false,
          message: 'No password set for this contract',
        };
      }

      // Check failed attempts
      if (contract.failedAttempts >= 6) {
        // Void the contract signing
        await prisma.contract.update({
          where: { id: contractId },
          data: {
            magicLinkExpiresAt: new Date(), // Immediately expire
          },
        });

        return {
          success: false,
          message: 'Too many failed password attempts. Signing link has been revoked.',
        };
      }

      // Verify password
      const passwordMatch = compareSync(password, contract.portalPasswordHash);

      if (!passwordMatch) {
        // Increment failed attempts
        await prisma.contract.update({
          where: { id: contractId },
          data: {
            failedAttempts: (contract.failedAttempts || 0) + 1,
          },
        });

        return {
          success: false,
          message: 'Incorrect password',
        };
      }

      // Password verified successfully
      const sessionId = randomBytes(32).toString('hex');
      const sessionExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.contract.update({
        where: { id: contractId },
        data: {
          signerSessionId: sessionId,
          signerSessionExpiresAt: sessionExpiresAt,
          failedAttempts: 0, // Reset attempts on successful verification
        },
      });

      return {
        success: true,
        sessionId,
        message: 'Password verified successfully',
        contractId,
      };
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Validate active signing session
   */
  static async validateSession(contractId: string, sessionId: string): Promise<boolean> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return false;
      }

      // Check if session ID matches and is not expired
      if (
        contract.signerSessionId === sessionId &&
        contract.signerSessionExpiresAt &&
        contract.signerSessionExpiresAt > new Date()
      ) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Record signature on contract
   */
  static async recordSignature(
    contractId: string,
    sessionId: string,
    signatureData: SignatureData,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate session
      const sessionValid = await this.validateSession(contractId, sessionId);
      if (!sessionValid) {
        return {
          success: false,
          message: 'Invalid or expired session. Please start over.',
        };
      }

      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { createdByUser: true },
      });

      if (!contract) {
        return {
          success: false,
          message: 'Contract not found',
        };
      }

      // Update contract with signature details
      const updated = await prisma.contract.update({
        where: { id: contractId },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
          signatureIP: signatureData.ipAddress,
          signatureAgent: signatureData.userAgent,
          // TODO: Store signature image/data securely (encryption at rest)
          // signatureDataUrl: encryptSignature(signatureData.signatureDataUrl),
        },
      });

      // Create audit event
      await prisma.contractEvent.create({
        data: {
          contractId: updated.id,
          type: 'SIGNED',
          ip: this.hashIP(signatureData.ipAddress),
          userAgent: this.hashUserAgent(signatureData.userAgent),
          meta: {
            signerName: signatureData.signerName,
            signerEmail: signatureData.signerEmail,
            signatureType: signatureData.signatureType,
            timestamp: signatureData.timestamp.toISOString(),
          },
        },
      });

      // Expire the session
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          signerSessionId: null,
          signerSessionExpiresAt: null,
        },
      });

      // TODO: Generate signed PDF with signature embedded
      // TODO: Send signature confirmation email to client
      // TODO: Notify admin of signature

      return {
        success: true,
        message: 'Signature recorded successfully. Contract has been signed.',
      };
    } catch (error) {
      console.error('Error recording signature:', error);
      return {
        success: false,
        message: 'Failed to record signature. Please try again.',
      };
    }
  }

  /**
   * Hash IP address for privacy
   */
  private static hashIP(ip: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  /**
   * Hash user agent for privacy
   */
  private static hashUserAgent(ua: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ua).digest('hex');
  }

  /**
   * Set portal password
   */
  static async setPortalPassword(contractId: string, password: string): Promise<{ success: boolean }> {
    try {
      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const hash = hashSync(password, 10);

      await prisma.contract.update({
        where: { id: contractId },
        data: {
          portalPasswordHash: hash,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting portal password:', error);
      throw error;
    }
  }

  /**
   * Get contract for signing view (public access)
   */
  static async getContractForSigning(contractId: string) {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          client: true,
          template: true,
          proposal: true,
        },
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Check if signing link has expired
      if (contract.magicLinkExpiresAt && contract.magicLinkExpiresAt < new Date()) {
        throw new Error('Signing link has expired');
      }

      // Return contract without sensitive fields
      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        status: contract.status,
        signByAt: contract.signByAt,
        client: contract.client,
        bodyHtml: contract.bodyHtml,
        content: contract.content,
        requiresPassword: !!contract.portalPasswordHash,
        requiresOTP: !!contract.otpEmail,
      };
    } catch (error) {
      console.error('Error getting contract for signing:', error);
      throw error;
    }
  }
}
