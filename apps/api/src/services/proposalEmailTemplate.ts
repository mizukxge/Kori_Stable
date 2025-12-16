/**
 * Proposal Email Template Service
 * Manages email templates for sending proposals to clients
 */

import { PrismaClient, ProposalEmailTemplate } from '@prisma/client';
import { VariableSubstitutionService } from './variableSubstitution.js';

const prisma = new PrismaClient();

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  content: string;
  isDefault?: boolean;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  content?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface RenderTemplateResult {
  subject: string;
  content: string;
  variables: string[];
}

export class ProposalEmailTemplateService {
  /**
   * Create a new email template
   */
  static async createTemplate(
    userId: string,
    data: CreateEmailTemplateInput
  ): Promise<ProposalEmailTemplate> {
    console.log('[ProposalEmailTemplateService] Creating email template:', {
      userId,
      name: data.name,
    });

    // If this is marked as default, unset other defaults for this user
    if (data.isDefault) {
      await prisma.proposalEmailTemplate.updateMany({
        where: {
          createdBy: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.proposalEmailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        isDefault: data.isDefault || false,
        createdBy: userId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('[ProposalEmailTemplateService] Email template created:', template.id);
    return template;
  }

  /**
   * List all templates for a user
   */
  static async listTemplates(userId: string): Promise<ProposalEmailTemplate[]> {
    console.log('[ProposalEmailTemplateService] Listing email templates for user:', userId);

    const templates = await prisma.proposalEmailTemplate.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    console.log('[ProposalEmailTemplateService] Found templates:', templates.length);
    return templates;
  }

  /**
   * Get a single template by ID
   */
  static async getTemplate(id: string, userId: string): Promise<ProposalEmailTemplate> {
    console.log('[ProposalEmailTemplateService] Getting template:', id);

    const template = await prisma.proposalEmailTemplate.findFirst({
      where: {
        id,
        createdBy: userId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Email template not found');
    }

    return template;
  }

  /**
   * Update an email template
   */
  static async updateTemplate(
    id: string,
    userId: string,
    data: UpdateEmailTemplateInput
  ): Promise<ProposalEmailTemplate> {
    console.log('[ProposalEmailTemplateService] Updating template:', id);

    // Check ownership
    const existing = await this.getTemplate(id, userId);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.proposalEmailTemplate.updateMany({
        where: {
          createdBy: userId,
          isDefault: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.proposalEmailTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('[ProposalEmailTemplateService] Template updated:', template.id);
    return template;
  }

  /**
   * Delete an email template (soft delete by setting isActive = false)
   */
  static async deleteTemplate(id: string, userId: string): Promise<ProposalEmailTemplate> {
    console.log('[ProposalEmailTemplateService] Deleting template:', id);

    // Check ownership
    await this.getTemplate(id, userId);

    const template = await prisma.proposalEmailTemplate.update({
      where: { id },
      data: {
        isActive: false,
        isDefault: false, // Can't be default if deleted
      },
    });

    console.log('[ProposalEmailTemplateService] Template deleted:', template.id);
    return template;
  }

  /**
   * Set a template as default
   */
  static async setDefaultTemplate(id: string, userId: string): Promise<ProposalEmailTemplate> {
    console.log('[ProposalEmailTemplateService] Setting default template:', id);

    // Check ownership
    await this.getTemplate(id, userId);

    // Unset all other defaults for this user
    await prisma.proposalEmailTemplate.updateMany({
      where: {
        createdBy: userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this template as default
    const template = await prisma.proposalEmailTemplate.update({
      where: { id },
      data: {
        isDefault: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('[ProposalEmailTemplateService] Default template set:', template.id);
    return template;
  }

  /**
   * Get the default template for a user
   */
  static async getDefaultTemplate(userId: string): Promise<ProposalEmailTemplate | null> {
    console.log('[ProposalEmailTemplateService] Getting default template for user:', userId);

    const template = await prisma.proposalEmailTemplate.findFirst({
      where: {
        createdBy: userId,
        isActive: true,
        isDefault: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return template;
  }

  /**
   * Render template with real proposal data
   */
  static async renderTemplate(
    templateId: string,
    proposalId: string,
    userId: string
  ): Promise<RenderTemplateResult> {
    console.log('[ProposalEmailTemplateService] Rendering template:', {
      templateId,
      proposalId,
    });

    // Get template
    const template = await this.getTemplate(templateId, userId);

    // Get proposal with client data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        client: true,
        createdByUser: true,
      },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get business settings (if configured)
    const businessSettings = await this.getBusinessSettings();

    // Create variable context
    const context = VariableSubstitutionService.createContext(
      proposal.client,
      proposal.createdByUser,
      proposal,
      businessSettings
    );

    // Add proposal-specific variables
    context.proposal = {
      ...context.proposal,
      title: proposal.title,
      description: proposal.description || '',
      url: `${process.env.APP_URL || 'http://localhost:3000'}/proposals/${proposal.proposalNumber}`,
    } as any;

    // Substitute variables in subject and content
    const subject = VariableSubstitutionService.substitute(template.subject, context);
    const content = VariableSubstitutionService.substitute(template.content, context);

    // Extract variables used
    const subjectVars = VariableSubstitutionService.extractVariables(template.subject);
    const contentVars = VariableSubstitutionService.extractVariables(template.content);
    const variables = [...new Set([...subjectVars, ...contentVars])];

    return {
      subject,
      content,
      variables,
    };
  }

  /**
   * Preview template with sample data
   */
  static async previewTemplate(
    templateId: string,
    userId: string
  ): Promise<RenderTemplateResult> {
    console.log('[ProposalEmailTemplateService] Previewing template:', templateId);

    // Get template
    const template = await this.getTemplate(templateId, userId);

    // Create sample context
    const sampleContext = {
      client: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+44 123 456 7890',
        company: 'ABC Corporation',
        address: '123 Main Street, London, UK',
      },
      proposal: {
        number: 'PROP-2025-001',
        title: 'Wedding Photography Package',
        description: 'Full day wedding photography with 2 photographers',
        subtotal: '£1,500.00',
        tax: '£300.00',
        total: '£1,800.00',
        url: 'http://localhost:3000/proposals/PROP-2025-001',
      },
      date: {
        today: new Date().toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        tomorrow: new Date(Date.now() + 86400000).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        nextWeek: new Date(Date.now() + 604800000).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
      business: {
        name: 'Kori Photography',
        email: 'hello@koriphotography.com',
        phone: '+44 987 654 3210',
        address: '456 Photo Lane, London, UK',
        website: 'https://koriphotography.com',
      },
    };

    // Substitute variables
    const subject = VariableSubstitutionService.substitute(template.subject, sampleContext);
    const content = VariableSubstitutionService.substitute(template.content, sampleContext);

    // Extract variables
    const subjectVars = VariableSubstitutionService.extractVariables(template.subject);
    const contentVars = VariableSubstitutionService.extractVariables(template.content);
    const variables = [...new Set([...subjectVars, ...contentVars])];

    return {
      subject,
      content,
      variables,
    };
  }

  /**
   * Get template statistics for a user
   */
  static async getTemplateStats(userId: string) {
    console.log('[ProposalEmailTemplateService] Getting template stats for user:', userId);

    const [total, active, defaultTemplate] = await Promise.all([
      prisma.proposalEmailTemplate.count({
        where: { createdBy: userId },
      }),
      prisma.proposalEmailTemplate.count({
        where: { createdBy: userId, isActive: true },
      }),
      prisma.proposalEmailTemplate.findFirst({
        where: {
          createdBy: userId,
          isActive: true,
          isDefault: true,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      hasDefault: !!defaultTemplate,
      defaultTemplate,
    };
  }

  /**
   * Get business settings (placeholder - implement based on your settings system)
   */
  private static async getBusinessSettings() {
    // This should fetch from your Organization or Settings table
    // For now, return environment-based defaults
    return {
      name: process.env.BUSINESS_NAME || 'Kori Photography',
      email: process.env.BUSINESS_EMAIL || 'hello@koriphotography.com',
      phone: process.env.BUSINESS_PHONE || '',
      address: process.env.BUSINESS_ADDRESS || '',
      website: process.env.BUSINESS_WEBSITE || '',
    };
  }
}
