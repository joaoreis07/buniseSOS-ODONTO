-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BudgetItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BudgetEventType" AS ENUM ('CREATED', 'UPDATED', 'ITEM_ADDED', 'ITEM_UPDATED', 'ITEM_REMOVED', 'SENT', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ProcedureCatalog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProcedureCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceTable" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PriceTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceTableItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "priceTableId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceTableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentBudget" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "priceTableId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentBudgetItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "procedureId" TEXT,
    "odontogramProcedureId" TEXT,
    "professionalId" TEXT,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BudgetItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TreatmentBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentBudgetItemTooth" (
    "id" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,

    CONSTRAINT "TreatmentBudgetItemTooth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "BudgetEventType" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcedureCatalog_companyId_active_deletedAt_idx" ON "ProcedureCatalog"("companyId", "active", "deletedAt");

-- CreateIndex
CREATE INDEX "ProcedureCatalog_companyId_category_idx" ON "ProcedureCatalog"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureCatalog_companyId_code_key" ON "ProcedureCatalog"("companyId", "code");

-- CreateIndex
CREATE INDEX "PriceTable_companyId_active_deletedAt_idx" ON "PriceTable"("companyId", "active", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceTable_companyId_name_key" ON "PriceTable"("companyId", "name");

-- CreateIndex
CREATE INDEX "PriceTableItem_companyId_priceTableId_idx" ON "PriceTableItem"("companyId", "priceTableId");

-- CreateIndex
CREATE INDEX "PriceTableItem_companyId_procedureId_idx" ON "PriceTableItem"("companyId", "procedureId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceTableItem_priceTableId_procedureId_key" ON "PriceTableItem"("priceTableId", "procedureId");

-- CreateIndex
CREATE INDEX "TreatmentBudget_companyId_patientId_deletedAt_idx" ON "TreatmentBudget"("companyId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "TreatmentBudget_companyId_status_deletedAt_idx" ON "TreatmentBudget"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "TreatmentBudget_priceTableId_idx" ON "TreatmentBudget"("priceTableId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentBudget_companyId_code_key" ON "TreatmentBudget"("companyId", "code");

-- CreateIndex
CREATE INDEX "TreatmentBudgetItem_companyId_budgetId_deletedAt_idx" ON "TreatmentBudgetItem"("companyId", "budgetId", "deletedAt");

-- CreateIndex
CREATE INDEX "TreatmentBudgetItem_procedureId_idx" ON "TreatmentBudgetItem"("procedureId");

-- CreateIndex
CREATE INDEX "TreatmentBudgetItem_odontogramProcedureId_idx" ON "TreatmentBudgetItem"("odontogramProcedureId");

-- CreateIndex
CREATE INDEX "TreatmentBudgetItem_professionalId_idx" ON "TreatmentBudgetItem"("professionalId");

-- CreateIndex
CREATE INDEX "TreatmentBudgetItemTooth_toothNumber_idx" ON "TreatmentBudgetItemTooth"("toothNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentBudgetItemTooth_budgetItemId_toothNumber_key" ON "TreatmentBudgetItemTooth"("budgetItemId", "toothNumber");

-- CreateIndex
CREATE INDEX "BudgetEvent_companyId_budgetId_createdAt_idx" ON "BudgetEvent"("companyId", "budgetId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProcedureCatalog" ADD CONSTRAINT "ProcedureCatalog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTable" ADD CONSTRAINT "PriceTable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTableItem" ADD CONSTRAINT "PriceTableItem_priceTableId_fkey" FOREIGN KEY ("priceTableId") REFERENCES "PriceTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTableItem" ADD CONSTRAINT "PriceTableItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "ProcedureCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_priceTableId_fkey" FOREIGN KEY ("priceTableId") REFERENCES "PriceTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudget" ADD CONSTRAINT "TreatmentBudget_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItem" ADD CONSTRAINT "TreatmentBudgetItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItem" ADD CONSTRAINT "TreatmentBudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "TreatmentBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItem" ADD CONSTRAINT "TreatmentBudgetItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "ProcedureCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItem" ADD CONSTRAINT "TreatmentBudgetItem_odontogramProcedureId_fkey" FOREIGN KEY ("odontogramProcedureId") REFERENCES "OdontogramProcedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItem" ADD CONSTRAINT "TreatmentBudgetItem_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentBudgetItemTooth" ADD CONSTRAINT "TreatmentBudgetItemTooth_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "TreatmentBudgetItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEvent" ADD CONSTRAINT "BudgetEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEvent" ADD CONSTRAINT "BudgetEvent_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "TreatmentBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEvent" ADD CONSTRAINT "BudgetEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
