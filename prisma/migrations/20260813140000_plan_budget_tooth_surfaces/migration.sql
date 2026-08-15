-- AlterTable
ALTER TABLE "TreatmentPlanItemTooth" ADD COLUMN "surfaces" "ToothSurface"[] DEFAULT ARRAY[]::"ToothSurface"[];

-- AlterTable
ALTER TABLE "TreatmentBudgetItemTooth" ADD COLUMN "surfaces" "ToothSurface"[] DEFAULT ARRAY[]::"ToothSurface"[];
