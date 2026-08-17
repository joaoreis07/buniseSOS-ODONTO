-- AlterTable
ALTER TABLE "ClinicalAttachment" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'document';

-- CreateTable
CREATE TABLE "PatientNote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CLINICAL',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PatientNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalAttachment_companyId_patientId_type_deletedAt_idx" ON "ClinicalAttachment"("companyId", "patientId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "PatientNote_companyId_patientId_deletedAt_createdAt_idx" ON "PatientNote"("companyId", "patientId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "PatientNote_authorId_idx" ON "PatientNote"("authorId");

-- AddForeignKey
ALTER TABLE "PatientNote" ADD CONSTRAINT "PatientNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientNote" ADD CONSTRAINT "PatientNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientNote" ADD CONSTRAINT "PatientNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
