-- AlterTable
ALTER TABLE "Company" ADD COLUMN "email" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
