# PHASE 1, STEP 1.1: PROPOSAL TEMPLATES - BACKEND IMPLEMENTATION

**Objective:** Create the database schema and API endpoints to save and manage proposal templates

**Estimated Time:** 6-8 hours
**Dependencies:** Existing proposal system (✅ already implemented)

---

## IMPLEMENTATION BREAKDOWN

### PART 1: DATABASE SCHEMA

#### Step 1.1.1: Update Prisma Schema

**File:** `apps/api/prisma/schema.prisma`

Add these models AFTER the `Proposal` model:

```prisma
model ProposalTemplate {
  id String @id @default(cuid())
  userId String // Admin user who created this template
  user AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  name String // "Wedding Full Day", "Corporate Shoot", etc.
  description String? // Optional description
  content String // Proposal body/text template

  items ProposalTemplateItem[] // Line items

  defaultTaxRate Float? // Default tax rate for proposals from this template
  defaultTerms String? // Default terms and conditions

  isActive Boolean @default(true) // Soft delete via status
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Compound index for quick lookups
  @@index([userId])
  @@index([isActive])
}

model ProposalTemplateItem {
  id String @id @default(cuid())
  templateId String
  template ProposalTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  description String // Service/product description
  quantity Int @default(1)
  unitPrice Decimal @db.Decimal(10, 2) // Use Decimal for money

  order Int // For ordering items in template

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([templateId])
  @@index([order])
}
```

**Why this structure:**
- `userId` links template to the admin who created it (future: multi-user support)
- `items` is a separate table for flexibility (can have 0 to N items per template)
- `order` field allows custom ordering of line items
- Soft delete via `isActive` flag instead of hard delete (preserve history)
- Indexes on `userId` and `isActive` for fast queries

---

### PART 2: CREATE THE SERVICE LAYER

#### Step 1.1.2: Create ProposalTemplate Service

**File:** `apps/api/src/services/proposalTemplate.ts`

```typescript
import { PrismaClient, ProposalTemplate, ProposalTemplateItem } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTemplateData {
  name: string;
  description?: string;
  content: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    order: number;
  }>;
  defaultTaxRate?: number;
  defaultTerms?: string;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

export interface TemplateWithItems extends ProposalTemplate {
  items: ProposalTemplateItem[];
}

export class ProposalTemplateService {
  /**
   * List all active templates for a user
   */
  static async listTemplates(userId: string) {
    return prisma.proposalTemplate.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single template by ID
   */
  static async getTemplate(id: string, userId: string): Promise<TemplateWithItems> {
    const template = await prisma.proposalTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.userId !== userId) {
      throw new Error('Unauthorized: You do not own this template');
    }

    return template;
  }

  /**
   * Create a new proposal template
   */
  static async createTemplate(
    userId: string,
    data: CreateTemplateData
  ): Promise<TemplateWithItems> {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    // Create template with items in a transaction
    const template = await prisma.proposalTemplate.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        content: data.content,
        defaultTaxRate: data.defaultTaxRate,
        defaultTerms: data.defaultTerms,
        items: {
          createMany: {
            data: data.items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              order: item.order || index,
            })),
          },
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return template;
  }

  /**
   * Update an existing template
   */
  static async updateTemplate(
    id: string,
    userId: string,
    data: UpdateTemplateData
  ): Promise<TemplateWithItems> {
    // Verify ownership
    const template = await prisma.proposalTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.userId !== userId) {
      throw new Error('Unauthorized: You do not own this template');
    }

    // If items provided, we need to update them
    if (data.items) {
      // Delete old items and create new ones
      await prisma.proposalTemplateItem.deleteMany({
        where: { templateId: id },
      });
    }

    const updated = await prisma.proposalTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        defaultTaxRate: data.defaultTaxRate,
        defaultTerms: data.defaultTerms,
        items: data.items
          ? {
              createMany: {
                data: data.items.map((item, index) => ({
                  description: item.description,
                  quantity: item.quantity || 1,
                  unitPrice: new Prisma.Decimal(item.unitPrice),
                  order: item.order || index,
                })),
              },
            }
          : undefined,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return updated;
  }

  /**
   * Delete (soft delete) a template
   */
  static async deleteTemplate(id: string, userId: string): Promise<void> {
    const template = await prisma.proposalTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.userId !== userId) {
      throw new Error('Unauthorized: You do not own this template');
    }

    await prisma.proposalTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Duplicate an existing template
   */
  static async duplicateTemplate(
    id: string,
    userId: string,
    newName?: string
  ): Promise<TemplateWithItems> {
    const original = await this.getTemplate(id, userId);

    return this.createTemplate(userId, {
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      content: original.content,
      defaultTaxRate: original.defaultTaxRate?.toNumber(),
      defaultTerms: original.defaultTerms || undefined,
      items: original.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        order: item.order,
      })),
    });
  }

  /**
   * Get template statistics (for dashboard)
   */
  static async getTemplateStats(userId: string) {
    const total = await prisma.proposalTemplate.count({
      where: { userId, isActive: true },
    });

    const mostUsed = await prisma.proposalTemplate.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }, // Simple: most recent used
      select: { id: true, name: true },
    });

    return {
      totalTemplates: total,
      mostUsedTemplate: mostUsed,
    };
  }
}
```

