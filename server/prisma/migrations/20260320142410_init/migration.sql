-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
    "upiId" TEXT,
    "city" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "weeklyEarningsBand" TEXT,
    "walletBalance" REAL NOT NULL DEFAULT 200.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "weeklyPremium" REAL NOT NULL,
    "maxWeeklyPayout" REAL NOT NULL,
    "zoneRiskScore" REAL NOT NULL,
    "platformModifier" REAL NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "disruptionStartedAt" DATETIME NOT NULL,
    "disruptionEndedAt" DATETIME,
    "baselineEarnings" REAL NOT NULL,
    "actualEarnings" REAL NOT NULL,
    "disruptionFraction" REAL NOT NULL,
    "peakCoefficient" REAL NOT NULL,
    "calculatedPayout" REAL NOT NULL,
    "approvedPayout" REAL,
    "fraudScore" REAL,
    "riderNote" TEXT,
    "mediaUrl" TEXT,
    "geolat" REAL NOT NULL,
    "geolong" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "upiRef" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EarningsLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "earnings" REAL NOT NULL,
    "deliveryCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarningsLog_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Rider_phone_key" ON "Rider"("phone");
