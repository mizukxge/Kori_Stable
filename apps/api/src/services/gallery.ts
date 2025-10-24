import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import argon2 from 'argon2';

const prisma = new PrismaClient();

export interface CreateGalleryData {
  name: string;
  description?: string;
  password?: string;
  expiresAt?: Date;
  clientId?: string;
  assetIds?: string[];
}

export interface UpdateGalleryData {
  name?: string;
  description?: string;
  password?: string;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface GalleryAccessResult {
  valid: boolean;
  gallery?: any;
  reason?: string;
}

export class GalleryService {
  /**
   * Generate a secure random token for gallery URL
   */
  static generateToken(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Create a new gallery
   */
  static async createGallery(data: CreateGalleryData, userId: string) {
    const token = this.generateToken();

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await argon2.hash(data.password);
    }

    // Create gallery
    const gallery = await prisma.gallery.create({
      data: {
        token,
        name: data.name,
        description: data.description,
        password: hashedPassword,
        expiresAt: data.expiresAt,
        clientId: data.clientId,
        createdBy: userId,
      },
    });

    // Add assets if provided
    if (data.assetIds && data.assetIds.length > 0) {
      await this.addAssetsToGallery(gallery.id, data.assetIds);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Gallery',
        entityId: gallery.id,
        userId,
        clientId: data.clientId,
        metadata: {
          name: gallery.name,
          token: gallery.token,
          assetCount: data.assetIds?.length || 0,
        },
      },
    });

