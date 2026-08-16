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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">Pacientes</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie seus pacientes de forma rápida e organizada. {total} registros nesta clínica.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nome, CPF, telefone, e-mail..."
            className="rounded-xl pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => toast.message("Exportação será liberada em breve.")}
        >
          <Download className="mr-1 size-4" />
          Exportar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => toast.message("Importação será liberada em breve.")}
        >
          <Upload className="mr-1 size-4" />
          Importar
        </Button>
        {canManage && (
          <Button type="button" className="rounded-xl" onClick={onCreate}>
            <Plus className="mr-1 size-4" />
            Novo paciente
          </Button>
        )}
      </div>
    </div>
  );
}
