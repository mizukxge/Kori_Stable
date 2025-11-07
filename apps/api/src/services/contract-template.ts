import { PrismaClient, ContractTemplate, DocumentType, EventType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTemplateData {
  name: string;
  description?: string;
  type?: DocumentType;
  eventType?: EventType;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds?: string[];
  isActive?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  type?: DocumentType;
  eventType?: EventType;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds?: string[];
  isActive?: boolean;
}

export interface ListTemplatesFilters {
  search?: string;
  type?: DocumentType;
  eventType?: EventType;
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Contract Template Service
 *
 * Manages contract templates for the document system
 */
export class ContractTemplateService {
  /**
   * Create a new contract template
   */
  static async createTemplate(
    data: CreateTemplateData,
    userId: string
  ): Promise<ContractTemplate> {
    // Check if name already exists
    const existing = await prisma.contractTemplate.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error(`Template with name "${data.name}" already exists`);
    }

    // Validate clause IDs if provided
    if (data.mandatoryClauseIds && data.mandatoryClauseIds.length > 0) {
      const clauses = await prisma.clause.findMany({
        where: { id: { in: data.mandatoryClauseIds } },
      });

      if (clauses.length !== data.mandatoryClauseIds.length) {
        throw new Error('Some clause IDs are invalid');
      }
    }

    const template = await prisma.contractTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        eventType: data.eventType,
        bodyHtml: data.bodyHtml,
        variablesSchema: data.variablesSchema || {},
        mandatoryClauseIds: data.mandatoryClauseIds || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        isPublished: false,
        version: 1,
        createdBy: userId,
      },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'ContractTemplate',
        entityId: template.id,
        userId,
        metadata: {
          name: template.name,
          type: template.type,
          eventType: template.eventType,
        },
      },
    });

    return template;
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string): Promise<ContractTemplate> {
    const template = await prisma.contractTemplate.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 contracts using this template
        },
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  /**
   * Get template by name
   */
  static async getTemplateByName(name: string): Promise<ContractTemplate> {
    const template = await prisma.contractTemplate.findUnique({
      where: { name },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  /**
   * List templates with filters
   */
  static async listTemplates(filters: ListTemplatesFilters = {}): Promise<ContractTemplate[]> {
    const where: any = {};

    // Filter by active status
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Filter by published status
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    // Filter by document type
    if (filters.type) {
      where.type = filters.type;
    }

    // Filter by event type
    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    // Search in name or description
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.contractTemplate.findMany({
      where,
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
        _count: {
          select: {
            contracts: true,
          },
        },
      },
      orderBy: [
        { isPublished: 'desc' }, // Published templates first
        { createdAt: 'desc' },
      ],
    });

    return templates;
  }

  /**
   * Get all published templates (for contract creation)
   */
  static async getPublishedTemplates(): Promise<ContractTemplate[]> {
    return prisma.contractTemplate.findMany({
      where: {
        isPublished: true,
        isActive: true,
      },
      include: {
        pricingRules: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update template
   */
  static async updateTemplate(
    id: string,
    data: UpdateTemplateData,
    userId: string
  ): Promise<ContractTemplate> {
    const existing = await this.getTemplateById(id);

    // If template is published, prevent changes to critical fields
    if (existing.isPublished && data.bodyHtml && data.bodyHtml !== existing.bodyHtml) {
      throw new Error(
        'Cannot modify published template content. Create a new version or unpublish first.'
      );
    }

    // If name is changing, check for conflicts
    if (data.name && data.name !== existing.name) {
      const conflict = await prisma.contractTemplate.findUnique({
        where: { name: data.name },
      });

      if (conflict) {
        throw new Error(`Template with name "${data.name}" already exists`);
      }
    }

    // Validate clause IDs if provided
    if (data.mandatoryClauseIds && data.mandatoryClauseIds.length > 0) {
      const clauses = await prisma.clause.findMany({
        where: { id: { in: data.mandatoryClauseIds } },
      });

      if (clauses.length !== data.mandatoryClauseIds.length) {
        throw new Error('Some clause IDs are invalid');
      }
    }

    const updated = await prisma.contractTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        eventType: data.eventType,
        bodyHtml: data.bodyHtml,
        variablesSchema: data.variablesSchema,
        mandatoryClauseIds: data.mandatoryClauseIds,
        isActive: data.isActive,
      },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'ContractTemplate',
        entityId: id,
        userId,
        changes: {
          old: {
            name: existing.name,
            type: existing.type,
            eventType: existing.eventType,
            isActive: existing.isActive,
            isPublished: existing.isPublished,
          },
          new: {
            name: updated.name,
            type: updated.type,
            eventType: updated.eventType,
            isActive: updated.isActive,
            isPublished: updated.isPublished,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Publish template (make available for contract generation)
   */
  static async publishTemplate(id: string, userId: string): Promise<ContractTemplate> {
    const template = await this.getTemplateById(id);

    if (template.isPublished) {
      throw new Error('Template is already published');
    }

    // Validate template has required fields
    if (!template.bodyHtml || template.bodyHtml.trim() === '') {
      throw new Error('Cannot publish template without body content');
    }

    if (!template.variablesSchema || Object.keys(template.variablesSchema).length === 0) {
      throw new Error('Cannot publish template without variables schema');
    }

    const published = await prisma.contractTemplate.update({
      where: { id },
      data: {
        isPublished: true,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PUBLISH',
        entityType: 'ContractTemplate',
        entityId: id,
        userId,
        metadata: {
          name: template.name,
          version: template.version,
        },
      },
    });

    return published;
  }

  /**
   * Unpublish template (remove from contract creation)
   */
  static async unpublishTemplate(id: string, userId: string): Promise<ContractTemplate> {
    const template = await this.getTemplateById(id);

    if (!template.isPublished) {
      throw new Error('Template is not published');
    }

    const unpublished = await prisma.contractTemplate.update({
      where: { id },
      data: {
        isPublished: false,
      },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UNPUBLISH',
        entityType: 'ContractTemplate',
        entityId: id,
        userId,
        metadata: {
          name: template.name,
        },
      },
    });

    return unpublished;
  }

  /**
   * Create new version of template (clone with version increment)
   */
  static async createTemplateVersion(
    id: string,
    userId: string
  ): Promise<ContractTemplate> {
    const original = await this.getTemplateById(id);

    // Create new template as a copy
    const newVersion = await prisma.contractTemplate.create({
      data: {
        name: `${original.name} (v${original.version + 1})`,
        description: original.description,
        type: original.type,
        eventType: original.eventType,
        bodyHtml: original.bodyHtml,
        variablesSchema: original.variablesSchema,
        mandatoryClauseIds: original.mandatoryClauseIds,
        isActive: true,
        isPublished: false,
        version: original.version + 1,
        createdBy: userId,
      },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        pricingRules: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'VERSION',
        entityType: 'ContractTemplate',
        entityId: newVersion.id,
        userId,
        metadata: {
          originalId: original.id,
          originalName: original.name,
          originalVersion: original.version,
          newVersion: newVersion.version,
        },
      },
    });

    return newVersion;
  }

  /**
   * Delete template (soft delete by setting isActive = false)
   */
  static async deleteTemplate(id: string, userId: string): Promise<ContractTemplate> {
    const template = await this.getTemplateById(id);

    // Check if template has been used
    const contractCount = await prisma.contract.count({
      where: { templateId: id },
    });

    if (contractCount > 0) {
      throw new Error(
        `Cannot delete template that has been used in ${contractCount} contract(s). Consider unpublishing instead.`
      );
    }

    // Soft delete by setting isActive = false
    const deleted = await prisma.contractTemplate.update({
      where: { id },
      data: {
        isActive: false,
        isPublished: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'ContractTemplate',
        entityId: id,
        userId,
        metadata: {
          name: template.name,
          contractCount,
        },
      },
    });

    return deleted;
  }

  /**
   * Get template with resolved clauses
   */
  static async getTemplateWithClauses(id: string) {
    const template = await this.getTemplateById(id);

    // Get all mandatory clauses referenced by this template
    const clauses = await prisma.clause.findMany({
      where: {
        id: { in: template.mandatoryClauseIds },
        isActive: true,
      },
      include: {
        rules: true,
      },
      orderBy: { title: 'asc' },
    });

    return {
      ...template,
      clauses,
    };
  }

  /**
   * Get template statistics
   */
  static async getTemplateStats() {
    const [total, published, active, byType, byEventType] = await Promise.all([
      prisma.contractTemplate.count(),
      prisma.contractTemplate.count({ where: { isPublished: true } }),
      prisma.contractTemplate.count({ where: { isActive: true } }),
      prisma.contractTemplate.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.contractTemplate.groupBy({
        by: ['eventType'],
        _count: true,
      }),
    ]);

    const stats: any = {
      total,
      published,
      active,
      inactive: total - active,
      byType: {},
      byEventType: {},
    };

    byType.forEach((item) => {
      if (item.type) {
        stats.byType[item.type] = item._count;
      }
    });

    byEventType.forEach((item) => {
      if (item.eventType) {
        stats.byEventType[item.eventType] = item._count;
      }
    });

    return stats;
  }

  /**
   * Get most used templates
   */
  static async getMostUsedTemplates(limit: number = 10) {
    const templates = await prisma.contractTemplate.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            contracts: true,
          },
        },
      },
      orderBy: {
        contracts: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return templates;
  }
}
