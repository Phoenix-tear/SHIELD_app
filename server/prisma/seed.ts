import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SHIELD database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.earningsLog.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.rider.deleteMany();

  // Create demo rider
  const passwordHash = await bcrypt.hash('shield123', 10);
  const rider = await prisma.rider.create({
    data: {
      name: 'Rajan Kumar',
      phone: '9876543210',
      email: 'rajan@shield.app',
      passwordHash,
      aadhaarVerified: true,
      upiId: 'rajan@upi',
      city: 'Bengaluru',
      platform: 'BLINKIT',
      pinCode: '560001',
      weeklyEarningsBand: '₹3,000–₹5,000',
      walletBalance: 342.50,
    },
  });
  console.log(`✅ Created rider: ${rider.name} (${rider.phone})`);

  // Create active policy
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const policy = await prisma.policy.create({
    data: {
      riderId: rider.id,
      status: 'ACTIVE',
      weeklyPremium: 49.0,
      maxWeeklyPayout: 4500.0,
      zoneRiskScore: 1.2,
      platformModifier: 1.0,
      activatedAt: now,
      expiresAt,
    },
  });
  console.log(`✅ Created active policy: ${policy.id}`);

  // Create 6 EarningsLog entries (last 6 days)
  const slots = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  const earningsData = [
    { daysAgo: 6, earnings: 420, deliveries: 8, slot: 'MORNING' },
    { daysAgo: 5, earnings: 680, deliveries: 14, slot: 'EVENING' },
    { daysAgo: 4, earnings: 550, deliveries: 11, slot: 'AFTERNOON' },
    { daysAgo: 3, earnings: 750, deliveries: 16, slot: 'EVENING' },
    { daysAgo: 2, earnings: 490, deliveries: 10, slot: 'NIGHT' },
    { daysAgo: 1, earnings: 610, deliveries: 13, slot: 'MORNING' },
  ];

  for (const entry of earningsData) {
    const date = new Date(now);
    date.setDate(date.getDate() - entry.daysAgo);
    date.setHours(0, 0, 0, 0);
    await prisma.earningsLog.create({
      data: {
        riderId: rider.id,
        date,
        slot: entry.slot,
        earnings: entry.earnings,
        deliveryCount: entry.deliveries,
      },
    });
  }
  console.log('✅ Created 6 earnings log entries');

  // Create 4 Claims
  const claims = [
    {
      claimType: 'AUTO',
      triggerType: 'HEAVY_RAINFALL',
      status: 'PAID',
      disruptionStartedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      disruptionEndedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      baselineEarnings: 700,
      actualEarnings: 0,
      disruptionFraction: 0.9,
      peakCoefficient: 0.95,
      calculatedPayout: 598.5,
      approvedPayout: 598.5,
      fraudScore: 0.1,
      geolat: 12.9716,
      geolong: 77.5946,
    },
    {
      claimType: 'SEMI_AUTO',
      triggerType: 'VIP_CONVOY',
      status: 'APPROVED',
      disruptionStartedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      disruptionEndedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      baselineEarnings: 650,
      actualEarnings: 180,
      disruptionFraction: 0.72,
      peakCoefficient: 1.0,
      calculatedPayout: 288.0,
      approvedPayout: 288.0,
      fraudScore: 0.15,
      geolat: 12.9352,
      geolong: 77.6245,
    },
    {
      claimType: 'AUTO',
      triggerType: 'AQI_SPIKE',
      status: 'UNDER_REVIEW',
      disruptionStartedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      baselineEarnings: 600,
      actualEarnings: 120,
      disruptionFraction: 0.8,
      peakCoefficient: 0.9,
      calculatedPayout: 312.0,
      fraudScore: 0.75,
      geolat: 12.9716,
      geolong: 77.5946,
    },
    {
      claimType: 'MANUAL',
      triggerType: 'DARK_STORE_OUTAGE',
      status: 'PENDING',
      disruptionStartedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      baselineEarnings: 500,
      actualEarnings: 50,
      disruptionFraction: 0.9,
      peakCoefficient: 1.0,
      calculatedPayout: 400.0,
      fraudScore: 0.2,
      riderNote: 'Dark store at Koramangala was fully shut down, no orders coming through',
      geolat: 12.9352,
      geolong: 77.6245,
    },
  ];

  for (const claim of claims) {
    await prisma.claim.create({
      data: {
        riderId: rider.id,
        policyId: policy.id,
        ...claim,
      },
    });
  }
  console.log('✅ Created 4 claims');

  // Create 6 Transactions
  const transactions = [
    {
      type: 'PREMIUM_DEBIT',
      amount: -49.0,
      status: 'SUCCESS',
      upiRef: 'UPI2603XK9281',
      description: 'Weekly Premium — SHIELD',
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'CLAIM_CREDIT',
      amount: 598.5,
      status: 'SUCCESS',
      upiRef: 'UPI2603PY7341',
      description: 'Claim Payout — Heavy Rainfall',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'PREMIUM_DEBIT',
      amount: -49.0,
      status: 'SUCCESS',
      upiRef: 'UPI2603QL8420',
      description: 'Weekly Premium — SHIELD',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'CLAIM_CREDIT',
      amount: 288.0,
      status: 'SUCCESS',
      upiRef: 'UPI2603RT5122',
      description: 'Claim Payout — VIP Convoy',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'WALLET_TOPUP',
      amount: 200.0,
      status: 'SUCCESS',
      upiRef: 'UPI2603WA2938',
      description: 'Wallet Top-up via UPI',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'PREMIUM_DEBIT',
      amount: -49.0,
      status: 'SUCCESS',
      upiRef: 'UPI2603MN4510',
      description: 'Weekly Premium — SHIELD',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        riderId: rider.id,
        ...tx,
      },
    });
  }
  console.log('✅ Created 6 transactions');

  // Create 3 Notifications (1 unread)
  await prisma.notification.create({
    data: {
      riderId: rider.id,
      title: '🌧️ Heavy Rainfall Alert',
      body: 'Heavy rainfall detected in your zone (560001). Your earnings are protected under SHIELD.',
      type: 'DISRUPTION_ALERT',
      read: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  });
  await prisma.notification.create({
    data: {
      riderId: rider.id,
      title: '💰 Payout Processed',
      body: '₹598.50 has been credited to your SHIELD wallet for your Heavy Rainfall claim.',
      type: 'PAYOUT',
      read: true,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.notification.create({
    data: {
      riderId: rider.id,
      title: '💳 Premium Deducted',
      body: 'Weekly premium of ₹49 has been deducted from your wallet. Your SHIELD coverage is active.',
      type: 'PREMIUM',
      read: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Created 3 notifications');

  console.log('\n🎉 Seed complete! Demo login: 9876543210 / shield123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
