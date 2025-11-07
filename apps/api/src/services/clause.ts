import { PrismaClient, Clause, ClauseRule } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateClauseData {
  slug: string;
  title: string;
  bodyHtml: string;
  tags?: string[];
  mandatory?: boolean;
  isActive?: boolean;
}

export interface UpdateClauseData {
  slug?: string;
  title?: string;
  bodyHtml?: string;
  tags?: string[];
  mandatory?: boolean;
  isActive?: boolean;
}

export interface ListClausesFilters {
  search?: string;
  tags?: string[];
  mandatory?: boolean;
  isActive?: boolean;
}

export interface CreateClauseRuleData {
  clauseId: string;
  expression: any; // JSONLogic expression
  enabled?: boolean;
}

/**
 * Clause Service
 *
 * Manages contract clauses (reusable text blocks) for the template designer
 */
export class ClauseService {
  /**
   * Create a new clause
   */
  static async createClause(data: CreateClauseData, userId?: string): Promise<Clause> {
    // Check if slug already exists
    const existing = await prisma.clause.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new Error(`Clause with slug "${data.slug}" already exists`);
    }

    const clause = await prisma.clause.create({
      data: {
        slug: data.slug,
        title: data.title,
        bodyHtml: data.bodyHtml,
        tags: data.tags || [],
        mandatory: data.mandatory || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        rules: true,
      },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'Clause',
          entityId: clause.id,
          userId,
          metadata: {
            slug: clause.slug,
            title: clause.title,
            mandatory: clause.mandatory,
          },
        },
      });
    }

    return clause;
  }

  /**
   * Get clause by ID
   */
  static async getClauseById(id: string): Promise<Clause> {
    const clause = await prisma.clause.findUnique({
      where: { id },
      include: {
        rules: true,
      },
    });

    if (!clause) {
      throw new Error('Clause not found');
    }

    return clause;
  }

  /**
   * Get clause by slug
   */
  static async getClauseBySlug(slug: string): Promise<Clause> {
    const clause = await prisma.clause.findUnique({
      where: { slug },
      include: {
        rules: true,
      },
    });

    if (!clause) {
      throw new Error('Clause not found');
    }

    return clause;
  }

  /**
   * List clauses with filters
   */
  static async listClauses(filters: ListClausesFilters = {}): Promise<Clause[]> {
    const where: any = {};

    // Filter by active status
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Filter by mandatory
    if (filters.mandatory !== undefined) {
      where.mandatory = filters.mandatory;
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Search in title, slug, or body
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { bodyHtml: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const clauses = await prisma.clause.findMany({
      where,
      include: {
        rules: true,
      },
      orderBy: [
        { mandatory: 'desc' }, // Mandatory clauses first
        { title: 'asc' },
      ],
    });

    return clauses;
  }

  /**
   * Get all mandatory clauses
   */
  static async getMandatoryClauses(): Promise<Clause[]> {
    return prisma.clause.findMany({
      where: {
        mandatory: true,
        isActive: true,
      },
      include: {
        rules: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Get all available tags
   */
  static async getAllTags(): Promise<string[]> {
    const clauses = await prisma.clause.findMany({
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    clauses.forEach((clause) => {
      clause.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  /**
   * Update clause
   */
  static async updateClause(
    id: string,
    data: UpdateClauseData,
    userId?: string
  ): Promise<Clause> {
    const existing = await this.getClauseById(id);

    // If mandatory, prevent changing mandatory flag to false
    if (existing.mandatory && data.mandatory === false) {
      throw new Error('Cannot change mandatory clause to optional');
    }

    // If slug is changing, check for conflicts
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.clause.findUnique({
        where: { slug: data.slug },
      });

      if (conflict) {
        throw new Error(`Clause with slug "${data.slug}" already exists`);
      }
    }

    const updated = await prisma.clause.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        bodyHtml: data.bodyHtml,
        tags: data.tags,
        mandatory: data.mandatory,
        isActive: data.isActive,
      },
      include: {
        rules: true,
      },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Clause',
          entityId: id,
          userId,
          changes: {
            old: {
              slug: existing.slug,
              title: existing.title,
              mandatory: existing.mandatory,
              isActive: existing.isActive,
            },
            new: {
              slug: updated.slug,
              title: updated.title,
              mandatory: updated.mandatory,
              isActive: updated.isActive,
            },
          },
        },
      });
    }

    return updated;
  }

  /**
   * Delete clause (soft delete by setting isActive = false)
   */
  static async deleteClause(id: string, userId?: string): Promise<Clause> {
    const clause = await this.getClauseById(id);

    // Prevent deletion of mandatory clauses
    if (clause.mandatory) {
      throw new Error('Cannot delete mandatory clause');
    }

    // Soft delete by setting isActive = false
    const deleted = await prisma.clause.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'Clause',
          entityId: id,
          userId,
          metadata: {
            slug: clause.slug,
            title: clause.title,
          },
        },
      });
    }

    return deleted;
  }

  /**
   * Hard delete clause (permanent removal)
   */
  static async hardDeleteClause(id: string, userId?: string): Promise<void> {
    const clause = await this.getClauseById(id);

    // Prevent deletion of mandatory clauses
    if (clause.mandatory) {
      throw new Error('Cannot delete mandatory clause');
    }

    // Delete all rules first
    await prisma.clauseRule.deleteMany({
      where: { clauseId: id },
    });

    // Delete the clause
    await prisma.clause.delete({
      where: { id },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'HARD_DELETE',
          entityType: 'Clause',
          entityId: id,
          userId,
          metadata: {
            slug: clause.slug,
            title: clause.title,
          },
        },
      });
    }
  }

  /**
   * Add conditional rule to clause
   */
  static async addClauseRule(data: CreateClauseRuleData, userId?: string): Promise<ClauseRule> {
    // Verify clause exists
    await this.getClauseById(data.clauseId);

    const rule = await prisma.clauseRule.create({
      data: {
        clauseId: data.clauseId,
        expression: data.expression,
        enabled: data.enabled !== undefined ? data.enabled : true,
      },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'ClauseRule',
          entityId: rule.id,
          userId,
          metadata: {
            clauseId: data.clauseId,
            expression: data.expression,
          },
        },
      });
    }

    return rule;
  }

  /**
   * Update clause rule
   */
  static async updateClauseRule(
    id: string,
    expression: any,
    enabled?: boolean,
    userId?: string
  ): Promise<ClauseRule> {
    const rule = await prisma.clauseRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new Error('Clause rule not found');
    }

    const updated = await prisma.clauseRule.update({
      where: { id },
      data: {
        expression,
        enabled: enabled !== undefined ? enabled : rule.enabled,
      },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'ClauseRule',
          entityId: id,
          userId,
          changes: {
            old: { expression: rule.expression, enabled: rule.enabled },
            new: { expression: updated.expression, enabled: updated.enabled },
          },
        },
      });
    }

    return updated;
  }

  /**
   * Delete clause rule
   */
  static async deleteClauseRule(id: string, userId?: string): Promise<void> {
    const rule = await prisma.clauseRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new Error('Clause rule not found');
    }

    await prisma.clauseRule.delete({
      where: { id },
    });

    // Create audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'ClauseRule',
          entityId: id,
          userId,
          metadata: {
            clauseId: rule.clauseId,
          },
        },
      });
    }
  }

  /**
   * Get clause statistics
   */
  static async getClauseStats() {
    const [total, mandatory, optional, active, tags] = await Promise.all([
      prisma.clause.count(),
      prisma.clause.count({ where: { mandatory: true } }),
      prisma.clause.count({ where: { mandatory: false } }),
      prisma.clause.count({ where: { isActive: true } }),
      this.getAllTags(),
    ]);

    return {
      total,
      mandatory,
      optional,
      active,
      inactive: total - active,
      totalTags: tags.length,
      tags,
    };
  }
}
