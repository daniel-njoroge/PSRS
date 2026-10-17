import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeEnv = process.env.NODE_ENV || 'development';
const configuredJwtSecret = process.env.JWT_SECRET;
const jwtSecret = configuredJwtSecret || 'psrs_default_dev_secret_key_kenya_2026';
const corsOrigins = (process.env.CORS_ORIGIN || (nodeEnv === 'production' ? '' : 'http://localhost:5173'))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (nodeEnv === 'production' && (!configuredJwtSecret || configuredJwtSecret.length < 32)) {
  throw new Error('Set JWT_SECRET to a random value of at least 32 characters in production.');
}

if (nodeEnv === 'production' && corsOrigins.length === 0) {
  throw new Error('Set CORS_ORIGIN to the deployed frontend URL in production.');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret,
  jwtExpiresIn: '7d',
  nodeEnv,
  corsOrigins,
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../db/psrs.sqlite'),
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(__dirname, '../uploads'),
};
