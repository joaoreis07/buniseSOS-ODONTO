-- AlterTable
ALTER TABLE "ReceivableItemTooth" ADD COLUMN "surfaces" "ToothSurface"[] DEFAULT ARRAY[]::"ToothSurface"[];
