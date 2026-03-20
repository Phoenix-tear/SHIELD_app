import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'shield_dev_secret_32chars_minimum_ok';

export interface AuthRequest extends Request {
  rider?: any;
}

export function validateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { riderId: string };
    prisma.rider
      .findUnique({ where: { id: decoded.riderId } })
      .then((rider) => {
        if (!rider) {
          return res.status(401).json({ error: 'Rider not found' });
        }
        req.rider = rider;
        next();
      })
      .catch(() => {
        res.status(500).json({ error: 'Auth error' });
      });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
