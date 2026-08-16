"use client";

import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

export function PatientStatusBadge({
  isActive,
  status,
}: {
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
}) {
  if (status === "BLOCKED") {
    return (
      <Badge variant="secondary" className="status-danger rounded-full border-0 px-2.5 font-semibold">
        Bloqueado
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0 px-2.5 font-semibold",
        isActive ? "status-success" : "status-neutral",
      )}
    >
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}
