import type { OdontogramEventType, OdontogramPhase, OdontogramRecordStatus, ToothSurface } from "@prisma/client";

export type ToothConditionDTO = {
  id: string;
  code: string;
  title: string;
  phase: OdontogramPhase;
  status: OdontogramRecordStatus;
  notes: string | null;
  surfaces: ToothSurface[];
  createdAt: string;
  updatedAt: string;
};

export type OdontogramProcedureDTO = {
  id: string;
  conditionId: string | null;
  code: string;
  title: string;
  phase: OdontogramPhase;
  status: OdontogramRecordStatus;
  surfaces: ToothSurface[];
  notes: string | null;
  plannedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ToothObservationDTO = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type OdontogramToothDTO = {
  id: string;
  number: number;
  conditions: ToothConditionDTO[];
  procedures: OdontogramProcedureDTO[];
  observations: ToothObservationDTO[];
};

export type OdontogramEventDTO = {
  id: string;
  toothNumber: number | null;
  batchId: string;
  type: OdontogramEventType;
  before: unknown;
  after: unknown;
  actorName: string | null;
  createdAt: string;
};

export type OdontogramDTO = {
  id: string;
  patient: { id: string; name: string; preferredName: string | null; birthDate: string | null };
  notation: string;
  version: number;
  updatedAt: string;
  teeth: OdontogramToothDTO[];
  events: OdontogramEventDTO[];
};

export type OdontogramMutation =
  | {
      type: "condition";
      id?: string;
      toothNumbers: number[];
      code: string;
      title: string;
      phase: OdontogramPhase;
      status: OdontogramRecordStatus;
      surfaces: ToothSurface[];
      notes?: string;
    }
  | {
      type: "procedure";
      id?: string;
      toothNumbers: number[];
      conditionId?: string;
      code: string;
      title: string;
      phase: OdontogramPhase;
      status: OdontogramRecordStatus;
      surfaces: ToothSurface[];
      notes?: string;
    }
  | { type: "observation"; id?: string; toothNumbers: number[]; body: string }
  | { type: "remove"; target: "condition" | "procedure" | "observation"; id: string };
