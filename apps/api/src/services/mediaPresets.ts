import { ImageProcessOptions } from './imageTools.js';
import { VideoProcessOptions } from './videoTools.js';

/**
 * Media Processing Preset
 */
export interface MediaPreset {
  name: string;
  description: string;
  type: 'image' | 'video' | 'both';
  image?: Partial<ImageProcessOptions>;
  video?: Partial<VideoProcessOptions>;
}

/**
 * Predefined media processing presets
 */
export const MEDIA_PRESETS: Record<string, MediaPreset> = {
  // Thumbnails
  'thumb-small': {
    name: 'Small Thumbnail',
    description: '150x150 thumbnail',
    type: 'both',
    image: {
      width: 150,
      height: 150,
      fit: 'cover',
      quality: 80,
      format: 'jpeg',
    },
    video: {
      width: 150,
      height: 150,
    },
  },
  
  'thumb-medium': {
    name: 'Medium Thumbnail',
    description: '300x300 thumbnail',
    type: 'both',
    image: {
      width: 300,
      height: 300,
      fit: 'cover',
      quality: 80,
      format: 'jpeg',
    },
    video: {
      width: 300,
      height: 300,
    },
  },

  // Image derivatives
  'web-small': {
    name: 'Small Web Image',
    description: '800px max dimension for web',
    type: 'image',
    image: {
      width: 800,
      height: 800,
      fit: 'inside',
      quality: 85,
      format: 'jpeg',
    },
  },

  'web-medium': {
    name: 'Medium Web Image',
    description: '1200px max dimension for web',
    type: 'image',
    image: {
      width: 1200,
      height: 1200,
      fit: 'inside',
      quality: 85,
      format: 'jpeg',
    },
  },

  'web-large': {
    name: 'Large Web Image',
    description: '1920px max dimension for web',
    type: 'image',
    image: {
      width: 1920,
      height: 1920,
      fit: 'inside',
      quality: 90,
      format: 'jpeg',
    },
  },

  // Modern formats
  'webp': {
    name: 'WebP Format',
    description: 'Convert to WebP format',
    type: 'image',
    image: {
      format: 'webp',
      quality: 85,
    },
  },

  'avif': {
    name: 'AVIF Format',
    description: 'Convert to AVIF format',
    type: 'image',
    image: {
      format: 'avif',
      quality: 85,
    },
  },

  // Video proxies
  'video-proxy-480p': {
    name: 'Video Proxy 480p',
    description: 'Low quality proxy for preview',
    type: 'video',
    video: {
      width: 854,
      height: 480,
      codec: 'libx264',
      bitrate: '1000k',
      fps: 30,
      format: 'mp4',
    },
  },

  'video-proxy-720p': {
    name: 'Video Proxy 720p',
    description: 'Medium quality proxy for preview',
    type: 'video',
    video: {
      width: 1280,
      height: 720,
      codec: 'libx264',
      bitrate: '2500k',
      fps: 30,
      format: 'mp4',
    },
  },

  'video-proxy-1080p': {
    name: 'Video Proxy 1080p',
    description: 'High quality proxy for preview',
    type: 'video',
    video: {
      width: 1920,
      height: 1080,
      codec: 'libx264',
      bitrate: '5000k',
      fps: 30,
      format: 'mp4',
    },
  },

  // Web-optimized video
  'video-web': {
    name: 'Web-Optimized Video',
    description: 'Optimized for web playback',
    type: 'video',
    video: {
      codec: 'libx264',
      bitrate: '3000k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      format: 'mp4',
    },
  },

  // Video preview clips
  'video-preview-10s': {
    name: 'Video Preview (10s)',
    description: '10 second preview clip',
    type: 'video',
    video: {
      duration: 10,
      codec: 'libx264',
      bitrate: '2000k',
      format: 'mp4',
    },
  },

  // Watermarked versions
  'watermarked': {
    name: 'Watermarked Image',
    description: 'Image with watermark',
    type: 'image',
    image: {
      watermark: {
        text: 'SAMPLE',
        position: 'center',
        opacity: 0.3,
      },
    },
  },

  // Optimized originals
  'optimized': {
    name: 'Optimized',
    description: 'Optimized version without quality loss',
    type: 'image',
    image: {
      quality: 90,
    },
  },
};

/**
 * Default derivative sets for different use cases
 */
export const DERIVATIVE_SETS = {
  // Standard image derivatives
  'standard-images': [
    'thumb-small',
    'thumb-medium',
    'web-small',
    'web-medium',
    'web-large',
    'webp',
  ],

  // Full image derivatives (including modern formats)
  'full-images': [
    'thumb-small',
    'thumb-medium',
    'web-small',
    'web-medium',
    'web-large',
    'webp',
    'avif',
  ],

  // Standard video derivatives
  'standard-videos': [
    'thumb-medium',
    'video-proxy-720p',
    'video-web',
  ],

  // Full video derivatives
  'full-videos': [
    'thumb-small',
    'thumb-medium',
    'video-proxy-480p',
    'video-proxy-720p',
    'video-proxy-1080p',
    'video-web',
    'video-preview-10s',
  ],

  // Client delivery (watermarked)
  'client-delivery': [
    'thumb-medium',
    'web-medium',
    'watermarked',
  ],

  // Portfolio/gallery
  'portfolio': [
    'thumb-medium',
    'web-medium',
    'web-large',
    'webp',
  ],
};

/**
 * Get preset by name
 */
export function getPreset(name: string): MediaPreset | undefined {
  return MEDIA_PRESETS[name];
}

/**
 * Get all presets for a media type
 */
export function getPresetsForType(type: 'image' | 'video'): MediaPreset[] {
  return Object.values(MEDIA_PRESETS).filter(
    preset => preset.type === type || preset.type === 'both'
  );
}

/**
 * Get derivative set
 */
export function getDerivativeSet(setName: string): string[] {
  return DERIVATIVE_SETS[setName as keyof typeof DERIVATIVE_SETS] || [];
}

/**
 * List all available presets
 */
export function listPresets(): Array<{ name: string; description: string; type: string }> {
  return Object.entries(MEDIA_PRESETS).map(([key, preset]) => ({
    name: key,
    description: preset.description,
    type: preset.type,
  }));
}

/**
 * List all derivative sets
 */
export function listDerivativeSets(): Array<{ name: string; presets: string[] }> {
  return Object.entries(DERIVATIVE_SETS).map(([name, presets]) => ({
    name,
    presets,
  }));
}