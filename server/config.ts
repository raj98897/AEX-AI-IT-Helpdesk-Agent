import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'aex-enterprise-super-secret-key-2026',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DB_FILE: path.resolve(process.cwd(), 'server/db.json'),
  BCRYPT_SALT_ROUNDS: 10,
};