**Key Features:**
- ✅ List all user's templates
- ✅ Get single template with validation
- ✅ Create template with items
- ✅ Update template (including items)
- ✅ Soft delete (isActive flag)
- ✅ Duplicate template
- ✅ Template stats
- ✅ Ownership validation (userId check)
- ✅ Transaction safety for items creation

---

### PART 3: CREATE API ROUTES

#### Step 1.1.3: Create Routes File

**File:** `apps/api/src/routes/proposalTemplates.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { ProposalTemplateService } from '../services/proposalTemplate.js';
import { requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

// Validation schemas
const TemplateItemSchema = z.object({
  description: z.string().min(1, 'Item description required'),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive('Price must be positive'),
  order: z.number().int().nonnegative(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name required').max(100),
  description: z.string().optional(),
  content: z.string().min(1, 'Template content required'),
  items: z.array(TemplateItemSchema).default([]),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultTerms: z.string().optional(),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial().omit({ name: true }).extend({
  name: z.string().min(1).max(100).optional(),
});

export async function proposalTemplateRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/proposal-templates
   * List all templates for current user
   */
  fastify.get('/admin/proposal-templates', async (request, reply) => {
    try {
      const templates = await ProposalTemplateService.listTemplates(
        request.user!.userId
      );

      return reply.status(200).send({
        success: true,
        data: templates,
      });
    } catch (error) {
      request.log.error(error, 'Error listing proposal templates');
      throw error;
    }
  });

  /**
   * GET /admin/proposal-templates/:id
   * Get single template by ID
   */
  fastify.get<{ Params: { id: string } }>(
    '/admin/proposal-templates/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const template = await ProposalTemplateService.getTemplate(
          id,
          request.user!.userId
        );

        return reply.status(200).send({
          success: true,
          data: template,
        });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Template not found' ||
            error.message.includes('Unauthorized')
          ) {
            return reply.status(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Template not found',
            });
          }
        }
        request.log.error(error, 'Error fetching proposal template');
        throw error;
      }
    }
  );

  /**
   * POST /admin/proposal-templates
   * Create new template
   */
  fastify.post<{ Body: z.infer<typeof CreateTemplateSchema> }>(
    '/admin/proposal-templates',
    async (request, reply) => {
      try {
        const data = CreateTemplateSchema.parse(request.body);
        const template = await ProposalTemplateService.createTemplate(
          request.user!.userId,
          data
        );

        request.log.info(
          { templateId: template.id, name: template.name },
          'Proposal template created'
        );

        return reply.status(201).send({
          success: true,
          message: 'Template created successfully',
          data: template,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
          });
        }
        request.log.error(error, 'Error creating proposal template');
        throw error;
      }
    }
  );

  /**
   * PATCH /admin/proposal-templates/:id
   * Update template
   */
  fastify.patch<{
    Params: { id: string };
    Body: z.infer<typeof UpdateTemplateSchema>;
  }>('/admin/proposal-templates/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const data = UpdateTemplateSchema.parse(request.body);

      const template = await ProposalTemplateService.updateTemplate(
        id,
        request.user!.userId,
        data
      );

      request.log.info({ templateId: id }, 'Proposal template updated');

      return reply.status(200).send({
        success: true,
        message: 'Template updated successfully',
        data: template,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        });
      }
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You do not have permission to edit this template',
        });
      }
      request.log.error(error, 'Error updating proposal template');
      throw error;
    }
  });

  /**
   * DELETE /admin/proposal-templates/:id
   * Delete (soft delete) template
   */
  fastify.delete<{ Params: { id: string } }>(
    '/admin/proposal-templates/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        await ProposalTemplateService.deleteTemplate(id, request.user!.userId);

        request.log.info({ templateId: id }, 'Proposal template deleted');

        return reply.status(200).send({
          success: true,
          message: 'Template deleted successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have permission to delete this template',
          });
        }
        request.log.error(error, 'Error deleting proposal template');
        throw error;
      }
    }
  );

  /**
   * POST /admin/proposal-templates/:id/duplicate
   * Duplicate template
   */
  fastify.post<{ Params: { id: string }; Body: { name?: string } }>(
    '/admin/proposal-templates/:id/duplicate',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { name } = request.body;

        const template = await ProposalTemplateService.duplicateTemplate(
          id,
          request.user!.userId,
          name
        );

        request.log.info(
          { originalId: id, duplicateId: template.id },
          'Proposal template duplicated'
        );

        return reply.status(201).send({
          success: true,
          message: 'Template duplicated successfully',
          data: template,
        });
      } catch (error) {
        request.log.error(error, 'Error duplicating proposal template');
        throw error;
      }
    }
  );

  /**
   * GET /admin/proposal-templates/stats
   * Get template statistics
   */
  fastify.get('/admin/proposal-templates/stats', async (request, reply) => {
    try {
      const stats = await ProposalTemplateService.getTemplateStats(
        request.user!.userId
      );

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching proposal template stats');
      throw error;
    }
  });
}
```

