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
      <Badge variant="secondary" className="rounded-full bg-rose-50 text-rose-700">
        Bloqueado
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
      )}
    >
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}
