import { createHmac } from 'crypto';

// Allowed image transformation parameters
const ALLOWED_PARAMS = [
  'w', // width
  'h', // height
  'fit', // fit mode: cover, contain, fill, inside, outside
  'q', // quality (1-100)
  'f', // format: jpeg, png, webp, avif
  'dpr', // device pixel ratio (1, 2, 3)
  'crop', // crop mode: entropy, attention, auto
  'blur', // blur radius (0.3-1000)
  'sharpen', // sharpen amount (0-10)
  'grayscale', // convert to grayscale (true/false)
  'rotate', // rotation angle (0, 90, 180, 270)
  'flip', // flip: h (horizontal), v (vertical)
  'bg', // background color (hex without #)
] as const;

// Allowed fit modes
const ALLOWED_FIT_MODES = ['cover', 'contain', 'fill', 'inside', 'outside'] as const;

// Allowed formats
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'avif'] as const;

// Image transformation parameters
export interface ImageParams {
  w?: number; // width
  h?: number; // height
  fit?: typeof ALLOWED_FIT_MODES[number];
  q?: number; // quality
  f?: typeof ALLOWED_FORMATS[number]; // format
  dpr?: 1 | 2 | 3;
  crop?: 'entropy' | 'attention' | 'auto';
  blur?: number;
  sharpen?: number;
  grayscale?: boolean;
  rotate?: 0 | 90 | 180 | 270;
  flip?: 'h' | 'v';
  bg?: string; // hex color without #
}

/**
 * Image URL Signer
 * Generates and verifies signed URLs for image transformations
 */
export class ImageURLSigner {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.IMAGE_SIGN_SECRET || 'default-secret-change-me';
    
