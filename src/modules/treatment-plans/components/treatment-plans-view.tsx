"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  FilePlus2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import {
  addTreatmentPlanItemAction,
  changeTreatmentPlanItemStatusAction,
  createBudgetFromPlanAction,
  createTreatmentPlanAction,
  deleteTreatmentPlanAction,
  getOdontogramPlanPrefillAction,
  getTreatmentPlanEditorDataAction,
  listTreatmentPlansAction,
  removeTreatmentPlanItemAction,
  updateTreatmentPlanAction,
} from "../actions/treatment-plan.actions";
import type { TreatmentPlanDTO, TreatmentPlanEditorDataDTO, TreatmentPlanItemDTO } from "../dto/treatment-plan.dto";

type DraftItem = {
  procedureId: string | null;
  odontogramProcedureId?: string | null;
  professionalId: string | null;
  code: string | null;
  title: string;
  teeth: string;
  quantity: number;
  unitPrice: number | null;
  notes: string;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function planStatusLabel(status: TreatmentPlanDTO["status"]) {
  return ({ ACTIVE: "Ativo", COMPLETED: "Concluído", CANCELLED: "Cancelado" })[status];
}

function itemStatusLabel(status: TreatmentPlanItemDTO["status"]) {
  return ({
    PLANNED: "Planejado",
    SCHEDULED: "Agendado",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  })[status];
}

function itemIcon(status: TreatmentPlanItemDTO["status"]) {
  if (status === "COMPLETED") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (status === "IN_PROGRESS") return <Loader2 className="size-4 text-sky-600" />;
  if (status === "CANCELLED") return <X className="size-4 text-muted-foreground" />;
  return <Circle className="size-4 text-muted-foreground" />;
}

export function TreatmentPlansView({
  patientId,
  planId,
  prefilledProcedureIds,
  canManage,
  canDelete,
  canCreateBudget,
}: {
  patientId?: string;
  planId?: string;
  prefilledProcedureIds?: string;
  canManage: boolean;
  canDelete: boolean;
  canCreateBudget: boolean;
}) {
  const [data, setData] = useState<TreatmentPlanEditorDataDTO | null>(null);
  const [plans, setPlans] = useState<TreatmentPlanDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(planId);
  const [creating, setCreating] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [saving, startSaving] = useTransition();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [patient, setPatient] = useState(patientId ?? "");
  const [title, setTitle] = useState("Reabilitação oral");
  const [notes, setNotes] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const selected = useMemo(
    () => plans.find((plan) => plan.id === selectedId) ?? data?.plan ?? null,
    [plans, selectedId, data?.plan],
  );

  const load = useCallback(async () => {
    const [editor, list] = await Promise.all([
      getTreatmentPlanEditorDataAction({ id: selectedId, patientId }),
      listTreatmentPlansAction(patientId ? { patientId } : undefined),
    ]);
    if (!editor.success) {
      toast.error(editor.error);
      return;
    }
    if (!list.success) {
      toast.error(list.error);
      return;
    }
    setData(editor.data);
    setPlans(list.data);
    if (selectedId && list.data.some((plan) => plan.id === selectedId)) {
      setSelectedId(selectedId);
    } else if (planId && list.data.some((plan) => plan.id === planId)) {
      setSelectedId(planId);
    } else if (list.data[0]) {
      setSelectedId(list.data[0].id);
    }

    if (patientId && prefilledProcedureIds && canManage && draftItems.length === 0) {
      const prefill = await getOdontogramPlanPrefillAction({
        patientId,
        procedureIds: prefilledProcedureIds.split(",").filter(Boolean),
      });
      if (prefill.success) {
        setPatient(patientId);
        setCreating(true);
        setDraftItems(
          prefill.data.map((clinical) => {
            const catalog = editor.data.procedures.find((procedure) => procedure.code === clinical.code);
            return {
              procedureId: catalog?.id ?? null,
              odontogramProcedureId: clinical.id,
              professionalId: clinical.professionalId,
              code: clinical.code,
              title: clinical.title,
              teeth: String(clinical.toothNumber),
              quantity: 1,
              unitPrice: catalog ? Number(catalog.defaultPrice) : null,
              notes: "",
            };
          }),
        );
      } else toast.error(prefill.error);
    }
  }, [canManage, draftItems.length, patientId, planId, prefilledProcedureIds, selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setNotes(selected.notes ?? "");
      setResponsibleId(selected.responsibleProfessional?.id ?? "");
      setPatient(selected.patient.id);
    }
  }, [selected]);

  function addDraftItem() {
    if (!data) return;
    const procedure = data.procedures[0];
    setDraftItems((current) => [
      ...current,
      {
        procedureId: procedure?.id ?? null,
        code: procedure?.code ?? null,
        title: procedure?.name ?? "",
        teeth: "",
        professionalId: data.professionals[0]?.id ?? null,
        quantity: 1,
        unitPrice: procedure ? Number(procedure.defaultPrice) : null,
        notes: "",
      },
    ]);
  }

  function createPlan() {
    if (!canManage) return;
    startSaving(async () => {
      const result = await createTreatmentPlanAction({
        patientId: patient,
        title,
        notes: notes || null,
        responsibleProfessionalId: responsibleId || null,
        items: draftItems.map((item) => ({
          ...item,
          teeth: item.teeth
            .split(",")
            .map((value) => Number(value.trim()))
            .filter(Boolean),
          notes: item.notes || null,
        })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setCreating(false);
      setDraftItems([]);
      setSelectedId(result.data.id);
      await load();
    });
  }

  function saveHeader() {
    if (!selected || !canManage) return;
    startSaving(async () => {
      const result = await updateTreatmentPlanAction({
        id: selected.id,
        title,
        notes: notes || null,
        responsibleProfessionalId: responsibleId || null,
        expectedUpdatedAt: selected.updatedAt,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setEditingHeader(false);
      await load();
    });
  }

  function changeStatus(item: TreatmentPlanItemDTO, status: TreatmentPlanItemDTO["status"]) {
    if (!selected || !canManage) return;
    startSaving(async () => {
      const result = await changeTreatmentPlanItemStatusAction({
        planId: selected.id,
        itemId: item.id,
        status,
        expectedUpdatedAt: selected.updatedAt,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      await load();
    });
  }

  function removeItem(itemId: string) {
    if (!selected || !canManage) return;
    startSaving(async () => {
      const result = await removeTreatmentPlanItemAction({
        planId: selected.id,
        itemId,
        expectedUpdatedAt: selected.updatedAt,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      await load();
    });
  }

  function addItemToSelected() {
    if (!selected || !canManage || !data) return;
    const procedure = data.procedures[0];
    startSaving(async () => {
      const result = await addTreatmentPlanItemAction({
        id: selected.id,
        expectedUpdatedAt: selected.updatedAt,
        item: {
          procedureId: procedure?.id ?? null,
          code: procedure?.code ?? null,
          title: procedure?.name ?? "Novo procedimento",
          teeth: [],
          quantity: 1,
          unitPrice: procedure ? Number(procedure.defaultPrice) : null,
          notes: null,
          professionalId: data.professionals[0]?.id ?? null,
        },
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      await load();
    });
  }

  function createBudget() {
    if (!selected || !canManage || !canCreateBudget || selectedItems.length === 0) return;
    startSaving(async () => {
      const result = await createBudgetFromPlanAction({
        planId: selected.id,
        itemIds: selectedItems,
        expectedUpdatedAt: selected.updatedAt,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setSelectedItems([]);
      await load();
    });
  }

  function deletePlan() {
    if (!selected || !canDelete) return;
    startSaving(async () => {
      const result = await deleteTreatmentPlanAction({ id: selected.id, expectedUpdatedAt: selected.updatedAt });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setSelectedId(undefined);
      await load();
    });
  }

  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
            Planejamento clínico
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Plano de Tratamento</h2>
        </div>
        {canManage && (
          <Button className="rounded-xl" onClick={() => { setCreating(true); setDraftItems([]); setPatient(patientId ?? ""); }}>
            <FilePlus2 className="mr-2 size-4" />
            Novo plano
          </Button>
        )}
      </header>

      {creating && (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Novo plano de tratamento</p>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Paciente
              <select value={patient} onChange={(e) => setPatient(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3">
                <option value="">Selecione</option>
                {data.patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Título
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium sm:col-span-2">
              Profissional responsável
              <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3">
                <option value="">Não definido</option>
                {data.professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="space-y-3">
            {draftItems.map((item, index) => (
              <div key={index} className="rounded-2xl border border-border p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium">
                    Procedimento
                    <input value={item.title} onChange={(e) => setDraftItems((c) => c.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" />
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Dentes FDI
                    <input value={item.teeth} onChange={(e) => setDraftItems((c) => c.map((row, i) => i === index ? { ...row, teeth: e.target.value } : row))} placeholder="36" className="h-9 rounded-lg border border-input bg-background px-2 text-sm" />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={addDraftItem}>
              <Plus className="mr-1 size-4" />
              Adicionar procedimento
            </Button>
            <Button className="rounded-xl" disabled={saving || !patient || draftItems.length === 0} onClick={createPlan}>
              {saving ? "Salvando..." : "Criar plano"}
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{plans.length} plano(s)</p>
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum plano registrado.
            </div>
          ) : (
            plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedId(plan.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === plan.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"}`}
              >
                <p className="font-semibold">{plan.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.patient.preferredName || plan.patient.name} · {plan.code}
                </p>
                <p className="mt-2 text-xs">{plan.summary.progressPercent}% concluído</p>
              </button>
            ))
          )}
        </aside>

        {selected ? (
          <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold tracking-[-.03em]">{selected.title}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{planStatusLabel(selected.status)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.patient.preferredName || selected.patient.name}
                  {selected.responsibleProfessional ? ` · ${selected.responsibleProfessional.name}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.summary.total} procedimento(s) · {selected.summary.progressPercent}% concluído
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManage && (
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditingHeader((v) => !v)}>
                    <Pencil className="mr-1 size-3.5" />
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="outline" className="rounded-lg text-rose-700" onClick={deletePlan}>
                    <Trash2 className="mr-1 size-3.5" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>

            {editingHeader && canManage && (
              <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  Título
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2" />
                </label>
                <label className="grid gap-1 text-sm">
                  Responsável
                  <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2">
                    <option value="">Não definido</option>
                    {data.professionals.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <Button className="rounded-lg sm:col-span-2" disabled={saving} onClick={saveHeader}>
                  Salvar alterações
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <Metric label="Planejados" value={selected.summary.planned} />
              <Metric label="Em andamento" value={selected.summary.inProgress} />
              <Metric label="Concluídos" value={selected.summary.completed} />
            </div>

            <div className="space-y-0">
              {selected.items.map((item, index) => (
                <div key={item.id} className="relative flex gap-3 pb-6">
                  {index < selected.items.length - 1 && (
                    <span className="absolute left-[7px] top-6 h-[calc(100%-12px)] w-px bg-border" />
                  )}
                  <div className="relative z-10 mt-0.5">{itemIcon(item.status)}</div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-border/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">
                          {item.title}
                          {item.teeth.length ? ` — dente ${item.teeth.join(", ")}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {itemStatusLabel(item.status)}
                          {item.professionalName ? ` · ${item.professionalName}` : ""}
                          {item.completedAt ? ` · ${new Date(item.completedAt).toLocaleDateString("pt-BR")}` : ""}
                        </p>
                        {item.unitPrice ? (
                          <p className="mt-1 text-sm text-muted-foreground">{money.format(Number(item.unitPrice))}</p>
                        ) : null}
                        {item.budgetId ? (
                          <Link href={`/app/budgets?patientId=${selected.patient.id}`} className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline">
                            Ver orçamento vinculado
                          </Link>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canManage && !item.budgetItemId && (
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) =>
                              setSelectedItems((current) =>
                                e.target.checked
                                  ? [...current, item.id]
                                  : current.filter((id) => id !== item.id),
                              )
                            }
                          />
                        )}
                        {canManage && item.status !== "COMPLETED" && item.status !== "CANCELLED" && (
                          <>
                            {item.status === "PLANNED" && (
                              <Button size="sm" variant="outline" onClick={() => changeStatus(item, "IN_PROGRESS")}>
                                Iniciar
                              </Button>
                            )}
                            {item.status === "IN_PROGRESS" && (
                              <Button size="sm" variant="outline" onClick={() => changeStatus(item, "COMPLETED")}>
                                Concluir
                              </Button>
                            )}
                            {!item.budgetItemId && (
                              <Button size="sm" variant="ghost" className="text-rose-700" onClick={() => removeItem(item.id)}>
                                Remover
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canManage && selected.status !== "CANCELLED" && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="outline" className="rounded-xl" onClick={addItemToSelected}>
                  <Plus className="mr-1 size-4" />
                  Adicionar procedimento
                </Button>
                {canCreateBudget && selectedItems.length > 0 && (
                  <Button className="rounded-xl" disabled={saving} onClick={createBudget}>
                    Criar orçamento ({selectedItems.length})
                  </Button>
                )}
              </div>
            )}

            {selected.budgets.length > 0 && (
              <div className="rounded-2xl bg-muted/40 p-4 text-sm">
                <p className="font-medium">Orçamentos relacionados</p>
                <ul className="mt-2 space-y-1">
                  {selected.budgets.map((budget) => (
                    <li key={budget.id}>
                      <Link href={`/app/budgets?patientId=${selected.patient.id}`} className="text-primary underline-offset-2 hover:underline">
                        {budget.code} · {budget.title} · {budget.status}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Selecione ou crie um plano de tratamento.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
