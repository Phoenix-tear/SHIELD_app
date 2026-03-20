import { Router } from 'express';
import { prisma } from '../index';
import { validateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /policy/active
router.get('/active', validateToken, async (req: AuthRequest, res) => {
  try {
    const policy = await prisma.policy.findFirst({
      where: { riderId: req.rider.id, status: 'ACTIVE' },
      orderBy: { activatedAt: 'desc' },
    });
    if (!policy) {
      return res.json({ policy: null });
    }
    res.json({ policy });
  } catch (err) {
    console.error('Policy fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// POST /policy/activate
router.post('/activate', validateToken, async (req: AuthRequest, res) => {
  try {
    const rider = req.rider;

    // Check if active policy already exists
    const existing = await prisma.policy.findFirst({
      where: { riderId: rider.id, status: 'ACTIVE' },
    });
    if (existing) {
      return res.status(400).json({ error: 'Active policy already exists' });
    }

    const weeklyPremium = 49.0;
    if (rider.walletBalance < weeklyPremium) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [policy] = await prisma.$transaction([
      prisma.policy.create({
        data: {
          riderId: rider.id,
          status: 'ACTIVE',
          weeklyPremium,
          maxWeeklyPayout: 4500.0,
          zoneRiskScore: 1.2,
          platformModifier: rider.platform === 'BLINKIT' ? 1.0 : rider.platform === 'ZEPTO' ? 1.05 : 0.95,
          activatedAt: now,
          expiresAt,
        },
      }),
      prisma.rider.update({
        where: { id: rider.id },
        data: { walletBalance: { decrement: weeklyPremium } },
      }),
      prisma.transaction.create({
        data: {
          riderId: rider.id,
          type: 'PREMIUM_DEBIT',
          amount: -weeklyPremium,
          status: 'SUCCESS',
          upiRef: `UPI${Date.now().toString(36).toUpperCase()}`,
          description: 'Weekly Premium — SHIELD',
        },
      }),
    ]);

    res.status(201).json({ policy });
  } catch (err) {
    console.error('Policy activate error:', err);
    res.status(500).json({ error: 'Failed to activate policy' });
  }
});

// GET /policy/history
router.get('/history', validateToken, async (req: AuthRequest, res) => {
  try {
    const policies = await prisma.policy.findMany({
      where: { riderId: req.rider.id },
      orderBy: { activatedAt: 'desc' },
    });
    res.json({ policies });
  } catch (err) {
    console.error('Policy history error:', err);
    res.status(500).json({ error: 'Failed to fetch policy history' });
  }
});

export default router;
