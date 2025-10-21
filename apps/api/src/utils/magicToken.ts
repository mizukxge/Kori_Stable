import { createHash, randomBytes } from 'crypto';

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex'); // 64 character hex string
}

/**
 * Hash a token using SHA256
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Hash an IP address using SHA256
 */
export function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * Hash a user agent string using SHA256
 */
export function hashUserAgent(userAgent: string): string {
  return createHash('sha256').update(userAgent).digest('hex');
}

/**
 * Verify that a token matches its hash
 */
export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

/**
 * Verify that an IP matches its hash
 */
export function verifyIP(ip: string, hash: string): boolean {
  return hashIP(ip) === hash;
}

/**
 * Verify that a user agent matches its hash
 */
export function verifyUserAgent(userAgent: string, hash: string): boolean {
  return hashUserAgent(userAgent) === hash;
}

/**
 * Get expiration time for magic link (default: 15 minutes)
 */
export function getExpirationTime(minutes: number = 15): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

/**
 * Check if a magic link has expired
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Generate a magic link URL
 */
export function generateMagicLinkURL(token: string, purpose: string, baseURL?: string): string {
  const base = baseURL || process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Different paths based on purpose
  const paths: Record<string, string> = {
    admin_login: '/auth/magic',
    client_login: '/auth/magic',
    client_portal: '/portal/auth',
  };
  
  const path = paths[purpose] || '/auth/magic';
  
  return `${base}${path}?token=${token}`;
}