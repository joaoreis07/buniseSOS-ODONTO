-- CreateEnum
CREATE TYPE "OdontogramPhase" AS ENUM ('CURRENT', 'PLANNED');

-- CreateEnum
CREATE TYPE "OdontogramRecordStatus" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ToothSurface" AS ENUM ('MESIAL', 'DISTAL', 'OCCLUSAL', 'VESTIBULAR', 'LINGUAL', 'INCISAL', 'CERVICAL', 'WHOLE');

-- CreateEnum
CREATE TYPE "OdontogramEventType" AS ENUM ('CONDITION_CREATED', 'CONDITION_UPDATED', 'CONDITION_REMOVED', 'PROCEDURE_CREATED', 'PROCEDURE_UPDATED', 'PROCEDURE_REMOVED', 'OBSERVATION_CREATED', 'OBSERVATION_UPDATED', 'OBSERVATION_REMOVED');

-- CreateTable
CREATE TABLE "Odontogram" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "notation" TEXT NOT NULL DEFAULT 'FDI',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Odontogram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontogramTooth" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "odontogramId" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontogramTooth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToothCondition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "odontogramId" TEXT NOT NULL,
    "toothId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase" "OdontogramPhase" NOT NULL DEFAULT 'CURRENT',
    "status" "OdontogramRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "professionalId" TEXT,
    "appointmentId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ToothCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToothConditionSurface" (
    "id" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "surface" "ToothSurface" NOT NULL,

    CONSTRAINT "ToothConditionSurface_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontogramProcedure" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "odontogramId" TEXT NOT NULL,
    "toothId" TEXT NOT NULL,
    "conditionId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase" "OdontogramPhase" NOT NULL DEFAULT 'PLANNED',
    "status" "OdontogramRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "surfaces" "ToothSurface"[],
    "notes" TEXT,
    "professionalId" TEXT,
    "appointmentId" TEXT,
    "plannedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OdontogramProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToothObservation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "odontogramId" TEXT NOT NULL,
    "toothId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ToothObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontogramEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "odontogramId" TEXT NOT NULL,
    "toothId" TEXT,
    "batchId" TEXT NOT NULL,
    "type" "OdontogramEventType" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdontogramEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Odontogram_patientId_key" ON "Odontogram"("patientId");

-- CreateIndex
CREATE INDEX "Odontogram_companyId_deletedAt_idx" ON "Odontogram"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Odontogram_companyId_patientId_idx" ON "Odontogram"("companyId", "patientId");

-- CreateIndex
CREATE INDEX "OdontogramTooth_companyId_odontogramId_idx" ON "OdontogramTooth"("companyId", "odontogramId");

-- CreateIndex
CREATE INDEX "OdontogramTooth_companyId_toothNumber_idx" ON "OdontogramTooth"("companyId", "toothNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OdontogramTooth_odontogramId_toothNumber_key" ON "OdontogramTooth"("odontogramId", "toothNumber");

-- CreateIndex
CREATE INDEX "ToothCondition_companyId_odontogramId_phase_status_idx" ON "ToothCondition"("companyId", "odontogramId", "phase", "status");

-- CreateIndex
CREATE INDEX "ToothCondition_toothId_deletedAt_idx" ON "ToothCondition"("toothId", "deletedAt");

-- CreateIndex
CREATE INDEX "ToothCondition_appointmentId_idx" ON "ToothCondition"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ToothConditionSurface_conditionId_surface_key" ON "ToothConditionSurface"("conditionId", "surface");

-- CreateIndex
CREATE INDEX "OdontogramProcedure_companyId_odontogramId_phase_status_idx" ON "OdontogramProcedure"("companyId", "odontogramId", "phase", "status");

-- CreateIndex
CREATE INDEX "OdontogramProcedure_toothId_deletedAt_idx" ON "OdontogramProcedure"("toothId", "deletedAt");

-- CreateIndex
CREATE INDEX "OdontogramProcedure_conditionId_idx" ON "OdontogramProcedure"("conditionId");

-- CreateIndex
CREATE INDEX "OdontogramProcedure_appointmentId_idx" ON "OdontogramProcedure"("appointmentId");

-- CreateIndex
CREATE INDEX "ToothObservation_companyId_odontogramId_createdAt_idx" ON "ToothObservation"("companyId", "odontogramId", "createdAt");

-- CreateIndex
CREATE INDEX "ToothObservation_toothId_deletedAt_idx" ON "ToothObservation"("toothId", "deletedAt");

-- CreateIndex
CREATE INDEX "OdontogramEvent_companyId_odontogramId_createdAt_idx" ON "OdontogramEvent"("companyId", "odontogramId", "createdAt");

-- CreateIndex
CREATE INDEX "OdontogramEvent_toothId_createdAt_idx" ON "OdontogramEvent"("toothId", "createdAt");

-- CreateIndex
CREATE INDEX "OdontogramEvent_batchId_idx" ON "OdontogramEvent"("batchId");

-- AddForeignKey
ALTER TABLE "Odontogram" ADD CONSTRAINT "Odontogram_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odontogram" ADD CONSTRAINT "Odontogram_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odontogram" ADD CONSTRAINT "Odontogram_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Odontogram" ADD CONSTRAINT "Odontogram_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramTooth" ADD CONSTRAINT "OdontogramTooth_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramTooth" ADD CONSTRAINT "OdontogramTooth_odontogramId_fkey" FOREIGN KEY ("odontogramId") REFERENCES "Odontogram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_odontogramId_fkey" FOREIGN KEY ("odontogramId") REFERENCES "Odontogram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_toothId_fkey" FOREIGN KEY ("toothId") REFERENCES "OdontogramTooth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothCondition" ADD CONSTRAINT "ToothCondition_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothConditionSurface" ADD CONSTRAINT "ToothConditionSurface_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "ToothCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_odontogramId_fkey" FOREIGN KEY ("odontogramId") REFERENCES "Odontogram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_toothId_fkey" FOREIGN KEY ("toothId") REFERENCES "OdontogramTooth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "ToothCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramProcedure" ADD CONSTRAINT "OdontogramProcedure_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothObservation" ADD CONSTRAINT "ToothObservation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothObservation" ADD CONSTRAINT "ToothObservation_odontogramId_fkey" FOREIGN KEY ("odontogramId") REFERENCES "Odontogram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothObservation" ADD CONSTRAINT "ToothObservation_toothId_fkey" FOREIGN KEY ("toothId") REFERENCES "OdontogramTooth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothObservation" ADD CONSTRAINT "ToothObservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothObservation" ADD CONSTRAINT "ToothObservation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramEvent" ADD CONSTRAINT "OdontogramEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramEvent" ADD CONSTRAINT "OdontogramEvent_odontogramId_fkey" FOREIGN KEY ("odontogramId") REFERENCES "Odontogram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramEvent" ADD CONSTRAINT "OdontogramEvent_toothId_fkey" FOREIGN KEY ("toothId") REFERENCES "OdontogramTooth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramEvent" ADD CONSTRAINT "OdontogramEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
