/*
  Warnings:

  - You are about to alter the column `monthly_income` on the `lease_applications` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `monthly_rent` on the `leases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `late_fee_amount` on the `leases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `security_deposit` on the `leases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `late_fee` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total_amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `monthly_rent` on the `units` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "lease_applications" ALTER COLUMN "monthly_income" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "leases" ALTER COLUMN "monthly_rent" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "late_fee_amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "security_deposit" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "late_fee" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "monthly_rent" SET DATA TYPE DECIMAL(10,2);
