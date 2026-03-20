import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { validateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// GET /wallet
router.get('/', validateToken, async (req: AuthRequest, res) => {
  try {
    const rider = await prisma.rider.findUnique({ where: { id: req.rider.id } });
    const transactions = await prisma.transaction.findMany({
      where: { riderId: req.rider.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ balance: rider?.walletBalance ?? 0, transactions });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

const topupSchema = z.object({
  amount: z.number().min(10).max(10000),
});

// POST /wallet/topup
router.post('/topup', validateToken, validate(topupSchema), async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    const upiRef = `UPI${Date.now().toString(36).toUpperCase()}`;

    const [rider] = await prisma.$transaction([
      prisma.rider.update({
        where: { id: req.rider.id },
        data: { walletBalance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          riderId: req.rider.id,
          type: 'WALLET_TOPUP',
          amount,
          status: 'SUCCESS',
          upiRef,
          description: 'Wallet Top-up via UPI',
        },
      }),
    ]);

    res.json({ balance: rider.walletBalance, upiRef });
  } catch (err) {
    console.error('Topup error:', err);
    res.status(500).json({ error: 'Top-up failed' });
  }
});

export default router;