    return gallery;
  }

  /**
   * List galleries (admin)
   */
  static async listGalleries(filters: {
    clientId?: string;
    isActive?: boolean;
  } = {}) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const galleries = await prisma.gallery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        client: {
          select: { name: true, email: true },
        },
        coverPhoto: {
          select: {
            id: true,
            storedName: true,
            category: true,
          },
        },
        assets: {
          include: {
            asset: {
              select: {
                id: true,
                storedName: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { 
            assets: true,
          },
        },
      },
    });

    // Map galleries to include cover photo URL
    // Map galleries to include cover photo URL and favorite count
    return galleries.map(gallery => ({
      ...gallery,
      coverPhotoUrl: gallery.coverPhoto
        ? `http://localhost:3001/uploads/${gallery.coverPhoto.category}/${gallery.coverPhoto.storedName}`
        : gallery.assets[0]?.asset
        ? `http://localhost:3001/uploads/${gallery.assets[0].asset.category}/${gallery.assets[0].asset.storedName}`
        : null,
      favoriteCount: gallery.assets.filter(ga => ga.isFavorite).length,
    }));
  }

  /**
   * Get gallery by ID (admin)
   */
  static async getGalleryById(id: string) {
    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
        client: true,
        coverPhoto: {
          select: {
            id: true,
            storedName: true,
            category: true,
          },
        },
        assets: {
          include: {
            asset: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!gallery) {
      throw new Error('Gallery not found');
    }

    return gallery;
  }

  /**
   * Get gallery by token (public)
   */
  static async getGalleryByToken(token: string) {
    const gallery = await prisma.gallery.findUnique({
      where: { token },
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    if (!gallery) {
      throw new Error('Gallery not found');
    }

    return gallery;
  }
  /**
   * Validate gallery access
   */
  static async validateAccess(token: string, password?: string): Promise<GalleryAccessResult> {
    const gallery = await this.getGalleryByToken(token);

    // Check if gallery is active
    if (!gallery.isActive) {
      return {
        valid: false,
        reason: 'Gallery is no longer active',
      };
    }

    // Check expiry
    if (gallery.expiresAt && gallery.expiresAt < new Date()) {
      return {
        valid: false,
        reason: 'Gallery has expired',
      };
    }

    // Check password if gallery is protected
    if (gallery.password) {
      if (!password) {
        return {
          valid: false,
          reason: 'Password required',
        };
      }

      const isValid = await argon2.verify(gallery.password, password);
      if (!isValid) {
        return {
          valid: false,
          reason: 'Invalid password',
        };
      }
    }

    // Increment view count
    await prisma.gallery.update({
      where: { id: gallery.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      valid: true,
      gallery,
    };
  }

  /**
   * Get gallery items (public)
   */
  static async getGalleryItems(token: string) {
    const gallery = await prisma.gallery.findUnique({
      where: { token },
      include: {
        assets: {
          include: {
            asset: {
              select: {
                id: true,
                filename: true,
                filepath: true,
                mimeType: true,
                size: true,
                category: true,
                width: true,
                height: true,
                duration: true,
                createdAt: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!gallery) {
      throw new Error('Gallery not found');
    }

    return gallery.assets.map(ga => ({
      ...ga.asset,
      size: ga.asset.size.toString(),
      position: ga.position,
    }));
  }

  /**
   * Update gallery
   */
  static async updateGallery(id: string, data: UpdateGalleryData, userId: string) {
    const existing = await prisma.gallery.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Gallery not found');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password !== undefined) {
      if (data.password) {
        hashedPassword = await argon2.hash(data.password);
      } else {
        hashedPassword = null as any; // Remove password
      }
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        password: hashedPassword !== undefined ? hashedPassword : undefined,
        expiresAt: data.expiresAt,
        isActive: data.isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Gallery',
        entityId: id,
        userId,
        clientId: updated.clientId,
        changes: {
          old: existing,
          new: updated,
        },
      },
    });

    return updated;
  }

  /**
   * Delete gallery
   */
  static async deleteGallery(id: string, userId: string) {
    const gallery = await prisma.gallery.findUnique({ where: { id } });

    if (!gallery) {
      throw new Error('Gallery not found');
    }

    // Delete gallery (cascade will remove gallery_assets)
    await prisma.gallery.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Gallery',
        entityId: id,
        userId,
        clientId: gallery.clientId,
        metadata: {
          name: gallery.name,
          token: gallery.token,
        },
      },
    });

    return gallery;
  }

  /**
   * Add assets to gallery
   */
  static async addAssetsToGallery(galleryId: string, assetIds: string[]) {
    // Get current max position
    const maxPosition = await prisma.galleryAsset.findFirst({
      where: { galleryId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const startPosition = maxPosition ? maxPosition.position + 1 : 0;

    // Create gallery assets
    const galleryAssets = assetIds.map((assetId, index) => ({
      galleryId,
      assetId,
      position: startPosition + index,
    }));

    await prisma.galleryAsset.createMany({
      data: galleryAssets,
      skipDuplicates: true,
    });

    return galleryAssets;
  }

  /**
   * Remove asset from gallery
   */
  static async removeAssetFromGallery(galleryId: string, assetId: string) {
    await prisma.galleryAsset.deleteMany({
      where: {
        galleryId,
        assetId,
      },
    });
  }

  /**
   * Reorder assets in gallery
   */
  static async reorderAssets(galleryId: string, assetIds: string[]) {
    // Update positions based on array order
    const updates = assetIds.map((assetId, index) =>
      prisma.galleryAsset.updateMany({
        where: { galleryId, assetId },
        data: { position: index },
      })
    );

    await prisma.$transaction(updates);
  }

  /**
   * Get gallery statistics
   */
  static async getGalleryStats() {
    const [total, active, expired, passwordProtected, totalViews] = await Promise.all([
      prisma.gallery.count(),
      prisma.gallery.count({ where: { isActive: true } }),
      prisma.gallery.count({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true,
        },
      }),
      prisma.gallery.count({
        where: { password: { not: null } },
      }),
      prisma.gallery.aggregate({
        _sum: { viewCount: true },
      }),
    ]);

    return {
      total,
      active,
      expired,
      passwordProtected,
      totalViews: totalViews._sum.viewCount || 0,
    };
  }
  /**
   * Toggle favorite status for an asset in a gallery
   */
  static async toggleFavorite(galleryId: string, assetId: string, isFavorite: boolean) {
    const galleryAsset = await prisma.galleryAsset.update({
      where: {
        galleryId_assetId: {
          galleryId,
          assetId,
        },
      },
      data: {
        isFavorite,
      },
    });

    return galleryAsset;
  }
}