-- CreateEnum
CREATE TYPE "PatientGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "preferredName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN "gender" "PatientGender" NOT NULL DEFAULT 'UNSPECIFIED';
ALTER TABLE "Patient" ADD COLUMN "cpf" TEXT;
ALTER TABLE "Patient" ADD COLUMN "rg" TEXT;
ALTER TABLE "Patient" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Patient" ADD COLUMN "maritalStatus" "MaritalStatus";
ALTER TABLE "Patient" ADD COLUMN "profession" TEXT;
ALTER TABLE "Patient" ADD COLUMN "address" TEXT;
ALTER TABLE "Patient" ADD COLUMN "addressNumber" TEXT;
ALTER TABLE "Patient" ADD COLUMN "district" TEXT;
ALTER TABLE "Patient" ADD COLUMN "city" TEXT;
ALTER TABLE "Patient" ADD COLUMN "state" TEXT;
ALTER TABLE "Patient" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "Patient" ADD COLUMN "responsibleName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "responsiblePhone" TEXT;
ALTER TABLE "Patient" ADD COLUMN "insurance" TEXT;
ALTER TABLE "Patient" ADD COLUMN "insuranceNumber" TEXT;
ALTER TABLE "Patient" ADD COLUMN "bloodType" "BloodType" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Patient" ADD COLUMN "allergies" TEXT;
ALTER TABLE "Patient" ADD COLUMN "medicalNotes" TEXT;
ALTER TABLE "Patient" ADD COLUMN "observations" TEXT;
ALTER TABLE "Patient" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Patient" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Patient" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Patient" ADD COLUMN "updatedById" TEXT;

-- Backfill
UPDATE "Patient" SET "cpf" = "document" WHERE "cpf" IS NULL AND "document" IS NOT NULL;
UPDATE "Patient" SET "isActive" = CASE WHEN "status" = 'ACTIVE' THEN true ELSE false END;

-- CreateIndex
CREATE INDEX "Patient_companyId_cpf_idx" ON "Patient"("companyId", "cpf");
CREATE INDEX "Patient_companyId_isActive_idx" ON "Patient"("companyId", "isActive");
CREATE INDEX "Patient_companyId_status_idx" ON "Patient"("companyId", "status");
CREATE INDEX "Patient_createdById_idx" ON "Patient"("createdById");
CREATE INDEX "Patient_updatedById_idx" ON "Patient"("updatedById");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
