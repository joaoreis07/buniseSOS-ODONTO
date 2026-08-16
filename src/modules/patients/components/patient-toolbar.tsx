"use client";

import { Download, Plus, Search, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";

export function PatientToolbar({
  search,
  onSearchChange,
  onCreate,
  canManage,
  total,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  canManage: boolean;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">Pacientes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seus pacientes de forma rápida e organizada. {total} registros nesta clínica.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone"
            className="h-10 pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          aria-label="Exportar pacientes"
          title="Exportar"
          onClick={() => toast.message("Exportação será liberada em breve.")}
        >
          <Download className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          aria-label="Importar pacientes"
          title="Importar"
          onClick={() => toast.message("Importação será liberada em breve.")}
        >
          <Upload className="size-4" />
        </Button>
        {canManage && (
          <Button type="button" className="h-10" onClick={onCreate}>
            <Plus className="size-4" />
            Novo paciente
          </Button>
        )}
      </div>
    </div>
  );
}
