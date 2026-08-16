"use client";

import { useEffect, useMemo, useState } from "react";
import type { ToothSurface } from "@prisma/client";
import {
  ArrowLeft,
  Check,
  Copy,
  EllipsisVertical,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { getOdontogramAction } from "@/modules/odontogram/actions/odontogram.actions";
import { OdontogramCanvas } from "@/modules/odontogram/components/odontogram-canvas";
import type { OdontogramToothDTO } from "@/modules/odontogram/dto/odontogram.dto";
import { ALL_FDI_TEETH, type DentitionFilter } from "@/modules/odontogram/utils/fdi-notation";
import {
  buildDisplayTeeth,
  formatToothRefs,
  mergeToothRefsFromInput,
  parseToothNumbers,
  toothRefsToNumbersInput,
  type ToothSelection,
} from "@/modules/odontogram/utils/tooth-surfaces";
import { getPatientAction } from "@/modules/patients/actions/patient.actions";
import { formatCpf } from "@/modules/patients/utils/patient.utils";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { BudgetDTO, BudgetEditorDataDTO } from "../dto/budget.dto";

export type BudgetDraftItem = {
  procedureId: string | null;
  odontogramProcedureId?: string | null;
  description: string;
  code: string | null;
  toothRefs: ToothSelection[];
  professionalId: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  notes: string;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const FIELD = "grid gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground";
const CONTROL =
  "h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm font-medium text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

function emptyChart(): OdontogramToothDTO[] {
  return ALL_FDI_TEETH.map((number) => ({
    id: `fdi-${number}`,
    number,
    conditions: [],
    procedures: [],
    observations: [],
  }));
}

function selectFace(
  current: ToothSelection[],
  toothNumber: number,
  surface: ToothSurface,
  additive: boolean,
): ToothSelection[] {
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
  if (!existing) return [...current, { toothNumber, surfaces: [surface] }];
  const withoutWhole = existing.surfaces.filter((item): item is ToothSurface => item !== "WHOLE");
  if (withoutWhole.includes(surface)) {
    const nextSurfaces = withoutWhole.filter((item) => item !== surface);
    if (nextSurfaces.length === 0) return current.filter((item) => item.toothNumber !== toothNumber);
    return current.map((item) =>
      item.toothNumber === toothNumber ? { toothNumber, surfaces: nextSurfaces } : item,
    );
  }
  return current.map((item) =>
    item.toothNumber === toothNumber ? { toothNumber, surfaces: [...withoutWhole, surface] } : item,
  );
}

function selectWhole(current: ToothSelection[], toothNumber: number, additive: boolean): ToothSelection[] {
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
  if (existing) return current.filter((item) => item.toothNumber !== toothNumber);
  return [...current, { toothNumber, surfaces: ["WHOLE"] }];
}

export function BudgetEditorScreen({
  data,
  editingBudget,
  patient,
  title,
  priceTableId,
  notes,
  items,
  discount,
  subtotal,
  total,
  saving,
  canManage,
  canApprove,
  companyName,
  createdByName,
  onPatientChange,
  onTitleChange,
  onPriceTableChange,
  onNotesChange,
  onDiscountChange,
  onItemsChange,
  onSave,
  onCancel,
  onSend,
  onApprove,
  onCancelBudget,
  prefilledTeeth,
}: {
  data: BudgetEditorDataDTO;
  editingBudget: BudgetDTO | null;
  patient: string;
  title: string;
  priceTableId: string;
  notes: string;
  items: BudgetDraftItem[];
  discount: number;
  subtotal: number;
  total: number;
  saving: boolean;
  canManage: boolean;
  canApprove: boolean;
  companyName: string;
  createdByName: string;
  onPatientChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onPriceTableChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onDiscountChange: (value: number) => void;
  onItemsChange: (items: BudgetDraftItem[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onSend: () => void;
  onApprove: () => void;
  onCancelBudget: () => void;
  prefilledTeeth?: string;
}) {
  const firstProcedure = data.procedures[0];
  const firstProfessional = data.professionals[0];
  const [clinicLabel, setClinicLabel] = useState(companyName);
  const [createdBy, setCreatedBy] = useState(firstProfessional?.id ?? "");
  const [dentition, setDentition] = useState<DentitionFilter>("PERMANENT");
  const [chart, setChart] = useState<OdontogramToothDTO[]>(emptyChart);
  const [cpf, setCpf] = useState<string | null>(null);
  const [draft, setDraft] = useState<BudgetDraftItem>(() => ({
    procedureId: firstProcedure?.id ?? null,
    description: firstProcedure?.name ?? "",
    code: firstProcedure?.code ?? null,
    toothRefs: prefilledTeeth
      ? parseToothNumbers(prefilledTeeth).map((toothNumber) => ({ toothNumber, surfaces: [] as ToothSelection["surfaces"] }))
      : [],
    professionalId: firstProfessional?.id ?? null,
    quantity: 1,
    unitPrice: Number(firstProcedure?.defaultPrice ?? 0),
    discount: 0,
    notes: "",
  }));

  useEffect(() => {
    if (companyName && companyName !== "Clínica") {
      setClinicLabel(companyName);
      return;
    }
    const label = document.querySelector("header.app-header span.max-w-\\[160px\\]");
    const text = label?.textContent?.trim();
    if (text) setClinicLabel(text);
  }, [companyName]);

  useEffect(() => {
    if (!patient) {
      setChart(emptyChart());
      setCpf(null);
      return;
    }
    let mounted = true;
    void Promise.all([getOdontogramAction({ patientId: patient }), getPatientAction(patient)]).then(
      ([odontogram, patientResult]) => {
        if (!mounted) return;
        if (odontogram.success) setChart(buildDisplayTeeth(odontogram.data.teeth, []));
        else setChart(emptyChart());
        setCpf(patientResult.success ? patientResult.data.cpf : null);
      },
    );
    return () => {
      mounted = false;
    };
  }, [patient]);

  const selectedPatient = data.patients.find((item) => item.id === patient);
  const selectedTable =
    data.priceTables.find((table) => table.id === priceTableId)?.name ?? "Particular";
  const displayTeeth = useMemo(() => chart, [chart]);
  const canPersist = Boolean(patient && items.length && canManage);
  const canApproveNow = Boolean(canApprove && editingBudget?.status === "SENT");

  function updateDraftProcedure(procedureId: string) {
    const procedure = data.procedures.find((item) => item.id === procedureId);
    setDraft((current) => ({
      ...current,
      procedureId: procedureId || null,
      description: procedure?.name ?? current.description,
      code: procedure?.code ?? null,
      unitPrice: Number(procedure?.defaultPrice ?? current.unitPrice),
    }));
  }

  function addDraft() {
    if (!canManage) return;
    if (!draft.procedureId && !draft.description.trim()) {
      toast.error("Selecione um procedimento");
      return;
    }
    onItemsChange([...items, { ...draft, professionalId: draft.professionalId || createdBy || null }]);
    setDraft((current) => ({ ...current, toothRefs: [], notes: "", quantity: 1, discount: 0 }));
  }

  function updateItem(index: number, patch: Partial<BudgetDraftItem>) {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function professionalName(id: string | null) {
    return data.professionals.find((item) => item.id === id)?.name ?? createdByName ?? "—";
  }

  function copyCpf() {
    if (!cpf) {
      toast.error("CPF indisponível para este paciente");
      return;
    }
    void navigator.clipboard.writeText(cpf.replace(/\D/g, ""));
    toast.success("CPF copiado");
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3 lg:px-4">
        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Voltar" onClick={onCancel}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          {editingBudget ? "Editar orçamento" : "Novo orçamento"}
        </h1>
        <div className="ml-auto flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-foreground" onClick={() => toast.info("Salve o orçamento para visualizar a proposta.")}>
            <Eye className="size-3.5" />
            Visualizar
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-foreground" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            Imprimir
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-foreground" disabled={!editingBudget} onClick={onSend}>
            <Send className="size-3.5" />
            Enviar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5">
                <MoreVertical className="size-3.5" />
                Mais
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Título da proposta
                </p>
                <input value={title} onChange={(e) => onTitleChange(e.target.value)} className={CONTROL} />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!canPersist} onClick={onSave}>
                Salvar rascunho
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!editingBudget} onClick={onSend}>
                Enviar orçamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onCancelBudget}>
                Cancelar orçamento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="min-w-0 flex-1 space-y-2.5 overflow-y-auto p-3">
          <section className="grid gap-2 md:grid-cols-3">
            <label className={FIELD}>
              Clínica
              <input value={clinicLabel} readOnly className={`${CONTROL} bg-muted/40`} />
            </label>
            <label className={FIELD}>
              Orçamento criado por
              <select value={createdBy} onChange={(e) => {
                setCreatedBy(e.target.value);
                setDraft((current) => ({ ...current, professionalId: e.target.value || current.professionalId }));
              }} className={CONTROL}>
                {data.professionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>{pro.name}</option>
                ))}
              </select>
            </label>
            <label className={FIELD}>
              Paciente
              <span className="relative block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <select value={patient} onChange={(e) => onPatientChange(e.target.value)} className={`${CONTROL} pl-8`}>
                  <option value="">Buscar paciente</option>
                  {data.patients.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </span>
            </label>
          </section>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
            <label className={FIELD}>
              Observações
              <input
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Adicionar observações (opcional)"
                className={CONTROL}
              />
            </label>
            <label className={FIELD}>
              Tabela
              <select value={priceTableId} onChange={(e) => onPriceTableChange(e.target.value)} className={CONTROL}>
                <option value="">Particular</option>
                {data.priceTables.map((table) => (
                  <option key={table.id} value={table.id}>{table.name}</option>
                ))}
              </select>
            </label>
          </div>

          <section className="surface-card p-2.5">
            <div className="space-y-2.5">
              <label className={FIELD}>
                Procedimento
                <select
                  value={draft.procedureId ?? ""}
                  onChange={(e) => updateDraftProcedure(e.target.value)}
                  className={`${CONTROL} h-10 font-semibold`}
                >
                  <option value="">Personalizado</option>
                  {data.procedures.map((procedure) => (
                    <option key={procedure.id} value={procedure.id}>
                      {procedure.code} · {procedure.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <label className={FIELD}>
                  Dentes/Região
                  <input
                    value={toothRefsToNumbersInput(draft.toothRefs)}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        toothRefs: mergeToothRefsFromInput(e.target.value, current.toothRefs),
                      }))
                    }
                    placeholder="16, 26"
                    className={CONTROL}
                  />
                </label>
                <label className={FIELD}>
                  Dentista
                  <select
                    value={draft.professionalId ?? ""}
                    onChange={(e) => setDraft((current) => ({ ...current, professionalId: e.target.value || null }))}
                    className={CONTROL}
                  >
                    <option value="">Não definido</option>
                    {data.professionals.map((pro) => (
                      <option key={pro.id} value={pro.id}>{pro.name}</option>
                    ))}
                  </select>
                </label>
                <label className={FIELD}>
                  Valor unitário
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.unitPrice}
                    onChange={(e) => setDraft((current) => ({ ...current, unitPrice: Number(e.target.value) }))}
                    className={CONTROL}
                  />
                </label>
                <label className={FIELD}>
                  Dentição
                  <select
                    value={dentition}
                    onChange={(e) => setDentition(e.target.value as DentitionFilter)}
                    className={CONTROL}
                  >
                    <option value="PERMANENT">Permanente</option>
                    <option value="DECIDUOUS">Decídua</option>
                    <option value="BOTH">Ambas</option>
                  </select>
                </label>
              </div>
              {draft.toothRefs.some((tooth) => tooth.surfaces.length > 0) ? (
                <p className="text-xs text-muted-foreground">Faces: {formatToothRefs(draft.toothRefs)}</p>
              ) : null}
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <OdontogramCanvas
                    teeth={displayTeeth}
                    dentition={dentition}
                    selected={draft.toothRefs}
                    variant="composer"
                    onSelectFace={(toothNumber, surface, additive) =>
                      setDraft((current) => ({
                        ...current,
                        toothRefs: selectFace(current.toothRefs, toothNumber, surface, additive),
                      }))
                    }
                    onSelectWhole={(toothNumber, additive) =>
                      setDraft((current) => ({
                        ...current,
                        toothRefs: selectWhole(current.toothRefs, toothNumber, additive),
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  className="h-[7.25rem] w-[5.5rem] shrink-0 flex-col gap-1 rounded-lg self-center"
                  disabled={!canManage}
                  onClick={addDraft}
                >
                  <Plus className="size-5" />
                  Adicionar
                </Button>
              </div>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-sm font-semibold text-foreground">Procedimentos adicionados</h2>
              <span className="text-xs text-muted-foreground">{items.length} item(ns)</span>
            </div>
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhum procedimento adicionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Procedimento</th>
                      <th className="px-3 py-2 font-medium">Dente/Região</th>
                      <th className="px-3 py-2 font-medium">Dentista</th>
                      <th className="px-3 py-2 font-medium">Qtd</th>
                      <th className="px-3 py-2 font-medium">Valor unitário</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={`${item.procedureId ?? item.description}-${index}`} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground">
                          {item.code ? `${item.code} · ` : ""}
                          {item.description}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {item.toothRefs.length ? formatToothRefs(item.toothRefs) : "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{professionalName(item.professionalId)}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                            className="h-8 w-16 rounded-md border border-input bg-card px-2 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                            className="h-8 w-24 rounded-md border border-input bg-card px-2 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">
                          {money.format(item.quantity * item.unitPrice - item.discount)}
                        </td>
                        <td className="px-2 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Ações do item">
                                <EllipsisVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onItemsChange(items.filter((_, i) => i !== index))}
                              >
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
              <Button type="button" variant="outline" size="sm" onClick={addDraft}>
                <Plus className="size-3.5" />
                Adicionar procedimento
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => document.querySelector<HTMLInputElement>("input[placeholder='Adicionar observações (opcional)']")?.focus()}>
                Adicionar observação
              </Button>
            </div>
          </section>

          <div className="flex flex-wrap justify-center gap-2 pb-2">
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              Imprimir orçamento
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => toast.info("Salve o orçamento para duplicá-lo.")}>
              <Copy className="size-3.5" />
              Duplicar orçamento
            </Button>
            <Button type="button" variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={onCancelBudget}>
              Cancelar orçamento
            </Button>
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-border bg-card xl:h-full xl:w-[320px] xl:border-l xl:border-t-0">
          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="flex shrink-0 items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">Orçamento</h2>
              <div className="flex gap-0.5">
                <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Visualizar" onClick={() => toast.info("Salve o orçamento para visualizar a proposta.")}>
                  <Eye className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Imprimir" onClick={() => window.print()}>
                  <Printer className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Enviar" disabled={!editingBudget} onClick={onSend}>
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-0.5 shrink-0 text-xs text-muted-foreground">{selectedPatient?.name ?? "Selecione um paciente"}</p>

            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                  Nenhum procedimento selecionado.
                </p>
              ) : (
                items.map((item, index) => (
                  <article key={`${item.description}-${index}`} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-primary bg-primary/10">
                      <Check className="size-3 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight text-foreground">{item.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {professionalName(item.professionalId)}
                        {item.toothRefs.length ? ` · ${formatToothRefs(item.toothRefs)}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 rounded-md bg-[var(--success-surface)] px-2 py-1 text-xs font-semibold text-[var(--success-foreground)]">
                      {money.format(item.quantity * item.unitPrice - item.discount)}
                    </p>
                  </article>
                ))
              )}
            </div>

            <div className="mt-3 shrink-0 space-y-2.5 border-t border-border pt-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Total {selectedTable}
                  </p>
                  <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--success-foreground)]">
                    {money.format(total)}
                  </p>
                </div>
                <label className="grid gap-1 text-[11px] text-muted-foreground">
                  Desconto
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => onDiscountChange(Number(e.target.value))}
                    className="h-8 w-20 rounded-md border border-input bg-card px-2 text-sm text-foreground"
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">Subtotal {money.format(subtotal)}</p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
                onClick={() => toast.info("A forma de pagamento é definida no financeiro após a aprovação.")}
              >
                <Pencil className="size-3.5" />
                Definir forma de pagamento
              </button>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <p className="text-xs text-muted-foreground">
                  {cpf ? `CPF ${formatCpf(cpf)}` : "Consulte o CPF do paciente antes de aprovar."}
                </p>
                <Button type="button" size="sm" className="mt-2 w-full" variant="outline" onClick={copyCpf}>
                  Consultar CPF
                </Button>
              </div>
              <Button
                type="button"
                className="h-11 w-full"
                disabled={saving || (canApproveNow ? false : !canPersist)}
                onClick={canApproveNow ? onApprove : onSave}
              >
                {saving ? "Salvando..." : "Aprovar orçamento"}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
