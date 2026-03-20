import { Router } from 'express';
import { prisma } from '../index';
import { validateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /payouts/process
router.post('/process', validateToken, async (req: AuthRequest, res) => {
  try {
    // Find all approved claims that haven't been paid yet
    const approvedClaims = await prisma.claim.findMany({
      where: {
        riderId: req.rider.id,
        status: 'APPROVED',
      },
      include: { policy: true },
    });

    if (approvedClaims.length === 0) {
      return res.json({ processed: 0, message: 'No approved claims to process' });
    }

    let processed = 0;
    for (const claim of approvedClaims) {
      const payoutAmount = claim.approvedPayout || claim.calculatedPayout;
      const upiRef = `UPI${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      await prisma.$transaction([
        prisma.claim.update({
          where: { id: claim.id },
          data: { status: 'PAID', approvedPayout: payoutAmount },
        }),
        prisma.rider.update({
          where: { id: req.rider.id },
          data: { walletBalance: { increment: payoutAmount } },
        }),
        prisma.transaction.create({
          data: {
            riderId: req.rider.id,
            type: 'CLAIM_CREDIT',
            amount: payoutAmount,
            status: 'SUCCESS',
            upiRef,
            description: `Claim Payout — ${claim.triggerType.replace(/_/g, ' ')}`,
          },
        }),
        prisma.notification.create({
          data: {
            riderId: req.rider.id,
            title: '💰 Payout Processed',
            body: `₹${payoutAmount.toLocaleString('en-IN')} has been credited to your SHIELD wallet.`,
            type: 'PAYOUT',
          },
        }),
      ]);
      processed++;
    }

    res.json({ processed, message: `${processed} claim(s) paid out` });
  } catch (err) {
    console.error('Payout process error:', err);
    res.status(500).json({ error: 'Failed to process payouts' });
  }
});

export default router;
