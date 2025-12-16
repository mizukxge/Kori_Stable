import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTemplateData {
  name: string;
  description?: string;
  content: string;
  variables?: TemplateVariable[];
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  content?: string;
  variables?: TemplateVariable[];
  isActive?: boolean;
}

export interface TemplateVariable {
  key: string;
  description: string;
  example?: string;
  required?: boolean;
}

export class TemplateService {
  /**
   * Extract variables from template content
   * Finds all {{variable.path}} patterns
   */
  static extractVariables(content: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = content.matchAll(variablePattern);
    const variables = new Set<string>();

    for (const match of matches) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  /**
   * Validate template variables
   */
  static validateTemplate(content: string, variables?: TemplateVariable[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const extractedVars = this.extractVariables(content);

    // Check for variables in content that aren't documented
    if (variables && variables.length > 0) {
      const documentedKeys = variables.map((v) => v.key);
      const undocumented = extractedVars.filter((v) => !documentedKeys.includes(v));

      if (undocumented.length > 0) {
        issues.push(`Undocumented variables: ${undocumented.join(', ')}`);
      }
    }

    // Check for malformed variables
    const malformed = content.match(/\{[^{]|[^}]\}/g);
    if (malformed) {
      issues.push('Template contains malformed variable syntax');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Create a new contract template
   */
  static async createTemplate(data: CreateTemplateData, userId: string) {
    // Validate template
    const validation = this.validateTemplate(data.content, data.variables);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.issues.join(', ')}`);
    }

    // Create template
    const template = await prisma.contractTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        variables: (data.variables || []) as any,
        createdBy: userId,
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
          variableCount: data.variables?.length || 0,
        },
      },
    });

    return template;
  }

  /**
   * List contract templates
   */
  static async listTemplates(filters: {
    isActive?: boolean;
  } = {}) {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const templates = await prisma.contractTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        _count: {
          select: { contracts: true },
        },
      },
    });

    return templates;
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
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
  static async getTemplateByName(name: string) {
    const template = await prisma.contractTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  /**
   * Update template
   */
  static async updateTemplate(id: string, data: UpdateTemplateData, userId: string) {
    const existing = await this.getTemplateById(id);

    // Validate if content changed
    if (data.content) {
      const validation = this.validateTemplate(
        data.content,
        data.variables || (existing.variables as TemplateVariable[])
      );
      if (!validation.valid) {
        throw new Error(`Template validation failed: ${validation.issues.join(', ')}`);
      }
    }

    // Increment version if content changed
    const versionIncrement = data.content && data.content !== existing.content ? 1 : 0;

    const updated = await prisma.contractTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        variables: (data.variables !== undefined ? data.variables : undefined) as any,
        isActive: data.isActive,
        version: existing.version + versionIncrement,
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
          version: updated.version,
          contentChanged: versionIncrement > 0,
        },
      },
    });

    return updated;
  }

  /**
   * Delete template (soft delete by marking inactive)
   */
  static async deleteTemplate(id: string, userId: string) {
    const template = await this.getTemplateById(id);

    // Check if template has contracts
    const contractCount = await prisma.contract.count({
      where: { templateId: id },
    });

    if (contractCount > 0) {
      // Soft delete - mark as inactive
      const deleted = await prisma.contractTemplate.update({
        where: { id },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          action: 'DEACTIVATE',
          entityType: 'ContractTemplate',
          entityId: id,
          userId,
          metadata: {
            name: template.name,
            reason: 'Template has existing contracts',
          },
        },
      });

      return deleted;
    } else {
      // Hard delete - no contracts exist
      await prisma.contractTemplate.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'ContractTemplate',
          entityId: id,
          userId,
          metadata: { name: template.name },
        },
      });

      return template;
    }
  }

  /**
   * Clone template
   */
  static async cloneTemplate(id: string, newName: string, userId: string) {
    const original = await this.getTemplateById(id);

    const cloned = await prisma.contractTemplate.create({
      data: {
        name: newName,
        description: `Cloned from: ${original.name}`,
        content: original.content,
        variables: original.variables,
        version: 1,
        createdBy: userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CLONE',
        entityType: 'ContractTemplate',
        entityId: cloned.id,
        userId,
        metadata: {
          originalId: original.id,
          originalName: original.name,
        },
      },
    });

    return cloned;
  }

  /**
   * Get template statistics
   */
  static async getTemplateStats() {
    const [total, active, totalContracts] = await Promise.all([
      prisma.contractTemplate.count(),
      prisma.contractTemplate.count({ where: { isActive: true } }),
      prisma.contract.count(),
    ]);

    // Get most used templates
    const mostUsed = await prisma.contractTemplate.findMany({
      take: 5,
      orderBy: {
        contracts: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    });

    return {
      total,
      active,
      totalContracts,
      mostUsed: mostUsed.map((t) => ({
        id: t.id,
        name: t.name,
        usageCount: t._count.contracts,
      })),
    };
  }

  /**
   * Preview template with sample data
   */
  static previewTemplate(content: string, sampleData: Record<string, any>): string {
    let preview = content;

    // Replace all variables with sample data
    const variables = this.extractVariables(content);

    for (const variable of variables) {
      const value = this.resolveVariable(variable, sampleData);
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      preview = preview.replace(regex, value);
    }

    return preview;
  }

  /**
   * Resolve variable value from data object
   */
  private static resolveVariable(variable: string, data: Record<string, any>): string {
    const parts = variable.split('.');
    let value: any = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return `{{${variable}}}`; // Return original if not found
      }
    }

    return value?.toString() || '';
  }
}