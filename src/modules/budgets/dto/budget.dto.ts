import type { BudgetItemStatus, BudgetStatus, ToothSurface } from "@prisma/client";

export type BudgetToothDTO = {
  toothNumber: number;
  surfaces: ToothSurface[];
};

export type BudgetItemDTO = {
  id: string;
  procedureId: string | null;
  odontogramProcedureId: string | null;
  professionalId: string | null;
  description: string;
  code: string | null;
  teeth: BudgetToothDTO[];
  quantity: string;
  unitPrice: string;
  discount: string;
  total: string;
  status: BudgetItemStatus;
  notes: string | null;
};

export type BudgetDTO = {
  id: string;
  code: string;
  title: string;
  notes: string | null;
  status: BudgetStatus;
  patient: { id: string; name: string; preferredName: string | null };
  priceTable: { id: string; name: string } | null;
  subtotal: string;
  discount: string;
  total: string;
  updatedAt: string;
  createdAt: string;
  receivableId: string | null;
  items: BudgetItemDTO[];
  events: { id: string; type: string; actorName: string | null; createdAt: string }[];
};

export type BudgetEditorDataDTO = {
  budget: BudgetDTO | null;
  patients: { id: string; name: string }[];
  procedures: { id: string; code: string; name: string; defaultPrice: string }[];
  priceTables: { id: string; name: string }[];
  professionals: { id: string; name: string; specialty: string | null }[];
};
