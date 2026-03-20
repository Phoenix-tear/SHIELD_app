import { Router } from 'express';
import { prisma } from '../index';
import { validateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /earnings/summary
router.get('/summary', validateToken, async (req: AuthRequest, res) => {
  try {
    const riderId = req.rider.id;
    const now = new Date();

    // Current week (Mon–Sun)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const currentWeekLogs = await prisma.earningsLog.findMany({
      where: {
        riderId,
        date: { gte: weekStart },
      },
    });
    const currentWeekEarnings = currentWeekLogs.reduce((sum, l) => sum + l.earnings, 0);

    // Last 4 weeks
    const fourWeeksAgo = new Date(weekStart);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const allLogs = await prisma.earningsLog.findMany({
      where: {
        riderId,
        date: { gte: fourWeeksAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Group by week
    const weeklyTotals: number[] = [];
    for (let w = 0; w < 4; w++) {
      const wkStart = new Date(fourWeeksAgo);
      wkStart.setDate(wkStart.getDate() + w * 7);
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkEnd.getDate() + 7);

      const weekTotal = allLogs
        .filter((l) => l.date >= wkStart && l.date < wkEnd)
        .reduce((sum, l) => sum + l.earnings, 0);
      if (weekTotal > 0) weeklyTotals.push(weekTotal);
    }

    // Rolling median
    const sorted = [...weeklyTotals].sort((a, b) => a - b);
    const rollingWeeklyMedian =
      sorted.length === 0
        ? 4200 // fallback
        : sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Earnings history (grouped by day)
    const earningsHistory = allLogs.map((l) => ({
      date: l.date.toISOString().split('T')[0],
      earnings: l.earnings,
      slot: l.slot,
      deliveryCount: l.deliveryCount,
    }));

    res.json({
      rollingWeeklyMedian,
      currentWeekEarnings,
      earningsHistory,
    });
  } catch (err) {
    console.error('Earnings summary error:', err);
    res.status(500).json({ error: 'Failed to fetch earnings summary' });
  }
});

// GET /earnings/baseline
router.get('/baseline', validateToken, async (req: AuthRequest, res) => {
  try {
    const riderId = req.rider.id;
    const now = new Date();
    const hour = now.getHours();

    let currentSlot = 'MORNING';
    if (hour >= 12 && hour < 17) currentSlot = 'AFTERNOON';
    else if (hour >= 17 && hour < 21) currentSlot = 'EVENING';
    else if (hour >= 21 || hour < 6) currentSlot = 'NIGHT';

    // Get last 14 days of logs
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const logs = await prisma.earningsLog.findMany({
      where: {
        riderId,
        date: { gte: twoWeeksAgo },
      },
    });

    // Slot-wise averages
    const slotGroups: Record<string, number[]> = {
      MORNING: [],
      AFTERNOON: [],
      EVENING: [],
      NIGHT: [],
    };
    logs.forEach((l) => {
      if (slotGroups[l.slot]) {
        slotGroups[l.slot].push(l.earnings);
      }
    });

    const slotBreakdown = Object.entries(slotGroups).map(([slot, earnings]) => ({
      slot,
      avgEarnings: earnings.length > 0 ? Math.round(earnings.reduce((a, b) => a + b, 0) / earnings.length) : 175,
      count: earnings.length,
    }));

    const todayBaseline = slotBreakdown.reduce((sum, s) => sum + s.avgEarnings, 0);
    const currentSlotBaseline = slotBreakdown.find((s) => s.slot === currentSlot)?.avgEarnings || 175;

    res.json({
      todayBaseline,
      currentSlotBaseline,
      currentSlot,
      slotBreakdown,
    });
  } catch (err) {
    console.error('Earnings baseline error:', err);
    res.status(500).json({ error: 'Failed to fetch baseline' });
  }
});

export default router;
