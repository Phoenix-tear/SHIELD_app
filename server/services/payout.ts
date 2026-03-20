import { prisma } from '../index';

export function calculatePayout(
  baselineEarnings: number,
  disruptionFraction: number,
  peakCoefficient: number,
  actualEarnings: number,
  maxWeeklyPayout: number
): number {
  const payout = baselineEarnings * disruptionFraction * peakCoefficient;
  const actualGap = payout - actualEarnings;
  const result = Math.max(0, actualGap);
  return Math.min(result, maxWeeklyPayout);
}

export async function computeFraudScore(riderId: string, claimAmount: number, triggerType: string, maxWeeklyPayout: number): Promise<number> {
  let score = 0.1; // default

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Claim count in last 7 days > 3 → +0.3
  const recentClaimCount = await prisma.claim.count({
    where: {
      riderId,
      createdAt: { gte: sevenDaysAgo },
    },
  });
  if (recentClaimCount > 3) score += 0.3;

  // Claim amount > 90% of weeklyMax → +0.2
  if (claimAmount > 0.9 * maxWeeklyPayout) score += 0.2;

  // 2+ claims on same trigger type this week → +0.2
  const sameTriggerCount = await prisma.claim.count({
    where: {
      riderId,
      triggerType,
      createdAt: { gte: sevenDaysAgo },
    },
  });
  if (sameTriggerCount >= 2) score += 0.2;

  // First claim ever (new rider) → -0.1
  const totalClaims = await prisma.claim.count({ where: { riderId } });
  if (totalClaims === 0) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}
