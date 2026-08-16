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
      <Badge variant="secondary" className="rounded-full status-danger border-0">
        Bloqueado
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0",
        isActive ? "status-success" : "bg-white/10 text-muted-foreground",
      )}
    >
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}