**API Endpoints Created:**
- ✅ `GET /admin/proposal-templates` - List all user's templates
- ✅ `GET /admin/proposal-templates/:id` - Get single template
- ✅ `POST /admin/proposal-templates` - Create new template
- ✅ `PATCH /admin/proposal-templates/:id` - Update template
- ✅ `DELETE /admin/proposal-templates/:id` - Soft delete template
- ✅ `POST /admin/proposal-templates/:id/duplicate` - Duplicate template
- ✅ `GET /admin/proposal-templates/stats` - Get statistics

---

### PART 4: REGISTER ROUTES

#### Step 1.1.4: Add to Route Registration

**File:** `apps/api/src/routes/index.ts`

Find the imports section and add:
```typescript
import { proposalTemplateRoutes } from './proposalTemplates.js';
```

Then in the `registerRoutes` function, add this line BEFORE the existing proposal routes:
```typescript
// Proposal template management (admin only)
await fastify.register(proposalTemplateRoutes);
```

---

### PART 5: CREATE DATABASE MIGRATION

#### Step 1.1.5: Generate and Apply Migration

Run these commands:

```bash
# Generate migration based on schema changes
pnpm db:migrate:dev --name add_proposal_templates

# This will:
# 1. Create a migration file in apps/api/prisma/migrations/
# 2. Apply the migration to your database
# 3. Regenerate Prisma client
```

If you want to push without a migration (dev only):
```bash
pnpm --filter @kori/api db:push
```

---

## VERIFICATION CHECKLIST

After completing all parts above, verify:

- [ ] Prisma schema has `ProposalTemplate` and `ProposalTemplateItem` models
- [ ] Migration created and applied successfully (check database)
- [ ] Service file created with all methods
- [ ] Routes file created with all endpoints
- [ ] Routes registered in `routes/index.ts`
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] API server starts without errors

---

## TEST THE API

Use a REST client (Postman, Insomnia, or curl) to test:

```bash
# 1. Create a template
curl -X POST http://localhost:3001/admin/proposal-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_SESSION" \
  -d '{
    "name": "Wedding Full Day",
    "description": "Complete wedding photography package",
    "content": "We offer full-day wedding coverage...",
    "defaultTaxRate": 20,
    "items": [
      {
        "description": "Full Day Coverage (8 hours)",
        "quantity": 1,
        "unitPrice": 1500,
        "order": 0
      },
      {
        "description": "Additional Photographer (per hour)",
        "quantity": 1,
        "unitPrice": 200,
        "order": 1
      }
    ]
  }'

# 2. List all templates
curl -X GET http://localhost:3001/admin/proposal-templates \
  -H "Cookie: session_token=YOUR_SESSION"

# 3. Get single template
curl -X GET http://localhost:3001/admin/proposal-templates/{id} \
  -H "Cookie: session_token=YOUR_SESSION"

# 4. Update template
curl -X PATCH http://localhost:3001/admin/proposal-templates/{id} \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_SESSION" \
  -d '{"name": "Wedding Full Day - Updated"}'

# 5. Duplicate template
curl -X POST http://localhost:3001/admin/proposal-templates/{id}/duplicate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_SESSION" \
  -d '{"name": "Wedding Full Day - Copy"}'

# 6. Delete template
curl -X DELETE http://localhost:3001/admin/proposal-templates/{id} \
  -H "Cookie: session_token=YOUR_SESSION"
```

---

## NEXT STEPS

Once the backend is complete and tested:
1. ✅ All endpoints respond correctly
2. ✅ Data persists to database
3. ✅ Validation works
4. ✅ Ownership checks work

**Then proceed to:** 1.1 Frontend - Create the UI for managing templates

---

## NOTES

- **Decimal type:** Using Prisma `Decimal` for money to avoid floating-point errors
- **Soft delete:** `isActive` flag allows restoring templates if needed
- **Ordering:** `order` field on items allows custom arrangement
- **Transaction safety:** Items are created atomically with template
- **Ownership:** All queries filter by `userId` for security

