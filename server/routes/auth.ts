import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { validate } from '../middleware/validate';
import { validateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shield_dev_secret_32chars_minimum_ok';

const loginSchema = z.object({
  phone: z.string().min(10).max(10),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(10),
  password: z.string().min(6),
  city: z.string().min(1),
  platform: z.enum(['BLINKIT', 'ZEPTO', 'INSTAMART']),
  pinCode: z.string().min(6).max(6),
  upiId: z.string().optional(),
  weeklyEarningsBand: z.string().optional(),
  aadhaarVerified: z.boolean().optional(),
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { phone, password } = req.body;
    const rider = await prisma.rider.findUnique({ where: { phone } });
    if (!rider) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }
    const valid = await bcrypt.compare(password, rider.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }
    const token = jwt.sign({ riderId: rider.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash, ...profile } = rider;
    res.json({ token, rider: profile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, phone, password, city, platform, pinCode, upiId, weeklyEarningsBand, aadhaarVerified } = req.body;
    const existing = await prisma.rider.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const rider = await prisma.rider.create({
      data: {
        name,
        phone,
        passwordHash,
        city,
        platform,
        pinCode,
        upiId: upiId || null,
        weeklyEarningsBand: weeklyEarningsBand || null,
        aadhaarVerified: aadhaarVerified || false,
        walletBalance: 200.0,
      },
    });
    const token = jwt.sign({ riderId: rider.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...profile } = rider;
    res.status(201).json({ token, rider: profile });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /auth/me
router.get('/me', validateToken, (req: AuthRequest, res) => {
  const { passwordHash, ...profile } = req.rider;
  res.json({ rider: profile });
});

export default router;
