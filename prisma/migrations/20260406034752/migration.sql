-- AlterTable
ALTER TABLE "leases" ALTER COLUMN "payment_due_day" SET DEFAULT 6,
ALTER COLUMN "late_fee_after_days" SET DEFAULT 6,
ALTER COLUMN "late_fee_amount" SET DEFAULT 100;
