-- CreateEnum
CREATE TYPE "TreatmentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TreatmentPlanItemStatus" AS ENUM ('PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TreatmentPlanEventType" AS ENUM ('CREATED', 'UPDATED', 'ITEM_ADDED', 'ITEM_UPDATED', 'ITEM_REMOVED', 'ITEM_STATUS_CHANGED', 'BUDGET_CREATED', 'COMPLETED', 'CANCELLED', 'DELETED');

-- AlterTable
ALTER TABLE "TreatmentBudget" ADD COLUMN "treatmentPlanId" TEXT;

-- AlterTable
ALTER TABLE "TreatmentBudgetItem" ADD COLUMN "treatmentPlanItemId" TEXT;

-- CreateTable
CREATE TABLE "TreatmentPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "responsibleProfessionalId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPlanItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "procedureId" TEXT,
    "odontogramProcedureId" TEXT,
    "professionalId" TEXT,
    "appointmentId" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2),
    "status" "TreatmentPlanItemStatus" NOT NULL DEFAULT 'PLANNED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TreatmentPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPlanItemTooth" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,

    CONSTRAINT "TreatmentPlanItemTooth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPlanEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "TreatmentPlanEventType" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreatmentPlanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentPlan_companyId_code_key" ON "TreatmentPlan"("companyId", "code");

-- CreateIndex
CREATE INDEX "TreatmentPlan_companyId_patientId_deletedAt_idx" ON "TreatmentPlan"("companyId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "TreatmentPlan_companyId_status_deletedAt_idx" ON "TreatmentPlan"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "TreatmentPlan_responsibleProfessionalId_idx" ON "TreatmentPlan"("responsibleProfessionalId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentBudgetItem_treatmentPlanItemId_key" ON "TreatmentBudgetItem"("treatmentPlanItemId");

-- CreateIndex
CREATE INDEX "TreatmentPlanItem_companyId_planId_deletedAt_idx" ON "TreatmentPlanItem"("companyId", "planId", "deletedAt");

-- CreateIndex
CREATE INDEX "TreatmentPlanItem_procedureId_idx" ON "TreatmentPlanItem"("procedureId");

-- CreateIndex
CREATE INDEX "TreatmentPlanItem_odontogramProcedureId_idx" ON "TreatmentPlanItem"("odontogramProcedureId");

-- CreateIndex
CREATE INDEX "TreatmentPlanItem_professionalId_idx" ON "TreatmentPlanItem"("professionalId");

-- CreateIndex
CREATE INDEX "TreatmentPlanItem_appointmentId_idx" ON "TreatmentPlanItem"("appointmentId");

-- CreateIndex
CREATE INDEX "TreatmentPlanItem_status_idx" ON "TreatmentPlanItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentPlanItemTooth_itemId_toothNumber_key" ON "TreatmentPlanItemTooth"("itemId", "toothNumber");

-- CreateIndex
CREATE INDEX "TreatmentPlanItemTooth_toothNumber_idx" ON "TreatmentPlanItemTooth"("toothNumber");

-- CreateIndex
CREATE INDEX "TreatmentPlanEvent_companyId_planId_createdAt_idx" ON "TreatmentPlanEvent"("companyId", "planId", "createdAt");

-- CreateIndex
CREATE INDEX "TreatmentBudget_treatmentPlanId_idx" ON "TreatmentBudget"("treatmentPlanId");

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "TreatmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItem" ADD CONSTRAINT "TreatmentBudgetItem_treatmentPlanItemId_fkey" FOREIGN KEY ("treatmentPlanItemId") REFERENCES "TreatmentPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_responsibleProfessionalId_fkey" FOREIGN KEY ("responsibleProfessionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "ProcedureCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_odontogramProcedureId_fkey" FOREIGN KEY ("odontogramProcedureId") REFERENCES "OdontogramProcedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanItemTooth" ADD CONSTRAINT "TreatmentPlanItemTooth_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "TreatmentPlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanEvent" ADD CONSTRAINT "TreatmentPlanEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanEvent" ADD CONSTRAINT "TreatmentPlanEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanEvent" ADD CONSTRAINT "TreatmentPlanEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
