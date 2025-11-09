/**
 * File Utilities
 * Helper functions for file operations, hashing, and metadata
 */

/**
 * Calculate SHA-256 hash of a file
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create document metadata from a File
 */
export async function createDocumentMetadata(
  name: string,
  file: File
) {
  const fileHash = await calculateFileHash(file);

  return {
    name,
    fileName: file.name,
    filePath: `/uploads/documents/${fileHash}.${getFileExtension(file.name)}`,
    fileHash,
    fileSize: file.size,
  };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File): boolean {
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  return allowedTypes.includes(file.type);
}

/**
 * Check if file size is within limits
 */
export function isFileSizeValid(file: File, maxSizeInBytes: number = 50 * 1024 * 1024): boolean {
  return file.size <= maxSizeInBytes;
}
