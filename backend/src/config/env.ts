export interface IEnvironment {
  NODE_ENV: 'development' | 'production' | 'testing';
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  CORS_ORIGIN: string;
}

const requiredEnvVars = [
  'JWT_SECRET'
];

export function validateEnvironment(): IEnvironment {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}. Using defaults for development.`);
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: parseInt(process.env.PORT || '3001'),
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432'),
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_NAME: process.env.DB_NAME || 'rentflow',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
  };
}

export const env = validateEnvironment();
