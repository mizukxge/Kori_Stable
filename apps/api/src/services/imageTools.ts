import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createHash } from 'crypto';

// Image processing options
export interface ImageProcessOptions {
  inputPath: string;
  outputPath: string;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  watermark?: {
    text?: string;
    imagePath?: string;
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity?: number;
  };
  preserveMetadata?: boolean;
}

// Image processing result
export interface ImageProcessResult {
  success: boolean;
  outputPath?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number; // File size in bytes
  hash?: string; // SHA256 hash
  error?: string;
}

// Image presets
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, fit: 'cover' as const, quality: 80 },
  small: { width: 400, height: 400, fit: 'inside' as const, quality: 85 },
  medium: { width: 800, height: 800, fit: 'inside' as const, quality: 85 },
  large: { width: 1600, height: 1600, fit: 'inside' as const, quality: 90 },
  xlarge: { width: 2400, height: 2400, fit: 'inside' as const, quality: 90 },
  original: {}, // No resizing
};

/**
 * Image Processing Service
 */
export class ImageTools {
  /**
   * Process an image with given options
   */
  static async processImage(options: ImageProcessOptions): Promise<ImageProcessResult> {
    try {
      // Validate input file exists
      if (!existsSync(options.inputPath)) {
        throw new Error(`Input file not found: ${options.inputPath}`);
      }

      // Create sharp instance
      let image = sharp(options.inputPath);

      // Preserve metadata if requested
      if (options.preserveMetadata) {
        image = image.withMetadata();
      }

      // Resize if dimensions specified
      if (options.width || options.height) {
        image = image.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'inside',
          withoutEnlargement: true, // Don't upscale
        });
      }

      // Apply watermark if specified
      if (options.watermark) {
        image = await this.applyWatermark(image, options.watermark);
      }

      // Convert format if specified
      if (options.format) {
        switch (options.format) {
          case 'jpeg':
            image = image.jpeg({ quality: options.quality || 85 });
            break;
          case 'png':
            image = image.png({ quality: options.quality || 90 });
            break;
          case 'webp':
            image = image.webp({ quality: options.quality || 85 });
            break;
          case 'avif':
            image = image.avif({ quality: options.quality || 85 });
            break;
        }
      }

      // Process and save
      const buffer = await image.toBuffer({ resolveWithObject: true });

      // Write output file
      writeFileSync(options.outputPath, buffer.data);

      // Calculate hash
      const hash = createHash('sha256').update(buffer.data).digest('hex');

      console.log(`Image processed: ${options.outputPath}`);
      console.log(`  Dimensions: ${buffer.info.width}x${buffer.info.height}`);
      console.log(`  Format: ${buffer.info.format}`);
      console.log(`  Size: ${buffer.data.length} bytes`);

      return {
        success: true,
        outputPath: options.outputPath,
        width: buffer.info.width,
        height: buffer.info.height,
        format: buffer.info.format,
        size: buffer.data.length,
        hash,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply watermark to image
   */
  private static async applyWatermark(
    image: sharp.Sharp,
    watermark: NonNullable<ImageProcessOptions['watermark']>
  ): Promise<sharp.Sharp> {
    // For now, skip watermark application
    // In production, you'd create a text/image overlay using sharp composite
    console.log('Watermark application not yet implemented');
    return image;
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    inputPath: string,
    outputPath: string,
    size: number = 150
  ): Promise<ImageProcessResult> {
    return this.processImage({
      inputPath,
      outputPath,
      width: size,
      height: size,
      fit: 'cover',
      quality: 80,
      format: 'jpeg',
    });
  }

  /**
   * Convert to WebP
   */
  static async convertToWebP(
    inputPath: string,
    outputPath: string,
    quality: number = 85
  ): Promise<ImageProcessResult> {
    return this.processImage({
      inputPath,
      outputPath,
      format: 'webp',
      quality,
    });
  }

  /**
   * Convert to AVIF
   */
  static async convertToAVIF(
    inputPath: string,
    outputPath: string,
    quality: number = 85
  ): Promise<ImageProcessResult> {
    return this.processImage({
      inputPath,
      outputPath,
      format: 'avif',
      quality,
    });
  }

  /**
   * Apply preset to image
   */
  static async applyPreset(
    inputPath: string,
    outputPath: string,
    presetName: keyof typeof IMAGE_PRESETS,
    options?: Partial<ImageProcessOptions>
  ): Promise<ImageProcessResult> {
    const preset = IMAGE_PRESETS[presetName];
    
    return this.processImage({
      inputPath,
      outputPath,
      ...preset,
      ...options,
    });
  }

  /**
   * Get image metadata
   */
  static async getMetadata(imagePath: string): Promise<sharp.Metadata> {
    return sharp(imagePath).metadata();
  }

  /**
   * Batch process images
   */
  static async batchProcess(
    jobs: ImageProcessOptions[]
  ): Promise<ImageProcessResult[]> {
    const results: ImageProcessResult[] = [];

    for (const job of jobs) {
      const result = await this.processImage(job);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate multiple derivatives from single source
   */
  static async generateDerivatives(
    inputPath: string,
    outputDir: string,
    presets: (keyof typeof IMAGE_PRESETS)[]
  ): Promise<Record<string, ImageProcessResult>> {
    const results: Record<string, ImageProcessResult> = {};
    const baseName = basename(inputPath, extname(inputPath));

    for (const presetName of presets) {
      const outputPath = join(outputDir, `${baseName}-${presetName}.jpg`);
      results[presetName] = await this.applyPreset(inputPath, outputPath, presetName);
    }

    return results;
  }

  /**
   * Optimize image (reduce file size without quality loss)
   */
  static async optimize(
    inputPath: string,
    outputPath: string
  ): Promise<ImageProcessResult> {
    try {
      const metadata = await sharp(inputPath).metadata();
      
      let quality = 85;
      let format: 'jpeg' | 'png' | 'webp' = 'jpeg';

      // Choose best format based on input
      if (metadata.format === 'png' && metadata.hasAlpha) {
        format = 'png';
        quality = 90;
      } else if (metadata.format === 'webp') {
        format = 'webp';
      }

      return this.processImage({
        inputPath,
        outputPath,
        format,
        quality,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}