    if (!secret && this.secret === 'default-secret-change-me') {
      console.warn('⚠️  Using default IMAGE_SIGN_SECRET. Set in production!');
    }
  }

  /**
   * Generate signature for image URL with parameters
   */
  generateSignature(path: string, params: ImageParams): string {
    // Sort and serialize parameters
    const sortedParams = this.serializeParams(params);
    
    // Create signature payload: path + sorted params
    const payload = `${path}?${sortedParams}`;
    
    // Generate HMAC SHA256 signature
    const hmac = createHmac('sha256', this.secret);
    hmac.update(payload);
    
    return hmac.digest('base64url'); // URL-safe base64
  }

  /**
   * Verify signature for image URL
   */
  verifySignature(path: string, params: ImageParams, signature: string): boolean {
    const expectedSignature = this.generateSignature(path, params);
    
    // Constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(signature, expectedSignature);
  }

  /**
   * Generate signed image URL
   */
  generateSignedURL(path: string, params: ImageParams, baseURL?: string): string {
    // Validate and sanitize parameters
    const validParams = this.validateParams(params);
    
    // Generate signature
    const signature = this.generateSignature(path, validParams);
    
    // Build query string
    const queryParams = new URLSearchParams();
    
    // Add transformation parameters
    Object.entries(validParams).forEach(([key, value]) => {
      queryParams.set(key, String(value));
    });
    
    // Add signature
    queryParams.set('s', signature);
    
    // Build full URL
    const base = baseURL || process.env.CDN_URL || '';
    const query = queryParams.toString();
    
    return `${base}${path}?${query}`;
  }

  /**
   * Parse and verify signed URL
   */
  parseSignedURL(url: string): { path: string; params: ImageParams; valid: boolean } | null {
    try {
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;
      
      // Extract signature
      const signature = searchParams.get('s');
      if (!signature) {
        return null;
      }
      
      // Extract parameters
      const params: any = {};

      ALLOWED_PARAMS.forEach((param) => {
        const value = searchParams.get(param);
        if (value !== null) {
          // Type coercion based on parameter
          switch (param) {
            case 'w':
            case 'h':
            case 'q':
            case 'blur':
            case 'sharpen':
            case 'dpr':
            case 'rotate':
              params[param] = parseInt(value, 10);
              break;
            case 'grayscale':
              params[param] = value === 'true';
              break;
            default:
              params[param] = value;
          }
        }
      });
      
      // Verify signature
      const path = urlObj.pathname;
      const valid = this.verifySignature(path, params, signature);
      
      return { path, params, valid };
    } catch (error) {
      console.error('Error parsing signed URL:', error);
      return null;
    }
  }

  /**
   * Validate and sanitize parameters
   */
  private validateParams(params: ImageParams): ImageParams {
    const validated: ImageParams = {};
    
    // Width
    if (params.w !== undefined) {
      validated.w = Math.max(1, Math.min(5000, Math.floor(params.w)));
    }
    
    // Height
    if (params.h !== undefined) {
      validated.h = Math.max(1, Math.min(5000, Math.floor(params.h)));
    }
    
    // Fit mode
    if (params.fit && ALLOWED_FIT_MODES.includes(params.fit)) {
      validated.fit = params.fit;
    }
    
    // Quality
    if (params.q !== undefined) {
      validated.q = Math.max(1, Math.min(100, Math.floor(params.q)));
    }
    
    // Format
    if (params.f && ALLOWED_FORMATS.includes(params.f)) {
      validated.f = params.f;
    }
    
    // DPR
    if (params.dpr && [1, 2, 3].includes(params.dpr)) {
      validated.dpr = params.dpr;
    }
    
    // Crop mode
    if (params.crop && ['entropy', 'attention', 'auto'].includes(params.crop)) {
      validated.crop = params.crop;
    }
    
    // Blur
    if (params.blur !== undefined) {
      validated.blur = Math.max(0.3, Math.min(1000, params.blur));
    }
    
    // Sharpen
    if (params.sharpen !== undefined) {
      validated.sharpen = Math.max(0, Math.min(10, params.sharpen));
    }
    
    // Grayscale
    if (params.grayscale !== undefined) {
      validated.grayscale = Boolean(params.grayscale);
    }
    
    // Rotate
    if (params.rotate !== undefined && [0, 90, 180, 270].includes(params.rotate)) {
      validated.rotate = params.rotate;
    }
    
    // Flip
    if (params.flip && ['h', 'v'].includes(params.flip)) {
      validated.flip = params.flip;
    }
    
    // Background color
    if (params.bg) {
      // Validate hex color (without #)
      if (/^[0-9A-Fa-f]{6}$/.test(params.bg)) {
        validated.bg = params.bg.toLowerCase();
      }
    }
    
    return validated;
  }

  /**
   * Serialize parameters in sorted order
   */
  private serializeParams(params: ImageParams): string {
    const entries = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b));
    
    return entries.map(([key, value]) => `${key}=${value}`).join('&');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

// Export singleton instance
export const imageSigner = new ImageURLSigner();

/**
 * Helper functions for common use cases
 */

// Generate thumbnail URL
export function generateThumbnailURL(path: string, size: number = 150): string {
  return imageSigner.generateSignedURL(path, {
    w: size,
    h: size,
    fit: 'cover',
    q: 80,
  });
}

// Generate responsive image URL
export function generateResponsiveURL(path: string, width: number, dpr: 1 | 2 | 3 = 1): string {
  return imageSigner.generateSignedURL(path, {
    w: width,
    dpr,
    q: 85,
    f: 'webp',
  });
}

// Generate optimized URL
export function generateOptimizedURL(path: string, maxWidth: number = 1920): string {
  return imageSigner.generateSignedURL(path, {
    w: maxWidth,
    fit: 'inside',
    q: 85,
    f: 'webp',
  });
}

// Verify request signature
export function verifyRequestSignature(path: string, query: Record<string, any>): boolean {
  const signature = query.s;
  if (!signature) {
    return false;
  }
  
  // Extract params (exclude signature)
  const params: any = {};
  ALLOWED_PARAMS.forEach((param) => {
    if (query[param] !== undefined) {
      params[param] = query[param];
    }
  });
  
  return imageSigner.verifySignature(path, params, signature);
}