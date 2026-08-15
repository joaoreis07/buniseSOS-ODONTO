import type { TreatmentPlanItemStatus, TreatmentPlanStatus, ToothSurface } from "@prisma/client";

export type TreatmentPlanToothDTO = {
  toothNumber: number;
  surfaces: ToothSurface[];
};

export type TreatmentPlanItemDTO = {
  id: string;
  procedureId: string | null;
  odontogramProcedureId: string | null;
  professionalId: string | null;
  professionalName: string | null;
  appointmentId: string | null;
  budgetItemId: string | null;
  budgetId: string | null;
  code: string | null;
  title: string;
  teeth: TreatmentPlanToothDTO[];
  quantity: string;
  unitPrice: string | null;
  status: TreatmentPlanItemStatus;
  sortOrder: number;
  notes: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
};

export type TreatmentPlanSummaryDTO = {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  progressPercent: number;
};

export type TreatmentPlanDTO = {
  id: string;
  code: string;
  title: string;
  notes: string | null;
  status: TreatmentPlanStatus;
  patient: { id: string; name: string; preferredName: string | null };
  responsibleProfessional: { id: string; name: string } | null;
  summary: TreatmentPlanSummaryDTO;
  items: TreatmentPlanItemDTO[];
  budgets: { id: string; code: string; title: string; status: string }[];
  updatedAt: string;
  createdAt: string;
};

export type TreatmentPlanEditorDataDTO = {
  plan: TreatmentPlanDTO | null;
  patients: { id: string; name: string }[];
  procedures: { id: string; code: string; name: string; defaultPrice: string }[];
  professionals: { id: string; name: string; specialty: string | null }[];
  plans: { id: string; title: string; code: string; status: TreatmentPlanStatus }[];
};
