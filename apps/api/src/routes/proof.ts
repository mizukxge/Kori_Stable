import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, SelectionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createProofSetSchema = z.object({
  galleryId: z.string().cuid(),
  clientEmail: z.string().email().optional(),
  clientName: z.string().optional(),
});

const selectionSchema = z.object({
  assetId: z.string().cuid(),
  type: z.enum(['HEART', 'FLAG', 'REJECT']),
  note: z.string().optional(),
});

const commentSchema = z.object({
  assetId: z.string().cuid(),
  text: z.string().min(1).max(5000),
  parentId: z.string().cuid().optional(),
});

export default async function proofRoutes(fastify: FastifyInstance) {
  // ============================================
  // PROOF SET ROUTES
  // ============================================

  /**
   * POST /api/proof/start
   * Start a new proofing session
   */
  fastify.post('/start', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createProofSetSchema.parse(request.body);

      // Verify gallery exists and is active
      const gallery = await prisma.gallery.findUnique({
        where: { id: data.galleryId },
      });

      if (!gallery) {
        return reply.code(404).send({ error: 'Gallery not found' });
      }

      if (!gallery.isActive) {
        return reply.code(403).send({ error: 'Gallery is not active' });
      }

      // Check if gallery is expired
      if (gallery.expiresAt && gallery.expiresAt < new Date()) {
        return reply.code(403).send({ error: 'Gallery has expired' });
      }

      // Create proof set
      const proofSet = await prisma.proofSet.create({
        data: {
          galleryId: data.galleryId,
          clientEmail: data.clientEmail,
          clientName: data.clientName,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.code(201).send(proofSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request data', details: error.issues });
      }
      request.log.error(error, 'Error starting proof set');
      return reply.code(500).send({ error: 'Failed to start proofing session' });
    }
  });

  /**
   * GET /api/proof/:proofSetId
   * Get proof set with selections and comments
   */
  fastify.get<{ Params: { proofSetId: string } }>(
    '/:proofSetId',
    async (request, reply) => {
      try {
        const { proofSetId } = request.params;

        const proofSet = await prisma.proofSet.findUnique({
          where: { id: proofSetId },
          include: {
            gallery: {
              include: {
                assets: {
                  include: {
                    asset: true,
                  },
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            },
            selections: {
              include: {
                asset: true,
              },
            },
            comments: {
              include: {
                asset: true,
                replies: true,
              },
              where: {
                parentId: null,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!proofSet) {
          return reply.code(404).send({ error: 'Proof set not found' });
        }

        // Update last active time
        await prisma.proofSet.update({
          where: { id: proofSetId },
          data: { lastActiveAt: new Date() },
        });

        return reply.send(proofSet);
      } catch (error) {
        request.log.error(error, 'Error fetching proof set');
        return reply.code(500).send({ error: 'Failed to fetch proof set' });
      }
    }
  );

  /**
   * PATCH /api/proof/:proofSetId/complete
   * Mark proof set as completed
   */
  fastify.patch<{ Params: { proofSetId: string } }>(
    '/:proofSetId/complete',
    async (request, reply) => {
      try {
        const { proofSetId } = request.params;

        const proofSet = await prisma.proofSet.update({
          where: { id: proofSetId },
          data: { completedAt: new Date() },
        });

        return reply.send(proofSet);
      } catch (error) {
        request.log.error(error, 'Error completing proof set');
        return reply.code(500).send({ error: 'Failed to complete proof set' });
      }
    }
  );

  // ============================================
  // SELECTION ROUTES
  // ============================================

  /**
   * POST /api/proof/:proofSetId/select
   * Add or update a selection (heart/flag/reject)
   */
  fastify.post<{ Params: { proofSetId: string } }>(
    '/:proofSetId/select',
    async (request, reply) => {
      try {
        const { proofSetId } = request.params;
        const data = selectionSchema.parse(request.body);

        // Verify asset exists in the gallery
        const proofSet = await prisma.proofSet.findUnique({
          where: { id: proofSetId },
          include: {
            gallery: {
              include: {
                assets: {
                  where: { assetId: data.assetId },
                },
              },
            },
          },
        });

        if (!proofSet) {
          return reply.code(404).send({ error: 'Proof set not found' });
        }

        if (proofSet.gallery.assets.length === 0) {
          return reply.code(404).send({ error: 'Asset not found in gallery' });
        }

        // Upsert selection
        const selection = await prisma.selection.upsert({
          where: {
            proofSetId_assetId: {
              proofSetId,
              assetId: data.assetId,
            },
          },
          update: {
            type: data.type as SelectionType,
            note: data.note,
          },
          create: {
            proofSetId,
            assetId: data.assetId,
            type: data.type as SelectionType,
            note: data.note,
          },
        });

        // Update proof set stats
        const totalSelected = await prisma.selection.count({
          where: {
            proofSetId,
            type: { in: ['HEART', 'FLAG'] },
          },
        });

        await prisma.proofSet.update({
          where: { id: proofSetId },
          data: {
            totalSelected,
            lastActiveAt: new Date(),
          },
        });

        return reply.send(selection);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid request data', details: error.issues });
        }
        request.log.error(error, 'Error creating selection');
        return reply.code(500).send({ error: 'Failed to create selection' });
      }
    }
  );

  /**
   * DELETE /api/proof/:proofSetId/select/:assetId
   * Remove a selection
   */
  fastify.delete<{ Params: { proofSetId: string; assetId: string } }>(
    '/:proofSetId/select/:assetId',
    async (request, reply) => {
      try {
        const { proofSetId, assetId } = request.params;

        await prisma.selection.delete({
          where: {
            proofSetId_assetId: {
              proofSetId,
              assetId,
            },
          },
        });

        // Update proof set stats
        const totalSelected = await prisma.selection.count({
          where: {
            proofSetId,
            type: { in: ['HEART', 'FLAG'] },
          },
        });

        await prisma.proofSet.update({
          where: { id: proofSetId },
          data: {
            totalSelected,
            lastActiveAt: new Date(),
          },
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error deleting selection');
        return reply.code(500).send({ error: 'Failed to delete selection' });
      }
    }
  );

  // ============================================
  // COMMENT ROUTES
  // ============================================

  /**
   * POST /api/proof/:proofSetId/comment
   * Add a comment to a photo
   */
  fastify.post<{ Params: { proofSetId: string } }>(
    '/:proofSetId/comment',
    async (request, reply) => {
      try {
        const { proofSetId } = request.params;
        const data = commentSchema.parse(request.body);

        // Verify proof set and asset
        const proofSet = await prisma.proofSet.findUnique({
          where: { id: proofSetId },
          include: {
            gallery: {
              include: {
                assets: {
                  where: { assetId: data.assetId },
                },
              },
            },
          },
        });

        if (!proofSet) {
          return reply.code(404).send({ error: 'Proof set not found' });
        }

        if (proofSet.gallery.assets.length === 0) {
          return reply.code(404).send({ error: 'Asset not found in gallery' });
        }

        // Create comment
        const comment = await prisma.comment.create({
          data: {
            proofSetId,
            assetId: data.assetId,
            text: data.text,
            parentId: data.parentId,
          },
          include: {
            asset: true,
            replies: true,
          },
        });

        // Update last active
        await prisma.proofSet.update({
          where: { id: proofSetId },
          data: { lastActiveAt: new Date() },
        });

        return reply.code(201).send(comment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid request data', details: error.issues });
        }
        request.log.error(error, 'Error creating comment');
        return reply.code(500).send({ error: 'Failed to create comment' });
      }
    }
  );

  /**
   * PATCH /api/proof/:proofSetId/comment/:commentId
   * Edit a comment
   */
  fastify.patch<{ Params: { proofSetId: string; commentId: string }; Body: { text: string } }>(
    '/:proofSetId/comment/:commentId',
    async (request, reply) => {
      try {
        const { proofSetId, commentId } = request.params;
        const { text } = z.object({ text: z.string().min(1).max(5000) }).parse(request.body);

        const comment = await prisma.comment.update({
          where: {
            id: commentId,
            proofSetId,
          },
          data: {
            text,
            edited: true,
            editedAt: new Date(),
          },
          include: {
            asset: true,
            replies: true,
          },
        });

        return reply.send(comment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid request data', details: error.issues });
        }
        request.log.error(error, 'Error updating comment');
        return reply.code(500).send({ error: 'Failed to update comment' });
      }
    }
  );

  /**
   * DELETE /api/proof/:proofSetId/comment/:commentId
   * Delete a comment
   */
  fastify.delete<{ Params: { proofSetId: string; commentId: string } }>(
    '/:proofSetId/comment/:commentId',
    async (request, reply) => {
      try {
        const { proofSetId, commentId } = request.params;

        await prisma.comment.delete({
          where: {
            id: commentId,
            proofSetId,
          },
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error deleting comment');
        return reply.code(500).send({ error: 'Failed to delete comment' });
      }
    }
  );

  // ============================================
  // EXPORT ROUTES
  // ============================================

  /**
   * GET /api/proof/:proofSetId/export
   * Export selections as CSV
   */
  fastify.get<{ Params: { proofSetId: string }; Querystring: { type?: string } }>(
    '/:proofSetId/export',
    async (request, reply) => {
      try {
        const { proofSetId } = request.params;
        const { type } = request.query;

        const proofSet = await prisma.proofSet.findUnique({
          where: { id: proofSetId },
          include: {
            gallery: true,
            selections: {
              include: {
                asset: true,
              },
              where: type ? { type: type as SelectionType } : undefined,
              orderBy: {
                createdAt: 'asc',
              },
            },
            comments: {
              include: {
                asset: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });

        if (!proofSet) {
          return reply.code(404).send({ error: 'Proof set not found' });
        }

        // Build CSV
        let csv = 'Filename,Selection Type,Note,Comments,Date Selected\n';

        for (const selection of proofSet.selections) {
          const comments = proofSet.comments
            .filter((c) => c.assetId === selection.assetId)
            .map((c) => c.text.replace(/"/g, '""'))
            .join(' | ');

          const note = selection.note ? selection.note.replace(/"/g, '""') : '';
          
          csv += `"${selection.asset.filename}","${selection.type}","${note}","${comments}","${selection.createdAt.toISOString()}"\n`;
        }

        return reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="selections-${proofSet.gallery.name}-${Date.now()}.csv"`)
          .send(csv);
      } catch (error) {
        request.log.error(error, 'Error exporting selections');
        return reply.code(500).send({ error: 'Failed to export selections' });
      }
    }
  );
}