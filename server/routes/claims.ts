import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { validateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { calculatePayout, computeFraudScore } from '../services/payout';

const router = Router();

// GET /claims — all claims for rider
router.get('/', validateToken, async (req: AuthRequest, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: any = { riderId: req.rider.id };
    if (status && status !== 'all') {
      where.status = (status as string).toUpperCase();
    }
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.claim.count({ where }),
    ]);
    res.json({ claims, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error('Claims list error:', err);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// GET /claims/:id — single claim detail
router.get('/:id', validateToken, async (req: AuthRequest, res) => {
  try {
    const claim = await prisma.claim.findFirst({
      where: { id: req.params.id as string, riderId: req.rider.id },
      include: { policy: true },
    });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json({ claim });
  } catch (err) {
    console.error('Claim detail error:', err);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

const autoClaimSchema = z.object({
  triggerType: z.string(),
  geolat: z.number(),
  geolong: z.number(),
  disruptionStartedAt: z.string(),
});

// POST /claims/auto — auto-trigger claim
router.post('/auto', validateToken, validate(autoClaimSchema), async (req: AuthRequest, res) => {
  try {
    const { triggerType, geolat, geolong, disruptionStartedAt } = req.body;
    const rider = req.rider;

    const policy = await prisma.policy.findFirst({
      where: { riderId: rider.id, status: 'ACTIVE' },
    });
    if (!policy) {
      return res.status(400).json({ error: 'No active policy' });
    }

    const baselineEarnings = 700;
    const actualEarnings = 0;
    const disruptionFraction = 0.9;
    const peakCoefficient = 0.95;

    const calculatedPayout = calculatePayout(baselineEarnings, disruptionFraction, peakCoefficient, actualEarnings, policy.maxWeeklyPayout);
    const fraudScore = await computeFraudScore(rider.id, calculatedPayout, triggerType, policy.maxWeeklyPayout);

    let status = 'APPROVED';
    if (fraudScore > 0.9) status = 'REJECTED';
    else if (fraudScore > 0.7) status = 'UNDER_REVIEW';

    const claim = await prisma.claim.create({
      data: {
        riderId: rider.id,
        policyId: policy.id,
        claimType: 'AUTO',
        triggerType,
        status,
        disruptionStartedAt: new Date(disruptionStartedAt),
        baselineEarnings,
        actualEarnings,
        disruptionFraction,
        peakCoefficient,
        calculatedPayout,
        approvedPayout: status === 'APPROVED' ? calculatedPayout : null,
        fraudScore,
        geolat,
        geolong,
      },
    });

    res.status(201).json({ claim });
  } catch (err) {
    console.error('Auto claim error:', err);
    res.status(500).json({ error: 'Failed to create auto claim' });
  }
});

const semiAutoSchema = z.object({
  triggerType: z.string(),
  geolat: z.number(),
  geolong: z.number(),
  riderConfirmed: z.boolean(),
});

// POST /claims/semi-auto
router.post('/semi-auto', validateToken, validate(semiAutoSchema), async (req: AuthRequest, res) => {
  try {
    const { triggerType, geolat, geolong } = req.body;
    const rider = req.rider;

    const policy = await prisma.policy.findFirst({
      where: { riderId: rider.id, status: 'ACTIVE' },
    });
    if (!policy) {
      return res.status(400).json({ error: 'No active policy' });
    }

    const baselineEarnings = 650;
    const actualEarnings = 120;
    const disruptionFraction = 0.72;
    const peakCoefficient = 1.0;

    const calculatedPayout = calculatePayout(baselineEarnings, disruptionFraction, peakCoefficient, actualEarnings, policy.maxWeeklyPayout);
    const fraudScore = await computeFraudScore(rider.id, calculatedPayout, triggerType, policy.maxWeeklyPayout);

    let status = 'APPROVED';
    if (fraudScore > 0.9) status = 'REJECTED';
    else if (fraudScore > 0.7) status = 'UNDER_REVIEW';

    const claim = await prisma.claim.create({
      data: {
        riderId: rider.id,
        policyId: policy.id,
        claimType: 'SEMI_AUTO',
        triggerType,
        status,
        disruptionStartedAt: new Date(),
        baselineEarnings,
        actualEarnings,
        disruptionFraction,
        peakCoefficient,
        calculatedPayout,
        approvedPayout: status === 'APPROVED' ? calculatedPayout : null,
        fraudScore,
        geolat,
        geolong,
      },
    });

    res.status(201).json({ claim });
  } catch (err) {
    console.error('Semi-auto claim error:', err);
    res.status(500).json({ error: 'Failed to create semi-auto claim' });
  }
});

const manualClaimSchema = z.object({
  triggerType: z.string(),
  riderNote: z.string().optional(),
  geolat: z.number(),
  geolong: z.number(),
  mediaUrl: z.string().optional(),
});

// POST /claims/manual
router.post('/manual', validateToken, validate(manualClaimSchema), async (req: AuthRequest, res) => {
  try {
    const { triggerType, riderNote, geolat, geolong, mediaUrl } = req.body;
    const rider = req.rider;

    const policy = await prisma.policy.findFirst({
      where: { riderId: rider.id, status: 'ACTIVE' },
    });
    if (!policy) {
      return res.status(400).json({ error: 'No active policy' });
    }

    const baselineEarnings = 500;
    const actualEarnings = 50;
    const disruptionFraction = 0.9;
    const peakCoefficient = 1.0;

    const calculatedPayout = calculatePayout(baselineEarnings, disruptionFraction, peakCoefficient, actualEarnings, policy.maxWeeklyPayout);
    const fraudScore = await computeFraudScore(rider.id, calculatedPayout, triggerType, policy.maxWeeklyPayout);

    let status = 'PENDING';
    if (fraudScore > 0.9) status = 'REJECTED';
    else if (fraudScore > 0.7) status = 'UNDER_REVIEW';

    const claim = await prisma.claim.create({
      data: {
        riderId: rider.id,
        policyId: policy.id,
        claimType: 'MANUAL',
        triggerType,
        status,
        disruptionStartedAt: new Date(),
        baselineEarnings,
        actualEarnings,
        disruptionFraction,
        peakCoefficient,
        calculatedPayout,
        fraudScore,
        riderNote: riderNote || null,
        mediaUrl: mediaUrl || null,
        geolat,
        geolong,
      },
    });

    res.status(201).json({ claim });
  } catch (err) {
    console.error('Manual claim error:', err);
    res.status(500).json({ error: 'Failed to create manual claim' });
  }
});

// PUT /claims/:id/confirm
router.put('/:id/confirm', validateToken, async (req: AuthRequest, res) => {
  try {
    const claim = await prisma.claim.findFirst({
      where: { id: req.params.id as string, riderId: req.rider.id },
    });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: { status: 'APPROVED', approvedPayout: claim.calculatedPayout },
    });
    res.json({ claim: updated });
  } catch (err) {
    console.error('Claim confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm claim' });
  }
});

export default router;
