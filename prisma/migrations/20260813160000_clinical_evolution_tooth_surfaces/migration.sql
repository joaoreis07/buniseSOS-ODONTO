-- AlterTable
ALTER TABLE "ClinicalEvolutionTooth" ADD COLUMN "surfaces" "ToothSurface"[] DEFAULT ARRAY[]::"ToothSurface"[];
