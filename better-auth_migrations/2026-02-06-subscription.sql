-- Subscription table for storing user plan information
CREATE TABLE "subscription" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "status" TEXT NOT NULL DEFAULT 'active',
  "currentPeriodEnd" TIMESTAMPTZ,
  "externalId" TEXT,
  "externalCustomerId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("userId")
);

CREATE INDEX "subscription_userId_idx" ON "subscription" ("userId");
CREATE INDEX "subscription_externalId_idx" ON "subscription" ("externalId");
