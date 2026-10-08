import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/logs
// @desc    Get all system activity logs (Admin Only)
router.get('/', authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.collection('logs').find();
    
    // Sort logs: newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({ logs });
  } catch (error) {
    console.error('Fetch logs failed:', error);
    res.status(500).json({ message: 'Error retrieving system audit logs.' });
  }
});

export default router;
