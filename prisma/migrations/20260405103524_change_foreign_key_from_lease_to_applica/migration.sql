/*
  Warnings:

  - You are about to drop the column `application_id` on the `leases` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lease_id]` on the table `lease_applications` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "leases" DROP CONSTRAINT "leases_application_id_fkey";

-- DropIndex
DROP INDEX "leases_application_id_key";

-- AlterTable
ALTER TABLE "lease_applications" ADD COLUMN     "lease_id" TEXT;

-- AlterTable
ALTER TABLE "leases" DROP COLUMN "application_id";

-- CreateIndex
CREATE UNIQUE INDEX "lease_applications_lease_id_key" ON "lease_applications"("lease_id");

-- AddForeignKey
ALTER TABLE "lease_applications" ADD CONSTRAINT "lease_applications_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
