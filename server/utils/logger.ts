import { db } from '../db.js';
import crypto from 'crypto';

/**
 * Logs a user or system action in the database log collection
 */
export function logActivity(
  userId: string,
  userEmail: string,
  action: string,
  details: string,
  ipAddress?: string
) {
  try {
    const logEntry = {
      id: 'log_' + crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      action,
      details,
      ipAddress: ipAddress || '127.0.0.1',
    };
    db.collection('logs').insertOne(logEntry);
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
