/*
  Warnings:

  - You are about to drop the `facilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_facilities` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Facility" AS ENUM ('parking', 'lift', 'cctv', 'generator', 'gym', 'rooftop', 'prayer_room', 'gas_line', 'water_supply', 'security_guard', 'fire_safety');

-- CreateEnum
CREATE TYPE "NearbyPlaceType" AS ENUM ('school', 'college', 'university', 'hospital', 'restaurant', 'shopping_mall', 'market', 'mosque', 'bus_stop', 'park', 'other');

-- DropForeignKey
ALTER TABLE "property_facilities" DROP CONSTRAINT "property_facilities_facility_id_fkey";

-- DropForeignKey
ALTER TABLE "property_facilities" DROP CONSTRAINT "property_facilities_property_id_fkey";

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "facilities" "Facility"[];

-- DropTable
DROP TABLE "facilities";

-- DropTable
DROP TABLE "property_facilities";

-- DropEnum
DROP TYPE "FacilityCategory";

-- CreateTable
CREATE TABLE "nearby_places" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "type" "NearbyPlaceType" NOT NULL,
    "name" TEXT NOT NULL,
    "distance_km" DECIMAL(4,1) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nearby_places_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nearby_places_property_id_idx" ON "nearby_places"("property_id");

-- AddForeignKey
ALTER TABLE "nearby_places" ADD CONSTRAINT "nearby_places_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
