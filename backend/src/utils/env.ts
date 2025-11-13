/**
 * Environment variable validation
 * Ensures all required environment variables are set before the app starts
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
] as const;

const optionalEnvVars = {
  PORT: '3001',
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_EXPIRES_IN: '7d',
} as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // Set defaults for optional variables
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  // Validate JWT secrets are strong enough
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.ADMIN_JWT_SECRET!.length < 32) {
    throw new Error('ADMIN_JWT_SECRET must be at least 32 characters long');
  }
}

