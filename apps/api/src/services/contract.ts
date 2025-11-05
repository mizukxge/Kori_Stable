import { PrismaClient, ContractStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { TemplateService } from './template.js';
import { PDFGeneratorService } from './pdf-generator.js';
import { MagicLinkService } from './magic-link.js';
import { sendEmail } from './email.js';
import { contractMagicLinkEmail } from './email-templates.js';
import { sendContractEmail, sendResendContractEmail } from './ses.js';

const prisma = new PrismaClient();

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts');

export interface GenerateContractData {
  templateId: string;
  title: string;
  clientId?: string;
  proposalId?: string;
  variables: Record<string, any>;
}

export interface UpdateContractData {
  title?: string;
  status?: ContractStatus;
}

export class ContractService {
  /**
   * Initialize contracts directory
   */
  static async initializeStorage(): Promise<void> {
    await fs.mkdir(CONTRACTS_DIR, { recursive: true });
  }

  /**
   * Generate contract number (e.g., CONT-2025-001)
   */
  static async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CONT-${year}`;

    // Get count of contracts for this year
    const count = await prisma.contract.count({
      where: {
        contractNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Substitute variables in template content
   */
  static substituteVariables(
    content: string,
    variables: Record<string, any>
  ): string {
    let result = content;

    // Add current date helpers
    const now = new Date();
    const enrichedVariables = {
      ...variables,
      date: now.toLocaleDateString(),
      today: now.toLocaleDateString(),
      datetime: now.toLocaleString(),
      year: now.getFullYear().toString(),
    };

    // Extract all variables from template
    const templateVars = TemplateService.extractVariables(content);

    // Replace each variable
    for (const varName of templateVars) {
      const value = this.resolveVariable(varName, enrichedVariables);
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Resolve nested variable path (e.g., client.name)
   */
  private static resolveVariable(
    path: string,
    data: Record<string, any>
  ): string {
    const parts = path.split('.');
    let value: any = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return `[${path}]`; // Return placeholder if not found
      }
    }

    return value?.toString() || '';
  }

  /**
   * Generate contract from template
   */
  static async generateContract(data: GenerateContractData, userId: string) {
    await this.initializeStorage();

    // Get template
    const template = await TemplateService.getTemplateById(data.templateId);

    if (!template.isActive) {
      throw new Error('Template is not active');
    }

    // Generate contract number
    const contractNumber = await this.generateContractNumber();

    // Enrich variables with contextual data
    let enrichedVariables = { ...data.variables };

    // Add client data if provided
    if (data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });
      if (client) {
        enrichedVariables.client = {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
        };
      }
    }

    // Add proposal data if provided
    if (data.proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: data.proposalId },
        include: { items: true },
      });
      if (proposal) {
        enrichedVariables.proposal = {
          number: proposal.proposalNumber,
          title: proposal.title,
          subtotal: proposal.subtotal.toString(),
          tax: proposal.taxAmount.toString(),
          total: proposal.total.toString(),
          items: proposal.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            amount: item.amount.toString(),
          })),
        };
      }
    }

    // Add admin user data
    const admin = await prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (admin) {
      enrichedVariables.admin = {
        name: admin.name,
        email: admin.email,
      };
    }

    // Substitute variables in template
    const content = this.substituteVariables(template.content, enrichedVariables);

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        title: data.title,
        templateId: data.templateId,
        templateVersion: template.version,
        content,
        variables: enrichedVariables,
        clientId: data.clientId,
        proposalId: data.proposalId,
        createdBy: userId,
      },
      include: {
        template: true,
        client: true,
        proposal: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Contract',
        entityId: contract.id,
        userId,
        clientId: data.clientId,
        metadata: {
          contractNumber,
          templateName: template.name,
          title: data.title,
        },
      },
    });

    // Send contract email to client if client exists
    if (contract.client && contract.client.email) {
      try {
        await sendContractEmail(
          contract.client.email,
          contract.id,
          contract.client.name
        );
        console.log(`[Contract] Email sent to ${contract.client.email} for contract ${contractNumber}`);
      } catch (error: any) {
        console.error(`[Contract] Failed to send email for contract ${contractNumber}:`, error.message);
        // Log the email failure but don't fail the contract creation
        await prisma.auditLog.create({
          data: {
            action: 'EMAIL_FAILED',
            entityType: 'Contract',
            entityId: contract.id,
            userId,
            clientId: data.clientId,
            metadata: {
              contractNumber,
              error: error.message,
            },
          },
        });
      }
    }

    return contract;
  }

  /**
   * List contracts
   */
  static async listContracts(filters: {
    clientId?: string;
    templateId?: string;
    status?: ContractStatus;
  } = {}) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { name: true },
        },
        client: {
          select: { name: true, email: true },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    return contracts;
  }

  /**
   * Get contract by ID
   */
  static async getContractById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        template: true,
        client: true,
        proposal: true,
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  /**
   * Get contract by number
   */
  static async getContractByNumber(contractNumber: string) {
    const contract = await prisma.contract.findUnique({
      where: { contractNumber },
      include: {
        template: true,
        client: true,
        proposal: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  /**
   * Update contract
   */
  static async updateContract(
    id: string,
    data: UpdateContractData,
    userId: string
  ) {
    const existing = await this.getContractById(id);

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Contract',
        entityId: id,
        userId,
        clientId: updated.clientId,
        changes: {
          old: { title: existing.title, status: existing.status },
          new: { title: updated.title, status: updated.status },
        },
      },
    });

    return updated;
  }

  /**
   * Send contract
   */
  static async sendContract(id: string, userId: string) {
    const contract = await this.getContractById(id);

    if (contract.status !== 'DRAFT') {
      throw new Error('Only draft contracts can be sent');
    }

    if (!contract.client || !contract.client.email) {
      throw new Error('Contract must have a client with valid email');
    }

    // Generate PDF if not exists
    if (!contract.pdfPath) {
      await this.generatePDF(id);
    }

    // Create magic link for contract signing
    const magicLink = await MagicLinkService.createMagicLink(id, {
      expiresInHours: 72, // 3 days
    });

    // Update contract status
    const sent = await prisma.contract.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Send contract via email
    const emailTemplate = contractMagicLinkEmail({
      recipientName: contract.client.name,
      contractTitle: contract.title,
      contractNumber: contract.contractNumber,
      magicLink: magicLink.magicLinkUrl,
      expiresInHours: 72,
      photographerName: process.env.PHOTOGRAPHER_NAME || 'Kori Photography',
    });

    await sendEmail({
      to: contract.client.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      template: 'contract_magic_link',
      metadata: {
        contractId: id,
        contractNumber: contract.contractNumber,
        magicLinkToken: magicLink.magicLinkToken,
        expiresAt: magicLink.expiresAt,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SEND',
        entityType: 'Contract',
        entityId: id,
        userId,
        clientId: contract.clientId,
      },
    });

    console.log(`Contract ${contract.contractNumber} sent to ${contract.client.email}`);

    return sent;
  }

  /**
   * Generate PDF for contract
   */
  static async generatePDF(contractId: string): Promise<string> {
    const contract = await this.getContractById(contractId);

    const filename = `${contract.contractNumber}.pdf`;
    const filepath = path.join(CONTRACTS_DIR, filename);

    // Create PDF document
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = doc.pipe(createWriteStream(filepath));

    // Header
    doc.fontSize(20).text('CONTRACT', { align: 'center' });
    doc.fontSize(12).text(contract.contractNumber, { align: 'center' });
    doc.moveDown();

    // Title
    doc.fontSize(16).text(contract.title);
    doc.moveDown();

    // Contract content - split by paragraphs
    const paragraphs = contract.content.split('\n\n');
    doc.fontSize(11);

    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        doc.text(paragraph.trim(), { align: 'justify' });
        doc.moveDown();
      }
    }

    // Signature section
    doc.moveDown(2);
    doc.fontSize(10);
    
    if (contract.signedAt) {
      doc.text(`Signed on: ${contract.signedAt.toLocaleDateString()}`);
    } else {
      doc.text('Signature: ___________________________');
      doc.moveDown();
      doc.text('Date: ___________________________');
    }

    // Footer
    doc.fontSize(8)
      .text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: 'center',
      });

    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve) => stream.on('finish', resolve));

    // Update contract with PDF path
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        pdfPath: filepath,
      },
    });

    return filepath;
  }

  /**
   * Delete contract
   */
  static async deleteContract(id: string, userId: string) {
    const contract = await this.getContractById(id);

    // Delete PDF if exists
    if (contract.pdfPath) {
      try {
        await fs.unlink(contract.pdfPath);
      } catch (error) {
        console.error('Failed to delete PDF:', error);
      }
    }

    await prisma.contract.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Contract',
        entityId: id,
        userId,
        clientId: contract.clientId,
        metadata: {
          contractNumber: contract.contractNumber,
          title: contract.title,
        },
      },
    });

    return contract;
  }

  /**
   * Get contract statistics
   */
  static async getContractStats() {
    const [total, byStatus] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const stats: any = {
      total,
      byStatus: {},
    };

    byStatus.forEach((status) => {
      stats.byStatus[status.status] = status._count;
    });

    return stats;
  }

  /**
   * Generate PDF for contract
   */
  static async generatePDF(contractId: string, userId?: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        template: true,
        client: true,
        createdByUser: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (!contract.content && !contract.bodyHtml) {
      throw new Error('Contract has no content to generate PDF');
    }

    // Use bodyHtml if available, otherwise use content
    const html = contract.bodyHtml || contract.content || '';

    // Generate PDF using the PDF Generator Service
    const result = await PDFGeneratorService.generatePDF({
      contractId: contract.id,
      html,
      metadata: {
        title: contract.title,
        author: contract.createdByUser?.name || 'Kori Photography',
        subject: `Contract ${contract.contractNumber}`,
        keywords: ['contract', contract.template?.name || 'agreement'],
        creator: 'Kori Contract System',
        producer: 'Kori PDF Generator v1.0',
      },
      footer: {
        includePageNumbers: true,
        includeDate: true,
        customText: `Contract ${contract.contractNumber}`,
      },
    });

    // Log the PDF generation event
    await prisma.auditLog.create({
      data: {
        action: 'GENERATE_PDF',
        entityType: 'Contract',
        entityId: contract.id,
        userId,
        clientId: contract.clientId,
        metadata: {
          contractNumber: contract.contractNumber,
          pdfPath: result.filePath,
          fileHash: result.fileHash,
          pageCount: result.pageCount,
        },
      },
    });

    // Update contract to mark that  has a PDF
    return prisma.contract.update({
      where: { id: contractId },
      data: {
        pdfPath: result.filePath,
        pdfHash: result.fileHash,
        pdfGeneratedAt: result.generatedAt,
      },
      include: {
        template: true,
        client: true,
        createdByUser: true,
      },
    });
  }

  /**
   * Verify PDF integrity
   */
  static async verifyPDF(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { pdfPath: true, pdfHash: true },
    });

    if (!contract || !contract.pdfPath || !contract.pdfHash) {
      throw new Error('Contract has no PDF to verify');
    }

    const isValid = await PDFGeneratorService.verifyPDF(
      contract.pdfPath,
      contract.pdfHash
    );

    return {
      isValid,
      pdfPath: contract.pdfPath,
      pdfHash: contract.pdfHash,
    };
  }

  /**
   * Get PDF info
   */
  static async getPDFInfo(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { pdfPath: true },
    });

    if (!contract || !contract.pdfPath) {
      throw new Error('Contract has no PDF');
    }

    return PDFGeneratorService.getPDFInfo(contract.pdfPath);
  }

  /**
   * Regenerate PDF (e.g., after contract updates)
   */
  static async regeneratePDF(contractId: string, userId?: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { pdfPath: true },
    });

    // Delete old PDF if exists
    if (contract?.pdfPath) {
      await PDFGeneratorService.deletePDF(contract.pdfPath);
    }

    // Generate new PDF
    return this.generatePDF(contractId, userId);
  }

  /**
   * Send contract to client for signing
   */
  static async sendContract(contractId: string, userId?: string) {
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

    if (!contract.client || !contract.client.email) {
      throw new Error('Contract has no client or client email');
    }

    // Generate PDF if not already generated
    if (!contract.pdfPath) {
      await this.generatePDF(contractId, userId);
    }

    // Create magic link
    const magicLink = await MagicLinkService.createMagicLink(contractId, {
      expiresInHours: 72, // 3 days
      requireOTP: true,
    });

    // Update contract status to SENT
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.SENT,
        sentAt: new Date(),
      },
      include: {
        client: true,
        template: true,
        createdByUser: true,
      },
    });

    // Log the send event
    await prisma.contractEvent.create({
      data: {
        contractId,
        type: 'SENT',
        meta: {
          clientEmail: contract.client.email,
          magicLinkUrl: magicLink.magicLinkUrl,
          expiresAt: magicLink.expiresAt,
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'SEND_CONTRACT',
        entityType: 'Contract',
        entityId: contractId,
        userId,
        clientId: contract.clientId,
        metadata: {
          contractNumber: contract.contractNumber,
          clientEmail: contract.client.email,
        },
      },
    });

    // TODO: Send email to client with magic link
    // await EmailService.sendContractForSigning({
    //   to: contract.client.email,
    //   clientName: contract.client.name,
    //   contractTitle: contract.title,
    //   contractNumber: contract.contractNumber,
    //   magicLinkUrl: magicLink.magicLinkUrl,
    //   expiresAt: magicLink.expiresAt,
    // });

    console.log(`Contract sent to ${contract.client.email}`);
    console.log(`Magic link: ${magicLink.magicLinkUrl}`);

    return {
      ...updatedContract,
      magicLinkUrl: magicLink.magicLinkUrl,
      magicLinkExpiresAt: magicLink.expiresAt,
    };
  }

  /**
   * Resend contract to client (revokes old magic link and generates new one)
   */
  static async resendContract(contractId: string, userId?: string) {
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
      throw new Error('Cannot resend a signed contract');
    }

    if (contract.status === 'DECLINED') {
      throw new Error('Cannot resend a declined contract');
    }

    if (!contract.client || !contract.client.email) {
      throw new Error('Contract has no client or client email');
    }

    // Revoke old magic link
    await MagicLinkService.revokeMagicLink(contractId);

    // Create new magic link
    const magicLink = await MagicLinkService.createMagicLink(contractId, {
      expiresInHours: 72, // 3 days
      requireOTP: true,
    });

    // Update contract status and timestamp
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.SENT,
        sentAt: new Date(),
      },
      include: {
        client: true,
        template: true,
        createdByUser: true,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'RESEND_CONTRACT',
        entityType: 'Contract',
        entityId: contractId,
        userId,
        clientId: contract.clientId,
        metadata: {
          contractNumber: contract.contractNumber,
          clientEmail: contract.client.email,
          newMagicLinkUrl: magicLink.magicLinkUrl,
          expiresAt: magicLink.expiresAt,
        },
      },
    });

    // Send resend contract email to client
    try {
      await sendResendContractEmail(
        contract.client.email,
        contractId,
        contract.client.name
      );
      console.log(`[Contract] Resend email sent to ${contract.client.email} for contract ${contract.contractNumber}`);
    } catch (error: any) {
      console.error(`[Contract] Failed to send resend email for contract ${contract.contractNumber}:`, error.message);
      // Log the email failure but don't fail the resend operation
      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_FAILED',
          entityType: 'Contract',
          entityId: contractId,
          userId,
          clientId: contract.clientId,
          metadata: {
            contractNumber: contract.contractNumber,
            action: 'RESEND',
            error: error.message,
          },
        },
      });
    }

    console.log(`Contract ${contract.contractNumber} resent to ${contract.client.email}`);
    console.log(`New magic link: ${magicLink.magicLinkUrl}`);
    console.log(`Expires at: ${magicLink.expiresAt}`);

    return {
      ...updatedContract,
      magicLinkUrl: magicLink.magicLinkUrl,
      magicLinkExpiresAt: magicLink.expiresAt,
    };
  }

  /**
   * Get all events for a contract (audit trail)
   */
  static async getContractEvents(contractId: string) {
    // Verify contract exists
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Fetch all contract events
    const events = await prisma.contractEvent.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch related audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Contract',
        entityId: contractId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      contractEvents: events,
      auditLogs: auditLogs,
    };
  }
}