import { Router, Request, Response } from 'express';
import { PrismaClient, SelectionType } from '@prisma/client';
import { z } from 'zod';

const router = Router();
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

// ============================================
// PROOF SET ROUTES
// ============================================

/**
 * POST /api/proof/start
 * Start a new proofing session
 */
router.post('/start', async (req: Request, res: Response): Promise<any> => {
  try {
    const data = createProofSetSchema.parse(req.body);

    // Verify gallery exists and is active
    const gallery = await prisma.gallery.findUnique({
      where: { id: data.galleryId },
    });

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    if (!gallery.isActive) {
      return res.status(403).json({ error: 'Gallery is not active' });
    }

    // Check if gallery is expired
    if (gallery.expiresAt && gallery.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Gallery has expired' });
    }

    // Create proof set
    const proofSet = await prisma.proofSet.create({
      data: {
        galleryId: data.galleryId,
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json(proofSet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error starting proof set:', error);
    res.status(500).json({ error: 'Failed to start proofing session' });
  }
});

/**
 * GET /api/proof/:proofSetId
 * Get proof set with selections and comments
 */
router.get('/:proofSetId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId } = req.params;

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
            parentId: null, // Only top-level comments
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!proofSet) {
      return res.status(404).json({ error: 'Proof set not found' });
    }

    // Update last active time
    await prisma.proofSet.update({
      where: { id: proofSetId },
      data: { lastActiveAt: new Date() },
    });

    res.json(proofSet);
  } catch (error) {
    console.error('Error fetching proof set:', error);
    res.status(500).json({ error: 'Failed to fetch proof set' });
  }
});

/**
 * PATCH /api/proof/:proofSetId/complete
 * Mark proof set as completed
 */
router.patch('/:proofSetId/complete', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId } = req.params;

    const proofSet = await prisma.proofSet.update({
      where: { id: proofSetId },
      data: { completedAt: new Date() },
    });

    res.json(proofSet);
  } catch (error) {
    console.error('Error completing proof set:', error);
    res.status(500).json({ error: 'Failed to complete proof set' });
  }
});

// ============================================
// SELECTION ROUTES
// ============================================

/**
 * POST /api/proof/:proofSetId/select
 * Add or update a selection (heart/flag/reject)
 */
router.post('/:proofSetId/select', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId } = req.params;
    const data = selectionSchema.parse(req.body);

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
      return res.status(404).json({ error: 'Proof set not found' });
    }

    if (proofSet.gallery.assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found in gallery' });
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

    res.json(selection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error creating selection:', error);
    res.status(500).json({ error: 'Failed to create selection' });
  }
});

/**
 * DELETE /api/proof/:proofSetId/select/:assetId
 * Remove a selection
 */
router.delete('/:proofSetId/select/:assetId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId, assetId } = req.params;

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

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting selection:', error);
    res.status(500).json({ error: 'Failed to delete selection' });
  }
});

// ============================================
// COMMENT ROUTES
// ============================================

/**
 * POST /api/proof/:proofSetId/comment
 * Add a comment to a photo
 */
router.post('/:proofSetId/comment', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId } = req.params;
    const data = commentSchema.parse(req.body);

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
      return res.status(404).json({ error: 'Proof set not found' });
    }

    if (proofSet.gallery.assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found in gallery' });
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

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * PATCH /api/proof/:proofSetId/comment/:commentId
 * Edit a comment
 */
router.patch('/:proofSetId/comment/:commentId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId, commentId } = req.params;
    const { text } = z.object({ text: z.string().min(1).max(5000) }).parse(req.body);

    const comment = await prisma.comment.update({
      where: {
        id: commentId,
        proofSetId, // Ensure comment belongs to this proof set
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

    res.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

/**
 * DELETE /api/proof/:proofSetId/comment/:commentId
 * Delete a comment
 */
router.delete('/:proofSetId/comment/:commentId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId, commentId } = req.params;

    await prisma.comment.delete({
      where: {
        id: commentId,
        proofSetId, // Ensure comment belongs to this proof set
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ============================================
// EXPORT ROUTES
// ============================================

/**
 * GET /api/proof/:proofSetId/export
 * Export selections as CSV
 */
router.get('/:proofSetId/export', async (req: Request, res: Response): Promise<any> => {
  try {
    const { proofSetId } = req.params;
    const { type } = req.query;

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
      return res.status(404).json({ error: 'Proof set not found' });
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

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="selections-${proofSet.gallery.name}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting selections:', error);
    res.status(500).json({ error: 'Failed to export selections' });
  }
});

export default router;