/**
 * Central API configuration
 * Uses VITE_API_URL environment variable set at build time
 * Falls back to localhost for development
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('[API Config] Using API URL:', API_BASE_URL);
