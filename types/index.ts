export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  aadhaarVerified: boolean;
  upiId: string | null;
  city: string;
  platform: 'BLINKIT' | 'ZEPTO' | 'INSTAMART';
  pinCode: string;
  weeklyEarningsBand: string | null;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  riderId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  weeklyPremium: number;
  maxWeeklyPayout: number;
  zoneRiskScore: number;
  platformModifier: number;
  activatedAt: string;
  expiresAt: string;
}

export type ClaimType = 'AUTO' | 'SEMI_AUTO' | 'MANUAL';
export type TriggerType =
  | 'HEAVY_RAINFALL'
  | 'FLASH_FLOOD'
  | 'BANDH'
  | 'AQI_SPIKE'
  | 'PLATFORM_OUTAGE'
  | 'DARK_STORE_OUTAGE'
  | 'VIP_CONVOY'
  | 'RELIGIOUS_PROCESSION'
  | 'MANUAL_OTHER';

export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface Claim {
  id: string;
  riderId: string;
  policyId: string;
  claimType: ClaimType;
  triggerType: TriggerType;
  status: ClaimStatus;
  disruptionStartedAt: string;
  disruptionEndedAt: string | null;
  baselineEarnings: number;
  actualEarnings: number;
  disruptionFraction: number;
  peakCoefficient: number;
  calculatedPayout: number;
  approvedPayout: number | null;
  fraudScore: number | null;
  riderNote: string | null;
  mediaUrl: string | null;
  geolat: number;
  geolong: number;
  createdAt: string;
  updatedAt: string;
  policy?: Policy;
}

export interface Transaction {
  id: string;
  riderId: string;
  type: 'PREMIUM_DEBIT' | 'CLAIM_CREDIT' | 'WALLET_TOPUP';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  upiRef: string | null;
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  riderId: string;
  title: string;
  body: string;
  type: 'DISRUPTION_ALERT' | 'CLAIM_UPDATE' | 'PAYOUT' | 'PREMIUM';
  read: boolean;
  createdAt: string;
}

export interface EarningsLog {
  date: string;
  earnings: number;
  slot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  deliveryCount: number;
}

export interface Disruption {
  id: string;
  triggerType: string;
  title: string;
  description: string;
  severity: string;
  zone: string;
  startedAt: string;
  signals: string[];
}

export interface EarningsSummary {
  rollingWeeklyMedian: number;
  currentWeekEarnings: number;
  earningsHistory: EarningsLog[];
}

export interface EarningsBaseline {
  todayBaseline: number;
  currentSlotBaseline: number;
  currentSlot: string;
  slotBreakdown: {
    slot: string;
    avgEarnings: number;
    count: number;
  }[];
}
