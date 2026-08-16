"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { ToothSurface } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { applyOdontogramChangesAction, getOdontogramAction, listProcedureCatalogAction } from "../actions/odontogram.actions";
import type { OdontogramDTO, OdontogramMutation, ProcedureCatalogItemDTO } from "../dto/odontogram.dto";
import { CONDITION_CATALOG, type DentitionFilter } from "../utils/fdi-notation";
import {
  buildDisplayTeeth,
  selectedToothNumbers,
  type ToothSelection,
} from "../utils/tooth-surfaces";
import { OdontogramCanvas } from "./odontogram-canvas";
import { OdontogramPatientPicker } from "./odontogram-patient-picker";
import { ToothPanel } from "./tooth-panel";

export function OdontogramView({ patientId, canManage }: { patientId?: string; canManage: boolean }) {
  const [odontogram, setOdontogram] = useState<OdontogramDTO | null>(null);
  const [catalog, setCatalog] = useState<ProcedureCatalogItemDTO[]>([]);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<string | null>(null);
  const [dentition, setDentition] = useState<DentitionFilter>("PERMANENT");
  const [selected, setSelected] = useState<ToothSelection[]>([]);
  const [draft, setDraft] = useState<OdontogramMutation[]>([]);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    if (!patientId) return;
    let mounted = true;
    setLoading(true);
    void Promise.all([
      getOdontogramAction({ patientId }),
      listProcedureCatalogAction(),
    ]).then(([chart, procedures]) => {
      if (!mounted) return;
      if (!chart.success) {
        setError(chart.error);
      } else {
        setOdontogram(chart.data);
      }
      if (procedures.success) {
        setCatalog(procedures.data);
      } else {
        toast.error(procedures.error);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const displayTeeth = useMemo(
    () => (odontogram ? buildDisplayTeeth(odontogram.teeth, draft) : []),
    [odontogram, draft],
  );

  const selectedNumbers = useMemo(() => selectedToothNumbers(selected), [selected]);

  const selectedProcedureIds = useMemo(
    () =>
      odontogram?.teeth
        .filter((tooth) => selectedNumbers.includes(tooth.number))
        .flatMap((tooth) => tooth.procedures.map((procedure) => procedure.id)) ?? [],
    [odontogram, selectedNumbers],
  );

  function selectFace(toothNumber: number, surface: ToothSurface, additive: boolean) {
    setSelected((current) => {
      const existing = current.find((item) => item.toothNumber === toothNumber);

      if (!additive) {
        if (
          current.length === 1 &&
          existing &&
          existing.surfaces.length === 1 &&
          existing.surfaces[0] === surface
        ) {
          return [];
        }
        return [{ toothNumber, surfaces: [surface] }];
      }

      if (!existing) {
        return [...current, { toothNumber, surfaces: [surface] }];
      }

      const withoutWhole = existing.surfaces.filter((item): item is ToothSurface => item !== "WHOLE");
      const hasFace = withoutWhole.includes(surface);
      if (hasFace) {
        const nextSurfaces = withoutWhole.filter((item) => item !== surface);
        if (nextSurfaces.length === 0) {
          return current.filter((item) => item.toothNumber !== toothNumber);
        }
        return current.map((item) =>
          item.toothNumber === toothNumber ? { toothNumber, surfaces: nextSurfaces } : item,
        );
      }

      return current.map((item) =>
        item.toothNumber === toothNumber
          ? { toothNumber, surfaces: [...withoutWhole, surface] }
          : item,
      );
    });
  }

  function selectWhole(toothNumber: number, additive: boolean) {
    setSelected((current) => {
      const existing = current.find((item) => item.toothNumber === toothNumber);

      if (!additive) {
        if (
          current.length === 1 &&
          existing &&
          existing.surfaces.length === 1 &&
          existing.surfaces[0] === "WHOLE"
        ) {
          return [];
        }
        return [{ toothNumber, surfaces: ["WHOLE"] }];
      }

      if (existing) {
        return current.filter((item) => item.toothNumber !== toothNumber);
      }
      return [...current, { toothNumber, surfaces: ["WHOLE"] }];
    });
  }

  function selectRegion(region: "upper" | "lower" | "left" | "right") {
    if (!odontogram) return;
    const values = odontogram.teeth
      .map((tooth) => tooth.number)
      .filter((number) => {
        if (region === "upper") {
          return (
            Math.floor(number / 10) === 1 ||
            Math.floor(number / 10) === 2 ||
            Math.floor(number / 10) === 5 ||
            Math.floor(number / 10) === 6
          );
        }
        if (region === "lower") {
          return (
            Math.floor(number / 10) === 3 ||
            Math.floor(number / 10) === 4 ||
            Math.floor(number / 10) === 7 ||
            Math.floor(number / 10) === 8
          );
        }
        if (region === "left") {
          return (
            number % 10 <= 5 &&
            (Math.floor(number / 10) === 2 ||
              Math.floor(number / 10) === 3 ||
              Math.floor(number / 10) === 6 ||
              Math.floor(number / 10) === 7)
          );
        }
        return (
          number % 10 <= 8 &&
          (Math.floor(number / 10) === 1 ||
            Math.floor(number / 10) === 4 ||
            Math.floor(number / 10) === 5 ||
            Math.floor(number / 10) === 8)
        );
      });
    setSelected(values.map((toothNumber) => ({ toothNumber, surfaces: ["WHOLE"] as ToothSurface[] })));
  }

  function updatePrimarySurfaces(surfaces: ToothSurface[]) {
    if (selected.length !== 1) return;
    const primary = selected[0]!;
    const next = surfaces.length > 0 ? surfaces : ["WHOLE" as ToothSurface];
    setSelected([{ toothNumber: primary.toothNumber, surfaces: next }]);
  }

  function save() {
    if (!odontogram || draft.length === 0) return;
    startSaving(async () => {
      const result = await applyOdontogramChangesAction({
        patientId: odontogram.patient.id,
        expectedUpdatedAt: odontogram.updatedAt,
        changes: draft,
      });
      if (!result.success) {
        toast.error(result.error);
        if (result.error.includes("alterado por outra pessoa")) setError(result.error);
        return;
      }
      setOdontogram(result.data);
      setDraft([]);
      toast.success(result.message ?? "Odontograma salvo");
    });
  }

  if (!patientId) {
    return <OdontogramPatientPicker />;
  }
  if (loading) return <PageSkeleton />;
  if (error || !odontogram) {
    return (
      <div className="surface-card p-6 text-destructive">
        <AlertTriangle className="size-5" />
        <p className="mt-3 font-semibold">Não foi possível carregar o odontograma</p>
        <p className="mt-1 text-sm">{error ?? "Tente novamente."}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Odontograma clínico
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
            {odontogram.patient.preferredName || odontogram.patient.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">FDI · versão clínica {odontogram.version}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="surface-card flex gap-1 p-1"
            role="group"
            aria-label="Visualização da dentição"
          >
            {(
              [
                ["PERMANENT", "Permanente"],
                ["DECIDUOUS", "Decídua"],
                ["BOTH", "Ambas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDentition(value)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  dentition === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {canManage && (
            <>
              {selectedProcedureIds.length > 0 && (
                <>
                  <Button asChild type="button" variant="outline" size="sm" className="rounded-lg">
                    <Link
                      href={`/app/treatment-plans?patientId=${odontogram.patient.id}&procedureIds=${selectedProcedureIds.join(",")}`}
                    >
                      Adicionar ao plano
                    </Link>
                  </Button>
                  <Button asChild type="button" variant="outline" size="sm" className="rounded-lg">
                    <Link
                      href={`/app/budgets?patientId=${odontogram.patient.id}&teeth=${selectedNumbers.join(",")}&procedureIds=${selectedProcedureIds.join(",")}`}
                    >
                      Criar orçamento
                    </Link>
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={draft.length === 0}
                onClick={() => setDraft((current) => current.slice(0, -1))}
              >
                <Undo2 className="mr-1 size-3.5" />
                Desfazer
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={draft.length === 0}
                  >
                    <RotateCcw className="mr-1 size-3.5" />
                    Descartar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Descartar alterações pendentes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      As alterações ainda não salvas serão removidas do rascunho.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setDraft([])}>Descartar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                size="sm"
                className="rounded-lg"
                disabled={draft.length === 0 || saving}
                onClick={save}
              >
                <Save className="mr-1 size-3.5" />
                {saving ? "Salvando..." : `Salvar alterações${draft.length ? ` (${draft.length})` : ""}`}
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {Object.entries(CONDITION_CATALOG)
          .slice(0, 6)
          .map(([code, item]) => (
            <span key={code} className="rounded-full border border-border bg-card px-2.5 py-1 text-muted-foreground">
              {item.title}
            </span>
          ))}
        {draft.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
            {draft.length} alterações pendentes
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-muted-foreground">Selecionar:</span>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => selectRegion("upper")}>
          Arcada superior
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => selectRegion("lower")}>
          Arcada inferior
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => selectRegion("left")}>
          Quadrantes esquerdos
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => selectRegion("right")}>
          Quadrantes direitos
        </Button>
        {selected.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setSelected([])}>
            Limpar seleção
          </Button>
        )}
      </div>

      <div className={selected.length > 0 ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : undefined}>
        <OdontogramCanvas
          teeth={displayTeeth}
          dentition={dentition}
          selected={selected}
          onSelectFace={selectFace}
          onSelectWhole={selectWhole}
        />
        <ToothPanel
          odontogram={odontogram}
          displayTeeth={displayTeeth}
          selected={selected}
          catalog={catalog}
          canManage={canManage}
          onDraft={(change) => setDraft((current) => [...current, change])}
          onPrimarySurfacesChange={updatePrimarySurfaces}
        />
      </div>
    </div>
  );
}
