import { PrismaClient, AssetCategory } from '@prisma/client';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import exifr from 'exifr';
import ffprobe from '@ffprobe-installer/ffprobe';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface UploadedFile {
  filename: string;
  data: Buffer;
  mimetype: string;
  size: number;
}

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  exif?: any;
  videoCodec?: string;
  audioCodec?: string;
}

// Helper to convert BigInt to string for JSON serialization
function serializeAsset(asset: any) {
  return {
    ...asset,
    size: asset.size?.toString(),
  };
}

export class AssetService {
  /**
   * Calculate SHA256 checksum of file
   */
  static async calculateChecksum(buffer: Buffer): Promise<string> {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Determine asset category based on MIME type
   */
  static categorizeAsset(mimetype: string): AssetCategory {
    if (mimetype.startsWith('image/')) {
      const rawFormats = ['image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng'];
      
      if (rawFormats.includes(mimetype) || mimetype.includes('raw')) {
        return 'RAW';
      }
      
      return 'EDIT';
    }
    
    if (mimetype.startsWith('video/')) {
      return 'VIDEO';
    }
    
    return 'EDIT';
  }

  /**
   * Extract metadata from image file
   */
  static async extractImageMetadata(buffer: Buffer): Promise<AssetMetadata> {
    try {
      const metadata: AssetMetadata = {};

      const imageInfo = await sharp(buffer).metadata();
      metadata.width = imageInfo.width;
      metadata.height = imageInfo.height;

      try {
        const exifData = await exifr.parse(buffer);
        if (exifData) {
          metadata.exif = exifData;
        }
      } catch (exifError) {
        console.log('EXIF extraction failed:', exifError);
      }

      return metadata;
    } catch (error) {
      console.error('Image metadata extraction failed:', error);
      return {};
    }
  }

  /**
   * Extract metadata from video file
   */
  static async extractVideoMetadata(filepath: string): Promise<AssetMetadata> {
    try {
      const ffprobePath = ffprobe.path;
      const { stdout } = await execAsync(
        `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${filepath}"`
      );

      const probeData = JSON.parse(stdout);
      const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video');
      const audioStream = probeData.streams?.find((s: any) => s.codec_type === 'audio');

      return {
        width: videoStream?.width,
        height: videoStream?.height,
        duration: parseFloat(probeData.format?.duration || '0'),
        videoCodec: videoStream?.codec_name,
        audioCodec: audioStream?.codec_name,
      };
    } catch (error) {
      console.error('Video metadata extraction failed:', error);
      return {};
    }
  }

  /**
   * Upload and process asset
   */
  static async uploadAsset(
    file: UploadedFile,
    userId: string,
    clientId?: string
  ) {
    const checksum = await this.calculateChecksum(file.data);

    const existing = await prisma.asset.findUnique({
      where: { checksum },
    });

    if (existing) {
      throw new Error('Asset with this checksum already exists (duplicate file)');
    }

    const category = this.categorizeAsset(file.mimetype);
    const ext = path.extname(file.filename);
    const storedName = `${checksum}${ext}`;
    const categoryDir = path.join(UPLOADS_DIR, category);
    const filepath = path.join(categoryDir, storedName);

    await fs.mkdir(categoryDir, { recursive: true });
    await fs.writeFile(filepath, file.data);

    let metadata: AssetMetadata = {};
    if (category === 'VIDEO') {
      metadata = await this.extractVideoMetadata(filepath);
    } else if (category === 'RAW' || category === 'EDIT') {
      metadata = await this.extractImageMetadata(file.data);
    }

    const asset = await prisma.asset.create({
      data: {
        filename: file.filename,
        storedName,
        filepath: path.relative(process.cwd(), filepath),
        mimeType: file.mimetype,
        size: BigInt(file.size),
        checksum,
        category,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        metadata: metadata.exif || {},
        clientId,
        uploadedBy: userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD',
        entityType: 'Asset',
        entityId: asset.id,
        userId,
        clientId,
        metadata: {
          filename: file.filename,
          category,
          size: file.size,
          checksum,
        },
      },
    });

    return serializeAsset(asset);
  }

  /**
   * List assets with filters and pagination
   */
  static async listAssets(
    filters: {
      category?: AssetCategory;
      clientId?: string;
      search?: string;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.search) {
      where.filename = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedByUser: {
            select: { name: true, email: true },
          },
          client: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      data: assets.map(serializeAsset),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single asset by ID
   */
  static async getAsset(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        uploadedByUser: {
          select: { name: true, email: true },
        },
        client: true,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    return serializeAsset(asset);
  }

  /**
   * Delete asset (removes file and database record)
   */
  static async deleteAsset(id: string, userId: string) {
    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      throw new Error('Asset not found');
    }

    const fullPath = path.join(process.cwd(), asset.filepath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
    }

    await prisma.asset.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Asset',
        entityId: id,
        userId,
        clientId: asset.clientId,
        metadata: {
          filename: asset.filename,
          category: asset.category,
          checksum: asset.checksum,
        },
      },
    });

    return serializeAsset(asset);
  }

  /**
   * Get asset statistics
   */
  static async getAssetStats() {
    const [total, byCategory, totalSize] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({
        by: ['category'],
        _count: true,
      }),
      prisma.asset.aggregate({
        _sum: { size: true },
      }),
    ]);

    const stats: any = {
      total,
      totalSize: totalSize._sum.size?.toString() || '0',
      byCategory: {},
    };

    byCategory.forEach((cat) => {
      stats.byCategory[cat.category] = cat._count;
    });

    return stats;
  }
}