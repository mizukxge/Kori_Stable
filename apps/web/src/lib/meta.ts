// Metadata utilities for EXIF and IPTC data

export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  dateTaken?: string;
  dimensions?: string;
}

export interface IptcData {
  title?: string;
  description?: string;
  keywords?: string[];
  creator?: string;
  copyright?: string;
  credit?: string;
  source?: string;
}

export interface AssetMetadata {
  exif?: ExifData;
  iptc?: IptcData;
}

/**
 * Parse EXIF data from asset metadata
 */
export function parseExif(metadata: any): ExifData {
  // TODO: Implement actual EXIF parsing from API
  return {
    camera: metadata?.camera || 'Unknown Camera',
    lens: metadata?.lens || 'Unknown Lens',
    focalLength: metadata?.focalLength || 'N/A',
    aperture: metadata?.aperture || 'N/A',
    shutterSpeed: metadata?.shutterSpeed || 'N/A',
    iso: metadata?.iso || 'N/A',
    dateTaken: metadata?.dateTaken || 'N/A',
    dimensions: metadata?.dimensions || 'N/A',
  };
}

/**
 * Parse IPTC data from asset metadata
 */
export function parseIptc(metadata: any): IptcData {
  // TODO: Implement actual IPTC parsing from API
  return {
    title: metadata?.title || '',
    description: metadata?.description || '',
    keywords: metadata?.keywords || [],
    creator: metadata?.creator || '',
    copyright: metadata?.copyright || '',
    credit: metadata?.credit || '',
    source: metadata?.source || '',
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}