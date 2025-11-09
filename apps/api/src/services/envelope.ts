import { PrismaClient, EnvelopeStatus, SigningWorkflow, SignerStatus, SignatureStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreateEnvelopeData {
  name: string;
  description?: string;
  createdById: string;
  signingWorkflow?: SigningWorkflow;
  expiresAt?: Date;
}

export interface UpdateEnvelopeData {
  name?: string;
  description?: string;
  signingWorkflow?: SigningWorkflow;
  status?: EnvelopeStatus;
  expiresAt?: Date;
}

export interface AddSignerData {
  envelopeId: string;
  name: string;
  email: string;
  role?: string;
  sequenceNumber?: number;
}

export interface AddDocumentData {
  envelopeId: string;
  name: string;
  fileName: string;
  filePath: string;
  fileHash: string;
  fileSize: number;
}

export class EnvelopeService {
  /**
   * Create a new envelope
   */
  static async createEnvelope(data: CreateEnvelopeData) {
    return prisma.envelope.create({
      data: {
        name: data.name,
        description: data.description,
        createdById: data.createdById,
        signingWorkflow: data.signingWorkflow || 'SEQUENTIAL',
        status: 'DRAFT',
        expiresAt: data.expiresAt,
      },
      include: {
        documents: true,
        signers: true,
        signatures: true,
      },
    });
  }

  /**
   * Get envelope by ID
   */
  static async getEnvelopeById(id: string) {
    const envelope = await prisma.envelope.findUnique({
      where: { id },
      include: {
        documents: true,
        signers: {
          orderBy: { sequenceNumber: 'asc' },
        },
        signatures: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!envelope) {
      throw new Error('Envelope not found');
    }

    return envelope;
  }

  /**
   * List all envelopes
   */
  static async listEnvelopes(filters?: { status?: EnvelopeStatus; createdById?: string }) {
    return prisma.envelope.findMany({
      where: {
        status: filters?.status,
        createdById: filters?.createdById,
      },
      include: {
        documents: true,
        signers: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update envelope
   */
  static async updateEnvelope(id: string, data: UpdateEnvelopeData) {
    return prisma.envelope.update({
      where: { id },
      data,
      include: {
        documents: true,
        signers: true,
        signatures: true,
      },
    });
  }

  /**
   * Send envelope to signers
   */
  static async sendEnvelope(id: string) {
    const envelope = await this.getEnvelopeById(id);

    if (envelope.status !== 'DRAFT' && envelope.status !== 'PENDING') {
      throw new Error(`Cannot send envelope in ${envelope.status} status`);
    }

    if (envelope.signers.length === 0) {
      throw new Error('Envelope must have at least one signer');
    }

    if (envelope.documents.length === 0) {
      throw new Error('Envelope must have at least one document');
    }

    // Update status
    const updated = await prisma.envelope.update({
      where: { id },
      data: {
        status: 'PENDING',
        sentAt: new Date(),
      },
      include: {
        documents: true,
        signers: true,
        signatures: true,
        auditLogs: true,
      },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: id,
        action: 'ENVELOPE_SENT',
        metadata: {
          signerCount: envelope.signers.length,
          workflow: envelope.signingWorkflow,
        },
      },
    });

    return updated;
  }

  /**
   * Add a document to envelope
   */
  static async addDocument(data: AddDocumentData) {
    const document = await prisma.document.create({
      data: {
        envelopeId: data.envelopeId,
        name: data.name,
        fileName: data.fileName,
        filePath: data.filePath,
        fileHash: data.fileHash,
        fileSize: data.fileSize,
      },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: data.envelopeId,
        action: 'DOCUMENT_ADDED',
        metadata: {
          documentId: document.id,
          fileName: data.fileName,
          fileSize: data.fileSize,
        },
      },
    });

    return document;
  }

  /**
   * Remove document from envelope
   */
  static async removeDocument(envelopeId: string, documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.envelopeId !== envelopeId) {
      throw new Error('Document not found in this envelope');
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: envelopeId,
        action: 'DOCUMENT_REMOVED',
        metadata: {
          documentId: documentId,
          fileName: document.fileName,
        },
      },
    });

    return { success: true };
  }

  /**
   * Add a signer to envelope
   */
  static async addSigner(data: AddSignerData) {
    // Check if signer already exists
    const existing = await prisma.signer.findUnique({
      where: {
        envelopeId_email: {
          envelopeId: data.envelopeId,
          email: data.email,
        },
      },
    });

    if (existing) {
      throw new Error('Signer with this email already exists in this envelope');
    }

    const magicToken = this.generateMagicToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const signer = await prisma.signer.create({
      data: {
        envelopeId: data.envelopeId,
        name: data.name,
        email: data.email,
        role: data.role,
        sequenceNumber: data.sequenceNumber,
        status: 'PENDING',
        magicLinkToken: magicToken,
        magicLinkExpiresAt: expiresAt,
      },
    });

    // Create signature record
    await prisma.signature.create({
      data: {
        envelopeId: data.envelopeId,
        signerId: signer.id,
        status: 'PENDING',
      },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: data.envelopeId,
        action: 'SIGNER_ADDED',
        metadata: {
          signerId: signer.id,
          signerEmail: signer.email,
          signerName: signer.name,
          role: signer.role,
        },
      },
    });

    return signer;
  }

  /**
   * Remove signer from envelope
   */
  static async removeSigner(envelopeId: string, signerId: string) {
    const signer = await prisma.signer.findUnique({
      where: { id: signerId },
    });

    if (!signer || signer.envelopeId !== envelopeId) {
      throw new Error('Signer not found in this envelope');
    }

    // Delete associated signatures
    await prisma.signature.deleteMany({
      where: { signerId },
    });

    // Delete signer
    await prisma.signer.delete({
      where: { id: signerId },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: envelopeId,
        action: 'SIGNER_REMOVED',
        metadata: {
          signerId: signerId,
          signerEmail: signer.email,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get signer by magic link token
   */
  static async getSignerByMagicToken(token: string) {
    const signer = await prisma.signer.findUnique({
      where: { magicLinkToken: token },
      include: {
        envelope: true,
        signatures: true,
      },
    });

    if (!signer) {
      throw new Error('Invalid magic link');
    }

    // Check if expired
    if (signer.magicLinkExpiresAt < new Date()) {
      throw new Error('Magic link has expired');
    }

    return signer;
  }

  /**
   * View envelope (mark as viewed)
   */
  static async viewEnvelope(signerId: string) {
    const signer = await prisma.signer.update({
      where: { id: signerId },
      data: {
        status: 'VIEWED',
        viewedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: signer.envelopeId,
        action: 'SIGNER_VIEWED',
        metadata: {
          signerId: signerId,
          signerEmail: signer.email,
        },
      },
    });

    return signer;
  }

  /**
   * Check if signer can sign (for sequential workflow)
   */
  static async canSignEnvelope(envelopeId: string, signerId: string): Promise<boolean> {
    const envelope = await prisma.envelope.findUnique({
      where: { id: envelopeId },
      include: {
        signers: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!envelope) {
      throw new Error('Envelope not found');
    }

    const signer = await prisma.signer.findUnique({
      where: { id: signerId },
    });

    if (!signer) {
      throw new Error('Signer not found');
    }

    // For parallel workflow, everyone can sign anytime
    if (envelope.signingWorkflow === 'PARALLEL') {
      return true;
    }

    // For sequential workflow, check if all previous signers have signed
    if (envelope.signingWorkflow === 'SEQUENTIAL') {
      const signerSequence = signer.sequenceNumber;

      if (signerSequence === null) {
        return false; // Signer has no sequence number
      }

      // Get all signers with lower sequence numbers
      const previousSigners = envelope.signers.filter((s) => s.sequenceNumber !== null && s.sequenceNumber < signerSequence);

      // Check if all previous signers have signed
      for (const prevSigner of previousSigners) {
        const signature = await prisma.signature.findFirst({
          where: {
            signerId: prevSigner.id,
          },
        });

        if (!signature || signature.status !== 'SIGNED') {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Capture signature
   */
  static async captureSignature(
    signerId: string,
    envelopeId: string,
    signatureDataUrl: string,
    initialsDataUrl?: string,
    pageNumber?: number,
    coordinates?: { x: number; y: number; width: number; height: number }
  ) {
    // Check if signer can sign
    const canSign = await this.canSignEnvelope(envelopeId, signerId);
    if (!canSign) {
      throw new Error('Signer cannot sign at this time (workflow constraints)');
    }

    // Generate hash of signature
    const signatureHash = crypto
      .createHash('sha256')
      .update(signatureDataUrl)
      .digest('hex');

    const signature = await prisma.signature.update({
      where: {
        envelopeId_signerId: {
          envelopeId,
          signerId,
        },
      },
      data: {
        status: 'SIGNED',
        signatureDataUrl,
        initialsDataUrl,
        signatureHash,
        pageNumber,
        xCoordinate: coordinates?.x,
        yCoordinate: coordinates?.y,
        width: coordinates?.width,
        height: coordinates?.height,
        signedAt: new Date(),
        signerIP: undefined, // Will be set by route
        signerUserAgent: undefined, // Will be set by route
      },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: envelopeId,
        action: 'SIGNER_SIGNED',
        metadata: {
          signerId: signerId,
          signatureHash,
          pageNumber,
        },
      },
    });

    // Check if all signers have signed
    const allSignatures = await prisma.signature.findMany({
      where: { envelopeId },
    });

    const allSigned = allSignatures.every((sig) => sig.status === 'SIGNED');

    if (allSigned) {
      // Mark envelope as completed
      await prisma.envelope.update({
        where: { id: envelopeId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Create audit log
      await prisma.envelopeAuditLog.create({
        data: {
          envelopeId: envelopeId,
          action: 'ENVELOPE_COMPLETED',
          metadata: {
            completedAt: new Date().toISOString(),
            totalSigners: allSignatures.length,
          },
        },
      });
    }

    return signature;
  }

  /**
   * Decline signature
   */
  static async declineSignature(signerId: string, envelopeId: string, reason?: string) {
    const signer = await prisma.signer.update({
      where: { id: signerId },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declinedReason: reason,
      },
    });

    // Update signature status
    await prisma.signature.updateMany({
      where: { signerId },
      data: { status: 'DECLINED' },
    });

    // Update envelope status
    await prisma.envelope.update({
      where: { id: envelopeId },
      data: { status: 'CANCELLED' },
    });

    // Create audit log
    await prisma.envelopeAuditLog.create({
      data: {
        envelopeId: envelopeId,
        action: 'SIGNER_DECLINED',
        metadata: {
          signerId: signerId,
          signerEmail: signer.email,
          reason: reason,
        },
      },
    });

    return signer;
  }

  /**
   * Get envelope statistics
   */
  static async getEnvelopeStats() {
    const total = await prisma.envelope.count();
    const byStatus = await prisma.envelope.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalSigners = await prisma.signer.count();
    const totalSignatures = await prisma.signature.count();

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((item) => [item.status, item._count])),
      totalSigners,
      totalSignatures,
    };
  }

  /**
   * Generate magic token
   */
  private static generateMagicToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify signature integrity
   */
  static async verifySignatureIntegrity(signatureId: string): Promise<boolean> {
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
    });

    if (!signature || !signature.signatureDataUrl || !signature.signatureHash) {
      return false;
    }

    const hash = crypto
      .createHash('sha256')
      .update(signature.signatureDataUrl)
      .digest('hex');

    return hash === signature.signatureHash;
  }

  /**
   * Get envelope for signer
   */
  static async getEnvelopeForSigner(signerId: string) {
    const signer = await prisma.signer.findUnique({
      where: { id: signerId },
      include: {
        envelope: {
          include: {
            documents: true,
            signers: {
              orderBy: { sequenceNumber: 'asc' },
            },
            signatures: true,
          },
        },
        signatures: true,
      },
    });

    if (!signer) {
      throw new Error('Signer not found');
    }

    return signer;
  }
}
