import { PrismaClient, ReleaseType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateRightsPresetData {
  name: string;
  description?: string;
  creator: string;
  copyrightNotice: string;
  usageRights: string;
  creditLine?: string;
  instructions?: string;
  city?: string;
  state?: string;
  country?: string;
  keywords?: string[];
  isDefault?: boolean;
}

export interface UpdateRightsPresetData extends Partial<CreateRightsPresetData> {}

export interface CreateReleaseData {
  type: ReleaseType;
  releaseName: string;
  releaseDate?: Date;
  expiryDate?: Date;
  documentPath?: string;
  notes?: string;
  clientId?: string;
}

export interface UpdateReleaseData extends Partial<CreateReleaseData> {}

export class RightsService {
  /**
   * List all rights presets
   */
  static async listRightsPresets(activeOnly: boolean = true) {
    const where = activeOnly ? { isActive: true } : {};

    const presets = await prisma.rightsPreset.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    return presets;
  }

  /**
   * Get a single rights preset
   */
  static async getRightsPreset(id: string) {
    const preset = await prisma.rightsPreset.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!preset) {
      throw new Error('Rights preset not found');
    }

    return preset;
  }

  /**
   * Get the default rights preset
   */
  static async getDefaultRightsPreset() {
    const preset = await prisma.rightsPreset.findFirst({
      where: { isDefault: true, isActive: true },
    });

    return preset;
  }

  /**
   * Create a new rights preset
   */
  static async createRightsPreset(data: CreateRightsPresetData, userId: string) {
    // If this preset is set as default, unset all other defaults
    if (data.isDefault) {
      await prisma.rightsPreset.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.rightsPreset.create({
      data: {
        ...data,
        keywords: data.keywords || [],
        createdBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'RightsPreset',
        entityId: preset.id,
        userId,
        metadata: {
          name: preset.name,
        },
      },
    });

    return preset;
  }

  /**
   * Update a rights preset
   */
  static async updateRightsPreset(
    id: string,
    data: UpdateRightsPresetData,
    userId: string
  ) {
    const existing = await prisma.rightsPreset.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Rights preset not found');
    }

    // If this preset is set as default, unset all other defaults
    if (data.isDefault) {
      await prisma.rightsPreset.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.rightsPreset.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'RightsPreset',
        entityId: id,
        userId,
        changes: {
          old: existing,
          new: updated,
        },
      },
    });

    return updated;
  }

  /**
   * Delete a rights preset
   */
  static async deleteRightsPreset(id: string, userId: string) {
    const preset = await prisma.rightsPreset.findUnique({ where: { id } });

    if (!preset) {
      throw new Error('Rights preset not found');
    }

    // Soft delete by marking as inactive
    const deleted = await prisma.rightsPreset.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'RightsPreset',
        entityId: id,
        userId,
        metadata: { name: preset.name },
      },
    });

    return deleted;
  }

  /**
   * List releases
   */
  static async listReleases(filters: {
    type?: ReleaseType;
    clientId?: string;
  } = {}) {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    const releases = await prisma.release.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedByUser: {
          select: { name: true, email: true },
        },
        client: {
          select: { name: true, email: true },
        },
      },
    });

    return releases;
  }

  /**
   * Get a single release
   */
  static async getRelease(id: string) {
    const release = await prisma.release.findUnique({
      where: { id },
      include: {
        uploadedByUser: {
          select: { name: true, email: true },
        },
        client: true,
      },
    });

    if (!release) {
      throw new Error('Release not found');
    }

    return release;
  }

  /**
   * Create a new release
   */
  static async createRelease(data: CreateReleaseData, userId: string) {
    const release = await prisma.release.create({
      data: {
        ...data,
        uploadedBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Release',
        entityId: release.id,
        userId,
        clientId: data.clientId,
        metadata: {
          type: release.type,
          releaseName: release.releaseName,
        },
      },
    });

    return release;
  }

  /**
   * Update a release
   */
  static async updateRelease(id: string, data: UpdateReleaseData, userId: string) {
    const existing = await prisma.release.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Release not found');
    }

    const updated = await prisma.release.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Release',
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
   * Delete a release
   */
  static async deleteRelease(id: string, userId: string) {
    const release = await prisma.release.findUnique({ where: { id } });

    if (!release) {
      throw new Error('Release not found');
    }

    await prisma.release.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Release',
        entityId: id,
        userId,
        clientId: release.clientId,
        metadata: {
          type: release.type,
          releaseName: release.releaseName,
        },
      },
    });

    return release;
  }
}