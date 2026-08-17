import type { ToothSurface } from "@prisma/client";

export type ClinicalToothRefDTO = {
  toothNumber: number;
  surfaces: ToothSurface[];
};

export type AnamnesisDTO = {
  id: string;
  patientId: string;
  allergies: string | null;
  medications: string | null;
  diseases: string | null;
  surgeries: string | null;
  medicalHistory: string | null;
  dentalHistory: string | null;
  observations: string | null;
  smoking: string | null;
  alcoholUse: string | null;
  oralHygiene: string | null;
  parafunctionalHabits: string | null;
  otherHabits: string | null;
  updatedByName: string | null;
  updatedAt: string;
  createdAt: string;
};

export type AnamnesisRevisionDTO = {
  id: string;
  actorName: string | null;
  createdAt: string;
};

export type ClinicalEvolutionDTO = {
  id: string;
  patientId: string;
  title: string;
  description: string;
  notes: string | null;
  occurredAt: string;
  teeth: ClinicalToothRefDTO[];
  professional: { id: string; name: string } | null;
  appointment: { id: string; startsAt: string; procedure: string | null } | null;
  treatmentPlanItem: { id: string; title: string; planCode: string } | null;
  procedure: { id: string; name: string; code: string } | null;
  authorName: string | null;
  updatedAt: string;
  createdAt: string;
};

export type ClinicalAttachmentDTO = {
  id: string;
  type: "DOCUMENT" | "EXAM" | "OTHER";
  category: string;
  title: string;
  description: string | null;
  fileName: string | null;
  fileKey: string | null;
  contentType: string | null;
  fileSize: number | null;
  occurredAt: string | null;
  professionalName: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type TimelineEntryDTO = {
  id: string;
  kind: "evolution" | "anamnesis" | "attachment";
  occurredAt: string;
  title: string;
  subtitle: string | null;
  professionalName: string | null;
  teeth: ClinicalToothRefDTO[];
};

export type ClinicalRecordDTO = {
  patient: { id: string; name: string; preferredName: string | null };
  anamnesis: AnamnesisDTO | null;
  evolutions: ClinicalEvolutionDTO[];
  attachments: ClinicalAttachmentDTO[];
  timeline: TimelineEntryDTO[];
};

export type ClinicalRecordEditorDataDTO = {
  professionals: { id: string; name: string }[];
  appointments: { id: string; startsAt: string; procedure: string | null; status: string }[];
  planItems: { id: string; title: string; planCode: string; teeth: ClinicalToothRefDTO[] }[];
  procedures: { id: string; code: string; name: string }[];
};
