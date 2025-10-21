import { ImageTools } from './imageTools.js';
import { ImageParams, verifyRequestSignature } from '../utils/signResize.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { createHash } from 'crypto';
import sharp from 'sharp';

// Cache configuration
const CACHE_DIR = join(process.cwd(), 'cache', 'images');
const CACHE_MAX_AGE = 31536000; // 1 year in seconds

// Ensure cache directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Image Optimization Service
 * Handles on-the-fly image transformations with caching
 */
export class ImageOptimizationService {
  /**
   * Process image with transformation parameters
   */
  async processImage(sourcePath: string, params: ImageParams): Promise<Buffer> {
    // Check cache first
    const cacheKey = this.generateCacheKey(sourcePath, params);
    const cachedPath = join(CACHE_DIR, cacheKey);

    if (existsSync(cachedPath)) {
      console.log(`Cache hit: ${cacheKey}`);
      return readFileSync(cachedPath);
    }

    console.log(`Cache miss: ${cacheKey}`);

    // Load source image
    let image = sharp(sourcePath);

    // Apply transformations
    image = await this.applyTransformations(image, params);

    // Get buffer
    const buffer = await image.toBuffer();

    // Cache the result
    writeFileSync(cachedPath, buffer);

    return buffer;
  }

  /**
   * Apply transformations to image
   */
  private async applyTransformations(image: sharp.Sharp, params: ImageParams): Promise<sharp.Sharp> {
    // Resize
    if (params.w || params.h) {
      const resizeOptions: sharp.ResizeOptions = {
        width: params.w,
        height: params.h,
        withoutEnlargement: true,
      };

      if (params.fit) {
        resizeOptions.fit = params.fit;
      }

      // Apply DPR multiplier
      if (params.dpr && params.dpr > 1) {
        if (resizeOptions.width) resizeOptions.width *= params.dpr;
        if (resizeOptions.height) resizeOptions.height *= params.dpr;
      }

      image = image.resize(resizeOptions);
    }

    // Rotate
    if (params.rotate) {
      image = image.rotate(params.rotate);
    }

    // Flip
    if (params.flip === 'h') {
      image = image.flop();
    } else if (params.flip === 'v') {
      image = image.flip();
    }

    // Blur
    if (params.blur) {
      image = image.blur(params.blur);
    }

    // Sharpen
    if (params.sharpen) {
      image = image.sharpen(params.sharpen);
    }

    // Grayscale
    if (params.grayscale) {
      image = image.grayscale();
    }

    // Background color
    if (params.bg) {
      image = image.flatten({
        background: `#${params.bg}`,
      });
    }

    // Format conversion
    if (params.f) {
      const quality = params.q || 85;
      
      switch (params.f) {
        case 'jpeg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png({ quality });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'avif':
          image = image.avif({ quality });
          break;
      }
    } else if (params.q) {
      // Apply quality without format change
      const metadata = await image.metadata();
      const quality = params.q;
      
      switch (metadata.format) {
        case 'jpeg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png({ quality });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
      }
    }

    return image;
  }

  /**
   * Generate cache key from path and parameters
   */
  private generateCacheKey(path: string, params: ImageParams): string {
    const ext = params.f || extname(path).slice(1) || 'jpg';
    const paramsStr = JSON.stringify(params);
    const hash = createHash('md5').update(`${path}:${paramsStr}`).digest('hex');
    return `${hash}.${ext}`;
  }

  /**
   * Get cache headers for response
   */
  getCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
      'Vary': 'Accept',
    };
  }

  /**
   * Clear cache for specific path
   */
  clearCache(path: string): number {
    let cleared = 0;
    
    // This is a simple implementation
    // In production, you'd want a more sophisticated cache management
    
    return cleared;
  }

  /**
   * Clear entire cache
   */
  clearAllCache(): void {
    // Implementation would recursively delete cache directory
    console.log('Clearing all image cache...');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    // Implementation would calculate total cache size
    return 0;
  }
}

// Export singleton instance
export const imageOptimization = new ImageOptimizationService();