import { prisma } from '../index';

// ─── Payout Calculation ───────────────────────────────────────────────────────
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

// ─── Fraud Detection Signals ──────────────────────────────────────────────────
export interface FraudSignal {
  rule: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  scoreImpact: number;
  triggered: boolean;
}

export interface FraudResult {
  score: number;
  verdict: 'CLEAN' | 'REVIEW' | 'REJECT';
  signals: FraudSignal[];
}

export async function computeFraudScore(
  riderId: string,
  claimAmount: number,
  triggerType: string,
  maxWeeklyPayout: number,
  geolat?: number,
  geolong?: number
): Promise<number> {
  const result = await computeFraudAnalysis(riderId, claimAmount, triggerType, maxWeeklyPayout, geolat, geolong);
  return result.score;
}

export async function computeFraudAnalysis(
  riderId: string,
  claimAmount: number,
  triggerType: string,
  maxWeeklyPayout: number,
  geolat?: number,
  geolong?: number
): Promise<FraudResult> {
  const signals: FraudSignal[] = [];
  let score = 0.05; // base trust

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ─── 1. FREQUENCY ANOMALY: Too many claims in 7 days ─────────────────────
  const recentClaimCount = await prisma.claim.count({
    where: { riderId, createdAt: { gte: sevenDaysAgo } },
  });
  const freqTriggered = recentClaimCount > 3;
  signals.push({
    rule: 'FREQUENCY_ANOMALY',
    description: `${recentClaimCount} claims in past 7 days (threshold: 3)`,
    severity: freqTriggered ? 'HIGH' : 'LOW',
    scoreImpact: freqTriggered ? 0.3 : 0,
    triggered: freqTriggered,
  });
  if (freqTriggered) score += 0.3;

  // ─── 2. AMOUNT ANOMALY: Claim near max payout ────────────────────────────
  const amountRatio = claimAmount / maxWeeklyPayout;
  const amtTriggered = amountRatio > 0.9;
  signals.push({
    rule: 'AMOUNT_ANOMALY',
    description: `Claim is ${Math.round(amountRatio * 100)}% of max weekly payout`,
    severity: amtTriggered ? 'HIGH' : 'LOW',
    scoreImpact: amtTriggered ? 0.2 : 0,
    triggered: amtTriggered,
  });
  if (amtTriggered) score += 0.2;

  // ─── 3. DUPLICATE TRIGGER: Same trigger type within the week ─────────────
  const sameTriggerCount = await prisma.claim.count({
    where: { riderId, triggerType, createdAt: { gte: sevenDaysAgo } },
  });
  const dupTriggered = sameTriggerCount >= 2;
  signals.push({
    rule: 'DUPLICATE_TRIGGER',
    description: `${sameTriggerCount} claims with "${triggerType}" trigger this week`,
    severity: dupTriggered ? 'MEDIUM' : 'LOW',
    scoreImpact: dupTriggered ? 0.2 : 0,
    triggered: dupTriggered,
  });
  if (dupTriggered) score += 0.2;

  // ─── 4. RAPID CLAIMS: Multiple claims within 24 hours ────────────────────
  const last24hClaims = await prisma.claim.count({
    where: { riderId, createdAt: { gte: twentyFourHoursAgo } },
  });
  const rapidTriggered = last24hClaims >= 2;
  signals.push({
    rule: 'RAPID_CLAIMS',
    description: `${last24hClaims} claims in past 24 hours`,
    severity: rapidTriggered ? 'HIGH' : 'LOW',
    scoreImpact: rapidTriggered ? 0.25 : 0,
    triggered: rapidTriggered,
  });
  if (rapidTriggered) score += 0.25;

  // ─── 5. LOCATION VALIDATION: Check GPS is within known operating zones ───
  if (geolat !== undefined && geolong !== undefined) {
    // Kattankulathur operational bounding box
    const inBounds =
      geolat >= 12.65 && geolat <= 12.95 &&
      geolong >= 79.90 && geolong <= 80.15;
    const locTriggered = !inBounds;
    signals.push({
      rule: 'LOCATION_VALIDATION',
      description: locTriggered
        ? `GPS (${geolat.toFixed(4)}, ${geolong.toFixed(4)}) outside operational zone`
        : `GPS verified within Kattankulathur corridor`,
      severity: locTriggered ? 'HIGH' : 'LOW',
      scoreImpact: locTriggered ? 0.35 : -0.05,
      triggered: locTriggered,
    });
    if (locTriggered) score += 0.35;
    else score -= 0.05;
  } else {
    signals.push({
      rule: 'LOCATION_VALIDATION',
      description: 'No GPS coordinates provided — cannot validate location',
      severity: 'MEDIUM',
      scoreImpact: 0.1,
      triggered: true,
    });
    score += 0.1;
  }

  // ─── 6. ACTIVITY VALIDATION: Check rider has recent trip history ─────────
  // A legitimate rider should have recent tracking data (wallet transactions as proxy)
  const recentTxns = await prisma.transaction.count({
    where: { riderId, createdAt: { gte: sevenDaysAgo } },
  });
  const inactiveTriggered = recentTxns === 0;
  signals.push({
    rule: 'ACTIVITY_VALIDATION',
    description: inactiveTriggered
      ? 'No wallet activity in past 7 days — possibly inactive rider'
      : `${recentTxns} transactions in past 7 days — active rider`,
    severity: inactiveTriggered ? 'MEDIUM' : 'LOW',
    scoreImpact: inactiveTriggered ? 0.15 : -0.05,
    triggered: inactiveTriggered,
  });
  if (inactiveTriggered) score += 0.15;
  else score -= 0.05;

  // ─── 7. NEW RIDER BONUS: First-time claimers get benefit of doubt ────────
  const totalClaims = await prisma.claim.count({ where: { riderId } });
  const isNew = totalClaims === 0;
  signals.push({
    rule: 'NEW_RIDER_TRUST',
    description: isNew ? 'First-time claim — trust bonus applied' : `${totalClaims} prior claims`,
    severity: 'LOW',
    scoreImpact: isNew ? -0.1 : 0,
    triggered: isNew,
  });
  if (isNew) score -= 0.1;

  // Clamp
  score = Math.max(0, Math.min(1, score));

  // Verdict
  let verdict: 'CLEAN' | 'REVIEW' | 'REJECT' = 'CLEAN';
  if (score > 0.9) verdict = 'REJECT';
  else if (score > 0.7) verdict = 'REVIEW';

  return { score, verdict, signals };
}
