import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env file from apps/api
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
// Zod schema for environment variables
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: z.string().default('3001').transform(Number),
    API_HOST: z.string().default('0.0.0.0'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    // Session/Cookie configuration
    SESSION_COOKIE_SECURE: z.string().optional().transform(v => v === 'true'),
    SESSION_COOKIE_SAMESITE: z.enum(['Strict', 'Lax', 'None']).optional().default('Lax'),
    // Database
    DATABASE_URL: z.string(),
    // Secrets (will be masked in logs)
    SESSION_SECRET: z.string().min(32),
    JWT_SECRET: z.string().min(32).optional(),
    API_KEY: z.string().optional(),
});
// Parse and validate
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(result.error.format());
        process.exit(1);
    }
    return result.data;
};
export const env = parseEnv();
// Mask sensitive values for logging
const maskSecret = (value) => {
    if (!value)
        return '<not set>';
    if (value.length <= 8)
        return '***';
    return value.slice(0, 4) + '***' + value.slice(-4);
};
export const printConfig = () => {
    console.log('📋 Configuration loaded:');
    console.log('  NODE_ENV:', env.NODE_ENV);
    console.log('  API_PORT:', env.API_PORT);
    console.log('  API_HOST:', env.API_HOST);
    console.log('  CORS_ORIGIN:', env.CORS_ORIGIN);
    console.log('  LOG_LEVEL:', env.LOG_LEVEL);
    console.log('  SESSION_COOKIE_SECURE:', env.SESSION_COOKIE_SECURE);
    console.log('  SESSION_COOKIE_SAMESITE:', env.SESSION_COOKIE_SAMESITE);
    console.log('  DATABASE_URL:', maskSecret(env.DATABASE_URL));
    console.log('  SESSION_SECRET:', maskSecret(env.SESSION_SECRET));
    console.log('  JWT_SECRET:', maskSecret(env.JWT_SECRET));
    console.log('  API_KEY:', maskSecret(env.API_KEY));
};
// Auto-run if executed directly
printConfig();
