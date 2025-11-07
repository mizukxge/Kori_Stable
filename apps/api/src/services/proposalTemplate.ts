import { PrismaClient, type Prisma } from '@prisma/client';
import { z } from 'zod';

const db = new PrismaClient();

// Validation schemas
export const createProposalTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  title: z.string().optional(),
  defaultTerms: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      unitPrice: z.string().or(z.number()), // Accept string or number for Decimal
      position: z.number().int().min(0).optional(),
    })
  ).optional().default([]),
});

export const updateProposalTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  defaultTerms: z.string().optional(),
  isActive: z.boolean().optional(),
  items: z.array(
    z.object({
      id: z.string().optional(), // For existing items
      description: z.string().min(1),
      quantity: z.number().int().min(1),
      unitPrice: z.string().or(z.number()),
      position: z.number().int().min(0).optional(),
    })
  ).optional(),
});

export type CreateProposalTemplateInput = z.infer<typeof createProposalTemplateSchema>;
export type UpdateProposalTemplateInput = z.infer<typeof updateProposalTemplateSchema>;

export class ProposalTemplateService {
  /**
   * List all proposal templates for a user
   */
  static async listTemplates(userId: string) {
    try {
      const templates = await db.proposalTemplate.findMany({
        where: {
          createdBy: userId,
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return templates;
    } catch (error) {
      console.error('Failed to list proposal templates:', error);
      throw new Error('Failed to list proposal templates');
    }
  }

  /**
   * Get a single proposal template by ID
   */
  static async getTemplate(id: string, userId: string) {
    try {
      const template = await db.proposalTemplate.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      if (!template) {
        throw new Error('Proposal template not found');
      }

      if (template.createdBy !== userId) {
        throw new Error('Unauthorized to access this template');
      }

      return template;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Failed to get proposal template:', error);
      throw new Error('Failed to get proposal template');
    }
  }

  /**
   * Create a new proposal template
   */
  static async createTemplate(userId: string, data: CreateProposalTemplateInput) {
    try {
      // Validate input
      const validated = createProposalTemplateSchema.parse(data);

      const template = await db.proposalTemplate.create({
        data: {
          name: validated.name,
          description: validated.description,
          title: validated.title,
          defaultTerms: validated.defaultTerms,
          createdBy: userId,
          items: {
            create: (validated.items || []).map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: this.normalizeDecimal(item.unitPrice),
              position: item.position ?? index,
            })),
          },
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      return template;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors[0].message}`);
      }
      console.error('Failed to create proposal template:', error);
      throw new Error('Failed to create proposal template');
    }
  }

  /**
   * Update a proposal template
   */
  static async updateTemplate(id: string, userId: string, data: UpdateProposalTemplateInput) {
    try {
      // Verify ownership
      const existing = await db.proposalTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Proposal template not found');
      }

      if (existing.createdBy !== userId) {
        throw new Error('Unauthorized to update this template');
      }

      // Validate input
      const validated = updateProposalTemplateSchema.parse(data);

      const template = await db.proposalTemplate.update({
        where: { id },
        data: {
          ...(validated.name && { name: validated.name }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.title !== undefined && { title: validated.title }),
          ...(validated.defaultTerms !== undefined && { defaultTerms: validated.defaultTerms }),
          ...(validated.isActive !== undefined && { isActive: validated.isActive }),
          // Handle items updates
          ...(validated.items && {
            items: {
              deleteMany: {}, // Delete all existing items
              create: validated.items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: this.normalizeDecimal(item.unitPrice),
                position: item.position ?? index,
              })),
            },
          }),
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      return template;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors[0].message}`);
      }
      if (error instanceof Error) {
        throw error;
      }
      console.error('Failed to update proposal template:', error);
      throw new Error('Failed to update proposal template');
    }
  }

  /**
   * Delete a proposal template (soft delete via isActive)
   */
  static async deleteTemplate(id: string, userId: string) {
    try {
      const existing = await db.proposalTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Proposal template not found');
      }

      if (existing.createdBy !== userId) {
        throw new Error('Unauthorized to delete this template');
      }

      // Soft delete
      const template = await db.proposalTemplate.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return template;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Failed to delete proposal template:', error);
      throw new Error('Failed to delete proposal template');
    }
  }

  /**
   * Duplicate a proposal template
   */
  static async duplicateTemplate(id: string, userId: string, newName?: string) {
    try {
      const existing = await db.proposalTemplate.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      if (!existing) {
        throw new Error('Proposal template not found');
      }

      if (existing.createdBy !== userId) {
        throw new Error('Unauthorized to duplicate this template');
      }

      const duplicated = await db.proposalTemplate.create({
        data: {
          name: newName || `${existing.name} (Copy)`,
          description: existing.description,
          title: existing.title,
          defaultTerms: existing.defaultTerms,
          createdBy: userId,
          items: {
            create: existing.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              position: item.position,
            })),
          },
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      return duplicated;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Failed to duplicate proposal template:', error);
      throw new Error('Failed to duplicate proposal template');
    }
  }

  /**
   * Get statistics for proposal templates
   */
  static async getTemplateStats(userId: string) {
    try {
      const totalTemplates = await db.proposalTemplate.count({
        where: {
          createdBy: userId,
          isActive: true,
        },
      });

      const activeTemplates = await db.proposalTemplate.count({
        where: {
          createdBy: userId,
          isActive: true,
        },
      });

      return {
        total: totalTemplates,
        active: activeTemplates,
        inactive: totalTemplates - activeTemplates,
      };
    } catch (error) {
      console.error('Failed to get template statistics:', error);
      throw new Error('Failed to get template statistics');
    }
  }

  /**
   * Normalize decimal values (handle both string and number inputs)
   */
  private static normalizeDecimal(value: string | number): any {
    // Prisma Decimal accepts string or number
    // Let Prisma handle the conversion
    return value;
  }
}
