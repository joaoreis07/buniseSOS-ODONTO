"use client";

import { ChevronDown, Download, Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import type { PatientQuotaDTO } from "../services/patient.service";
import { PLAN_LABELS } from "@/modules/app-shell/labels";
import { cn } from "@/shared/lib/utils";

export function PatientToolbar({
  search,
  onSearchChange,
  onCreate,
  canManage,
  total,
  quota,
  filtersOpen,
  onToggleFilters,
  extraFilterCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  canManage: boolean;
  total: number;
  quota?: PatientQuotaDTO | null;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  extraFilterCount: number;
}) {
  const limitHint =
    quota?.limit != null
      ? `Plano ${PLAN_LABELS[quota.plan]}: ${quota.count} de ${quota.limit} pacientes.`
      : `${total} registros nesta clínica.`;
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">Pacientes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seus pacientes de forma rápida e organizada. {limitHint}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1 lg:w-[280px] lg:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone"
            className="h-8 pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={filtersOpen}
          aria-label="Filtros"
          onClick={onToggleFilters}
          className={cn(filtersOpen || extraFilterCount > 0 ? "border-primary/40 text-primary" : "")}
        >
          <SlidersHorizontal className="size-3.5" />
          Filtros
          {extraFilterCount > 0 ? (
            <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {extraFilterCount}
            </span>
          ) : (
            <ChevronDown className={cn("size-3.5 transition", filtersOpen ? "rotate-180" : "")} />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Exportar pacientes"
          title="Exportar"
          onClick={() => toast.message("Exportação será liberada em breve.")}
        >
          <Download className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Importar pacientes"
          title="Importar"
          onClick={() => toast.message("Importação será liberada em breve.")}
        >
          <Upload className="size-3.5" />
        </Button>
        {canManage && (
          <Button type="button" size="sm" onClick={onCreate}>
            <Plus className="size-3.5" />
            Novo paciente
          </Button>
        )}
      </div>
    </div>
  );
}
