"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";
import { listPatientsAction } from "@/modules/patients/actions/patient.actions";

export function OdontogramPatientPicker() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<{ id: string; fullName: string; preferredName: string | null }[]>(
    [],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      void listPatientsAction({ search: search.trim() || undefined, pageSize: 12, status: "ACTIVE" }).then(
        (result) => {
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          setItems(result.data.items);
        },
      );
    }, 180);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div>
        <h2 className="text-[26px] font-semibold tracking-[-0.035em]">Odontograma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione um paciente para abrir o odontograma clínico.
        </p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar paciente"
          className="h-8 pl-9"
        />
      </div>
      <div className="surface-card divide-y overflow-hidden">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
        ) : (
          items.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => router.push(`/app/odontogram?patientId=${patient.id}`)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
            >
              <UserRound className="size-4 text-muted-foreground" />
              <span className="truncate font-medium">
                {patient.preferredName ? `${patient.fullName} (${patient.preferredName})` : patient.fullName}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
