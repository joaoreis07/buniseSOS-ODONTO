-- CreateEnum
CREATE TYPE "ClinicalAttachmentType" AS ENUM ('DOCUMENT', 'EXAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ClinicalEvolutionEventType" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- AlterEnum
ALTER TYPE "FeatureKey" ADD VALUE 'clinical_records';

-- CreateTable
CREATE TABLE "PatientAnamnesis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergies" TEXT,
    "medications" TEXT,
    "diseases" TEXT,
    "surgeries" TEXT,
    "medicalHistory" TEXT,
    "dentalHistory" TEXT,
    "observations" TEXT,
    "smoking" TEXT,
    "alcoholUse" TEXT,
    "oralHygiene" TEXT,
    "parafunctionalHabits" TEXT,
    "otherHabits" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAnamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnamnesisRevision" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "anamnesisId" TEXT NOT NULL,
    "actorId" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnamnesisRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolution" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT,
    "appointmentId" TEXT,
    "treatmentPlanItemId" TEXT,
    "procedureId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolutionTooth" (
    "id" TEXT NOT NULL,
    "evolutionId" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,

    CONSTRAINT "ClinicalEvolutionTooth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolutionEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evolutionId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "ClinicalEvolutionEventType" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalEvolutionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAttachment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "evolutionId" TEXT,
    "professionalId" TEXT,
    "type" "ClinicalAttachmentType" NOT NULL DEFAULT 'DOCUMENT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "contentType" TEXT,
    "fileSize" INTEGER,
    "occurredAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientAnamnesis_patientId_key" ON "PatientAnamnesis"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAnamnesis_companyId_patientId_key" ON "PatientAnamnesis"("companyId", "patientId");

-- CreateIndex
CREATE INDEX "PatientAnamnesis_companyId_idx" ON "PatientAnamnesis"("companyId");

-- CreateIndex
CREATE INDEX "AnamnesisRevision_companyId_anamnesisId_createdAt_idx" ON "AnamnesisRevision"("companyId", "anamnesisId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_companyId_patientId_deletedAt_idx" ON "ClinicalEvolution"("companyId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_companyId_occurredAt_idx" ON "ClinicalEvolution"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_appointmentId_idx" ON "ClinicalEvolution"("appointmentId");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_treatmentPlanItemId_idx" ON "ClinicalEvolution"("treatmentPlanItemId");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_professionalId_idx" ON "ClinicalEvolution"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalEvolutionTooth_evolutionId_toothNumber_key" ON "ClinicalEvolutionTooth"("evolutionId", "toothNumber");

-- CreateIndex
CREATE INDEX "ClinicalEvolutionTooth_toothNumber_idx" ON "ClinicalEvolutionTooth"("toothNumber");

-- CreateIndex
CREATE INDEX "ClinicalEvolutionEvent_companyId_evolutionId_createdAt_idx" ON "ClinicalEvolutionEvent"("companyId", "evolutionId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalAttachment_companyId_patientId_deletedAt_idx" ON "ClinicalAttachment"("companyId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "ClinicalAttachment_evolutionId_idx" ON "ClinicalAttachment"("evolutionId");

-- AddForeignKey
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAnamnesis" ADD CONSTRAINT "PatientAnamnesis_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnamnesisRevision" ADD CONSTRAINT "AnamnesisRevision_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnamnesisRevision" ADD CONSTRAINT "AnamnesisRevision_anamnesisId_fkey" FOREIGN KEY ("anamnesisId") REFERENCES "PatientAnamnesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnamnesisRevision" ADD CONSTRAINT "AnamnesisRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_treatmentPlanItemId_fkey" FOREIGN KEY ("treatmentPlanItemId") REFERENCES "TreatmentPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "ProcedureCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionTooth" ADD CONSTRAINT "ClinicalEvolutionTooth_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "ClinicalEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionEvent" ADD CONSTRAINT "ClinicalEvolutionEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionEvent" ADD CONSTRAINT "ClinicalEvolutionEvent_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "ClinicalEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionEvent" ADD CONSTRAINT "ClinicalEvolutionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "ClinicalEvolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
