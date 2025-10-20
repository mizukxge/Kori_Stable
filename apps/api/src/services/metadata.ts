import { exiftool, Tags } from 'exiftool-vendored';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

export interface MetadataFields {
  creator?: string;
  copyrightNotice?: string;
  usageRights?: string;
  creditLine?: string;
  instructions?: string;
  keywords?: string[];
  city?: string;
  state?: string;
  country?: string;
  // Release status
  modelReleaseStatus?: 'None' | 'Not Applicable' | 'Unlimited Model Releases' | 'Limited or Incomplete Model Releases';
  propertyReleaseStatus?: 'None' | 'Not Applicable' | 'Unlimited Property Releases' | 'Limited or Incomplete Property Releases';
}

export interface EmbedOptions {
  dryRun?: boolean;
  overwrite?: boolean;
}

export class MetadataService {
  /**
   * Read metadata from a file
   */
  static async readMetadata(filepath: string): Promise<Tags> {
    try {
      const fullPath = path.isAbsolute(filepath) 
        ? filepath 
        : path.join(process.cwd(), filepath);
      
      const tags = await exiftool.read(fullPath);
      return tags;
    } catch (error) {
      console.error('Error reading metadata:', error);
      throw new Error(`Failed to read metadata: ${error}`);
    }
  }

  /**
   * Write metadata to a file
   */
  static async writeMetadata(
    filepath: string,
    metadata: MetadataFields,
    options: EmbedOptions = {}
  ): Promise<void> {
    const { dryRun = false, overwrite = false } = options;

    try {
      const fullPath = path.isAbsolute(filepath) 
        ? filepath 
        : path.join(process.cwd(), filepath);

      if (dryRun) {
        console.log(`[DRY RUN] Would write metadata to: ${fullPath}`);
        console.log('Metadata:', JSON.stringify(metadata, null, 2));
        return;
      }

      // Build IPTC/XMP tags object
      const tags: any = {};

      // IPTC Creator/Copyright fields
      if (metadata.creator) {
        tags.Creator = metadata.creator;
        tags.Artist = metadata.creator; // EXIF equivalent
        tags['By-line'] = metadata.creator; // IPTC
      }

      if (metadata.copyrightNotice) {
        tags.Copyright = metadata.copyrightNotice;
        tags.CopyrightNotice = metadata.copyrightNotice; // IPTC
      }

      if (metadata.usageRights) {
        tags.UsageTerms = metadata.usageRights; // XMP
        tags.Rights = metadata.usageRights; // XMP
      }

      if (metadata.creditLine) {
        tags.Credit = metadata.creditLine; // IPTC
      }

      if (metadata.instructions) {
        tags.Instructions = metadata.instructions; // IPTC
      }

      // Keywords
      if (metadata.keywords && metadata.keywords.length > 0) {
        tags.Keywords = metadata.keywords; // IPTC
        tags.Subject = metadata.keywords; // XMP
      }

      // Location
      if (metadata.city) {
        tags.City = metadata.city; // IPTC
      }

      if (metadata.state) {
        tags['Province-State'] = metadata.state; // IPTC
      }

      if (metadata.country) {
        tags['Country-PrimaryLocationName'] = metadata.country; // IPTC
      }

      // Release status
      if (metadata.modelReleaseStatus) {
        tags.ModelReleaseStatus = metadata.modelReleaseStatus; // IPTC Extension
      }

      if (metadata.propertyReleaseStatus) {
        tags.PropertyReleaseStatus = metadata.propertyReleaseStatus; // IPTC Extension
      }

      // Write tags to file
      await exiftool.write(fullPath, tags, [
        overwrite ? '-overwrite_original' : '-P'
      ]);

      console.log(`✅ Metadata written to: ${fullPath}`);
    } catch (error) {
      console.error('Error writing metadata:', error);
      throw new Error(`Failed to write metadata: ${error}`);
    }
  }

  /**
   * Apply rights preset to an asset
   */
  static async applyRightsPreset(
    assetId: string,
    presetId: string,
    options: EmbedOptions = {}
  ): Promise<void> {
    // Get asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Get rights preset
    const preset = await prisma.rightsPreset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new Error('Rights preset not found');
    }

    // Build metadata from preset
    const metadata: MetadataFields = {
      creator: preset.creator,
      copyrightNotice: preset.copyrightNotice,
      usageRights: preset.usageRights,
      creditLine: preset.creditLine || undefined,
      instructions: preset.instructions || undefined,
      keywords: preset.keywords,
      city: preset.city || undefined,
      state: preset.state || undefined,
      country: preset.country || undefined,
    };

    // Write metadata to file
    await this.writeMetadata(asset.filepath, metadata, options);

    // Update asset metadata in database
    if (!options.dryRun) {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          metadata: {
            ...asset.metadata as object,
            rightsPresetId: presetId,
            lastMetadataUpdate: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Batch apply rights preset to multiple assets
   */
  static async batchApplyRightsPreset(
    assetIds: string[],
    presetId: string,
    options: EmbedOptions = {}
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const assetId of assetIds) {
      try {
        await this.applyRightsPreset(assetId, presetId, options);
        results.success++;
        console.log(`✅ Applied preset to asset ${assetId}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          assetId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`❌ Failed to apply preset to asset ${assetId}:`, error);
      }
    }

    return results;
  }

  /**
   * Strip all metadata from a file (for privacy)
   */
  static async stripMetadata(
    filepath: string,
    options: EmbedOptions = {}
  ): Promise<void> {
    const { dryRun = false } = options;

    try {
      const fullPath = path.isAbsolute(filepath) 
        ? filepath 
        : path.join(process.cwd(), filepath);

      if (dryRun) {
        console.log(`[DRY RUN] Would strip all metadata from: ${fullPath}`);
        return;
      }

      // Strip all metadata except orientation
      await exiftool.write(fullPath, {}, ['-all=', '-tagsfromfile', '@', '-orientation']);

      console.log(`✅ Metadata stripped from: ${fullPath}`);
    } catch (error) {
      console.error('Error stripping metadata:', error);
      throw new Error(`Failed to strip metadata: ${error}`);
    }
  }

  /**
   * Close exiftool process (important for cleanup)
   */
  static async close(): Promise<void> {
    await exiftool.end();
  }
}