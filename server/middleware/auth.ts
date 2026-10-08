import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { db, User } from '../db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'employee' | 'admin';
    department: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. Token missing.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Authentication required. Token missing.' });
      return;
    }

    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
      id: string;
      email: string;
      role: 'employee' | 'admin';
    };

    const user = db.collection('users').findOne(u => u.id === decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found or account deactivated.' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired or invalid authorization token.' });
  }
}

export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden. Administrative access required.' });
    return;
  }
  next();
}
