import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { CONFIG } from '../config.js';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new employee/admin
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !department) {
      res.status(400).json({ message: 'All fields (name, email, password, department) are required.' });
      return;
    }

    // Check if user already exists
    const existingUser = db.collection('users').findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered. Please sign in.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(CONFIG.BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const newUser = {
      id: 'user_' + crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'employee', // Safely assign role
      department,
      createdAt: new Date().toISOString(),
    };

    db.collection('users').insertOne(newUser);

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log Activity
    logActivity(
      newUser.id,
      newUser.email,
      'User Registered',
      `New account created with role: ${newUser.role} in ${newUser.department} department.`
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Registration failed due to a server error.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    // Find User
    const user = db.collection('users').findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(400).json({ message: 'Invalid authentication credentials.' });
      return;
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid authentication credentials.' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log Activity
    logActivity(user.id, user.email, 'User Login', `Employee successfully logged into the system.`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Login failed due to a server error.' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized access.' });
    return;
  }
  res.json({ user: req.user });
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const { name, department, currentPassword, newPassword } = req.body;
    const user = db.collection('users').findOne(u => u.id === req.user!.id);
    
    if (!user) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (department) updateFields.department = department;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Current password is required to change password.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ message: 'Incorrect current password.' });
        return;
      }

      const salt = await bcrypt.genSalt(CONFIG.BCRYPT_SALT_ROUNDS);
      updateFields.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    db.collection('users').updateOne(u => u.id === user.id, updateFields);

    logActivity(user.id, user.email, 'Profile Updated', 'Employee updated their profile details.');

    const updatedUser = db.collection('users').findOne(u => u.id === user.id)!;

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
      },
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// @route   GET /api/auth/users
// @desc    List all registered employees (Admin Only)
router.get('/users', authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  const users = db.collection('users').find();
  const safeUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    createdAt: u.createdAt,
  }));
  res.json({ users: safeUsers });
});

export default router;
