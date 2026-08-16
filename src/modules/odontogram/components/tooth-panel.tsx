"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import type { ToothSurface } from "@prisma/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import type { OdontogramDTO, OdontogramMutation, OdontogramToothDTO, ProcedureCatalogItemDTO } from "../dto/odontogram.dto";
import { CONDITION_CATALOG } from "../utils/fdi-notation";
import {
  formatSelectedSurfaces,
  selectedToothNumbers,
  SURFACE_LABELS,
  type ToothSelection,
} from "../utils/tooth-surfaces";
import { ProcedureCatalogPicker } from "./procedure-catalog-picker";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const SURFACES = [
  ["MESIAL", "M"],
  ["DISTAL", "D"],
  ["OCCLUSAL", "O"],
  ["VESTIBULAR", "V"],
  ["LINGUAL", "L"],
  ["INCISAL", "I"],
] as const satisfies ReadonlyArray<readonly [ToothSurface, string]>;

export function ToothPanel({
  odontogram,
  displayTeeth,
  selected,
  catalog,
  canManage,
  onDraft,
  onPrimarySurfacesChange,
}: {
  odontogram: OdontogramDTO;
  displayTeeth: OdontogramToothDTO[];
  selected: ToothSelection[];
  catalog: ProcedureCatalogItemDTO[];
  canManage: boolean;
  onDraft: (change: OdontogramMutation) => void;
  onPrimarySurfacesChange: (surfaces: ToothSurface[]) => void;
}) {
  const [mode, setMode] = useState<"condition" | "procedure" | "observation">("condition");
  const [conditionCode, setConditionCode] = useState("CARIES");
  const [procedureCode, setProcedureCode] = useState("");
  const catalogByCode = useMemo(
    () => new Map(catalog.map((item) => [item.code, item])),
    [catalog],
  );
  const selectedCatalog = catalogByCode.get(procedureCode) ?? null;
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [body, setBody] = useState("");
  const [phase, setPhase] = useState<"CURRENT" | "PLANNED">("CURRENT");
  const [status, setStatus] = useState<
    "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "RESOLVED" | "CANCELLED"
  >("ACTIVE");
  const [surfaces, setSurfaces] = useState<ToothSurface[]>([]);
  const [editing, setEditing] = useState<{
    type: "condition" | "procedure" | "observation";
    id: string;
    tooth: number;
  } | null>(null);

  const selectedNumbers = selectedToothNumbers(selected);
  const primary = selectedNumbers[0];
  const primarySelection = selected[0];

  const tooth = useMemo(
    () => displayTeeth.find((item) => item.number === primary) ?? null,
    [displayTeeth, primary],
  );
  const targetTeeth = editing ? [editing.tooth] : selectedNumbers;

  useEffect(() => {
    if (editing || selected.length !== 1 || !primarySelection) return;
    const next =
      primarySelection.surfaces.includes("WHOLE")
        ? ([] as ToothSurface[])
        : primarySelection.surfaces.filter((surface) => surface !== "WHOLE");
    setSurfaces(next);
  }, [editing, primarySelection, selected.length]);

  function toggleSurface(surface: ToothSurface) {
    setSurfaces((current) => {
      const next = current.includes(surface)
        ? current.filter((item) => item !== surface)
        : [...current.filter((item) => item !== "WHOLE"), surface];
      if (selected.length === 1 && !editing) {
        onPrimarySurfacesChange(next);
      }
      return next;
    });
  }

  function resetForm() {
    setEditing(null);
    setTitle("");
    setNotes("");
    setBody("");
    setProcedureCode("");
    setSurfaces([]);
    setPhase("CURRENT");
    setStatus("ACTIVE");
  }

  function submit() {
    if (targetTeeth.length === 0) return;
    if (mode === "condition") {
      const catalog = CONDITION_CATALOG[conditionCode as keyof typeof CONDITION_CATALOG];
      onDraft({
        type: "condition",
        id: editing?.type === "condition" ? editing.id : undefined,
        toothNumbers: targetTeeth,
        code: conditionCode,
        title: title.trim() || catalog?.title || conditionCode,
        phase,
        status,
        surfaces,
        notes: notes.trim() || undefined,
      });
    }
    if (mode === "procedure") {
      if (!selectedCatalog) return;
      onDraft({
        type: "procedure",
        id: editing?.type === "procedure" ? editing.id : undefined,
        toothNumbers: targetTeeth,
        code: selectedCatalog.code,
        title: selectedCatalog.name,
        phase,
        status,
        surfaces,
        notes: notes.trim() || undefined,
      });
    }
    if (mode === "observation") {
      if (!body.trim()) return;
      onDraft({
        type: "observation",
        id: editing?.type === "observation" ? editing.id : undefined,
        toothNumbers: targetTeeth,
        body: body.trim(),
      });
    }
    resetForm();
  }

  if (selected.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {selected.length === 1 ? `Dente ${primary}` : `${selected.length} dentes selecionados`}
        </p>
        {selected.length === 1 && primarySelection && (
          <div className="mt-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
            <p className="text-xs font-medium text-primary">Face selecionada</p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatSelectedSurfaces(primarySelection.surfaces)}
            </p>
          </div>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {selected.length === 1
            ? "Registre a situação clínica deste dente ou face."
            : selectedNumbers.join(", ")}
        </p>
      </div>

      {canManage && (
        <div className="space-y-3 border-y border-border py-4">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {(["condition", "procedure", "observation"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                variant={mode === item ? "secondary" : "ghost"}
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => {
                  resetForm();
                  setMode(item);
                }}
              >
                {item === "condition" ? "Condição" : item === "procedure" ? "Procedimento" : "Nota"}
              </Button>
            ))}
          </div>

          {mode !== "observation" && (
            <>
              {mode === "condition" ? (
                <Field label="Condição">
                  <Select value={conditionCode} onValueChange={setConditionCode}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONDITION_CATALOG).map(([code, item]) => (
                        <SelectItem key={code} value={code}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field label="Procedimento">
                  <ProcedureCatalogPicker
                    procedures={catalog}
                    valueCode={procedureCode}
                    onSelect={(item) => {
                      setProcedureCode(item.code);
                      setTitle(item.name);
                    }}
                  />
                  {procedureCode && !selectedCatalog && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Procedimento não encontrado no catálogo.
                      <span className="mt-1 block font-medium">Código atual: {procedureCode}</span>
                      Selecione um procedimento válido do catálogo para substituir.
                    </p>
                  )}
                  {selectedCatalog && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCatalog.code} · {money.format(Number(selectedCatalog.defaultPrice))}
                    </p>
                  )}
                </Field>
              )}
              {mode === "condition" && (
              <Field label="Título opcional">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Usar título do catálogo"
                />
              </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fase">
                  <Select value={phase} onValueChange={(value) => setPhase(value as typeof phase)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CURRENT">Atual</SelectItem>
                      <SelectItem value="PLANNED">Planejada</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                      <SelectItem value="COMPLETED">Concluído</SelectItem>
                      <SelectItem value="RESOLVED">Resolvido</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div>
                <Label>Superfícies</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecionadas no odontograma ou ajuste manualmente abaixo.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SURFACES.map(([surface, label]) => (
                    <Button
                      key={surface}
                      type="button"
                      variant={surfaces.includes(surface) ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 min-w-8 rounded-lg px-2"
                      title={SURFACE_LABELS[surface]}
                      onClick={() => toggleSurface(surface)}
                    >
                      {label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={primarySelection?.surfaces.includes("WHOLE") ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 rounded-lg px-2 text-xs"
                    onClick={() => {
                      setSurfaces([]);
                      if (selected.length === 1) onPrimarySurfacesChange(["WHOLE"]);
                    }}
                  >
                    Inteiro
                  </Button>
                </div>
              </div>
              <Field label="Observação">
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
              </Field>
            </>
          )}

          {mode === "observation" && (
            <Field label="Observação clínica">
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                placeholder="Registre uma observação para este dente..."
              />
            </Field>
          )}
          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={mode === "procedure" && (!selectedCatalog || catalog.length === 0)}
            onClick={submit}
          >
            <Plus className="mr-1 size-4" />{" "}
            {editing
              ? "Atualizar rascunho"
              : `Adicionar${selected.length > 1 ? ` em ${selected.length} dentes` : ""}`}
          </Button>
        </div>
      )}

      {tooth && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Registros salvos
          </p>
          {tooth.conditions.map((item) => (
            <Record
              key={item.id}
              title={item.title}
              meta={`${item.phase === "PLANNED" ? "Planejada" : "Atual"} · ${item.status}${item.surfaces.length ? ` · ${item.surfaces.map((s) => SURFACE_LABELS[s]).join(", ")}` : ""}`}
              onEdit={() => {
                setMode("condition");
                setEditing({ type: "condition", id: item.id, tooth: tooth.number });
                setConditionCode(item.code);
                setTitle(item.title);
                setPhase(item.phase);
                setStatus(item.status);
                setSurfaces(item.surfaces);
                setNotes(item.notes ?? "");
              }}
              onRemove={() => onDraft({ type: "remove", target: "condition", id: item.id })}
              canManage={canManage}
            />
          ))}
          {tooth.procedures.map((item) => {
            const catalogItem = catalogByCode.get(item.code);
            return (
            <Record
              key={item.id}
              title={item.title}
              meta={`${item.phase === "PLANNED" ? "Planejado" : "Atual"} · ${item.status}${item.surfaces.length ? ` · ${item.surfaces.map((s) => SURFACE_LABELS[s]).join(", ")}` : ""}${catalogItem ? ` · ${money.format(Number(catalogItem.defaultPrice))}` : ` · ${item.code}`}`}
              onEdit={() => {
                setMode("procedure");
                setEditing({ type: "procedure", id: item.id, tooth: tooth.number });
                setProcedureCode(item.code);
                setTitle(catalogItem?.name ?? item.title);
                setPhase(item.phase);
                setStatus(item.status);
                setSurfaces(item.surfaces);
                setNotes(item.notes ?? "");
              }}
              onRemove={() => onDraft({ type: "remove", target: "procedure", id: item.id })}
              canManage={canManage}
            />
            );
          })}
          {tooth.observations.map((item) => (
            <Record
              key={item.id}
              title={item.body}
              meta="Observação"
              onEdit={() => {
                setMode("observation");
                setEditing({ type: "observation", id: item.id, tooth: tooth.number });
                setBody(item.body);
              }}
              onRemove={() => onDraft({ type: "remove", target: "observation", id: item.id })}
              canManage={canManage}
            />
          ))}
          {tooth.conditions.length + tooth.procedures.length + tooth.observations.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum registro neste dente.</p>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <History className="size-3" /> Histórico recente
        </p>
        <div className="space-y-2">
          {odontogram.events
            .filter((event) => event.toothNumber === primary)
            .slice(0, 4)
            .map((event) => (
              <p key={event.id} className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                  new Date(event.createdAt),
                )}{" "}
                · {event.type.replaceAll("_", " ").toLowerCase()}
              </p>
            ))}
        </div>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Record({
  title,
  meta,
  onEdit,
  onRemove,
  canManage,
}: {
  title: string;
  meta: string;
  onEdit: () => void;
  onRemove: () => void;
  canManage: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="line-clamp-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      {canManage && (
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onEdit}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="mr-1 size-3" />
            Remover
          </Button>
        </div>
      )}
    </div>
  );
}
