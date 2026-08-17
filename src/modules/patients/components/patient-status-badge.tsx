"use client";

import { cn } from "@/shared/lib/utils";

export function PatientStatusBadge({
  isActive,
  status,
}: {
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
}) {
  if (status === "BLOCKED") {
    return <span className="status-pill status-danger">Bloqueado</span>;
  }
  return (
    <span className={cn("status-pill", isActive ? "status-success" : "status-neutral")}>
      {isActive ? "Ativo" : "Inativo"}
    </span>
  );
}
