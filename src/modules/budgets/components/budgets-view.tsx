"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FilePlus2, MoreHorizontal, Pencil, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { StatCard } from "@/shared/components/stat-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { getBudgetEditorDataAction, getOdontogramBudgetPrefillAction, listBudgetsAction, approveBudgetAction, cancelBudgetAction, partiallyApproveBudgetAction, saveBudgetAction, sendBudgetAction } from "../actions/budget.actions";
import type { BudgetDTO, BudgetEditorDataDTO } from "../dto/budget.dto";
import { BudgetEditorScreen, type BudgetDraftItem } from "./budget-editor-screen";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
import {
  budgetProfessionalName,
  budgetStatusLabel,
  budgetStatusTone,
  formatBudgetDate,
  formatBudgetDateTime,
  moneyBrl,
} from "../utils/budget-status";

type DraftItem = BudgetDraftItem;

export function BudgetsView({ patientId, prefilledTeeth, prefilledProcedureIds, canManage, canApprove, canManageFinance, startNew, companyName, createdByName, editId }: { patientId?: string; prefilledTeeth?: string; prefilledProcedureIds?: string; canManage: boolean; canApprove: boolean; canManageFinance: boolean; startNew?: boolean; companyName?: string; createdByName?: string; editId?: string }) {
  const [data, setData] = useState<BudgetEditorDataDTO | null>(null);
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [editing, setEditing] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "APPROVED" | "REJECTED" | "ALL">("OPEN");
  const [saving, startSaving] = useTransition();
  const [patient, setPatient] = useState(patientId ?? "");
  const [title, setTitle] = useState("Proposta de tratamento");
  const [priceTableId, setPriceTableId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState<BudgetDTO | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "APPROVED" | "REJECTED">>({});
  const [search, setSearch] = useState("");
  const openedEdit = useRef(false);

  const load = useCallback(async () => {
    try {
      const [editor, list] = await Promise.all([
        getBudgetEditorDataAction(),
        listBudgetsAction(patientId ? { patientId } : undefined),
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
      setBudgets(list.data);
      if (patientId && prefilledProcedureIds && canManage) {
        const prefill = await getOdontogramBudgetPrefillAction({
          patientId,
          procedureIds: prefilledProcedureIds.split(",").filter(Boolean),
        });
        if (prefill.success) {
          setPatient(patientId);
          setEditing(true);
          setItems(
            prefill.data.map((clinical) => {
              const catalog = editor.data.procedures.find((procedure) => procedure.code === clinical.code);
              return {
                procedureId: catalog?.id ?? null,
                odontogramProcedureId: clinical.id,
                description: clinical.title,
                code: clinical.code,
                toothRefs: [{ toothNumber: clinical.toothNumber, surfaces: [...clinical.surfaces] }],
                professionalId: null,
                quantity: 1,
                unitPrice: Number(catalog?.defaultPrice ?? clinical.defaultPrice ?? 0),
                discount: 0,
                notes: "",
              };
            }),
          );
        } else toast.error(prefill.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os orçamentos");
    }
  }, [canManage, patientId, prefilledProcedureIds]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (startNew && canManage) {
      setEditingBudget(null);
      setItems([]);
      setEditing(true);
    }
  }, [startNew, canManage]);
  useEffect(() => {
    document.body.classList.toggle("bos-fullscreen", editing);
    return () => document.body.classList.remove("bos-fullscreen");
  }, [editing]);
  useEffect(() => {
    if (openedEdit.current || !editId || !canManage || !budgets.length) return;
    const budget = budgets.find((item) => item.id === editId);
    if (!budget) return;
    openedEdit.current = true;
    setEditingBudget(budget);
    setPatient(budget.patient.id);
    setTitle(budget.title);
    setNotes(budget.notes ?? "");
    setPriceTableId(budget.priceTable?.id ?? "");
    setDiscount(Number(budget.discount));
    setItems(
      budget.items.map((item) => ({
        procedureId: item.procedureId,
        odontogramProcedureId: item.odontogramProcedureId,
        description: item.description,
        code: item.code,
        toothRefs: item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: [...tooth.surfaces] })),
        professionalId: item.professionalId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        notes: item.notes ?? "",
      })),
    );
    setEditing(true);
  }, [budgets, canManage, editId]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0), [items]);
  const total = Math.max(0, subtotal - discount);
  const summary = useMemo(() => {
    const awaiting = budgets.filter((budget) => budget.status === "SENT");
    const approved = budgets.filter((budget) =>
      ["APPROVED", "PARTIALLY_APPROVED", "COMPLETED"].includes(budget.status),
    );
    const rejected = budgets.filter((budget) => ["REJECTED", "CANCELED"].includes(budget.status));
    return {
      total: budgets.length,
      awaiting: awaiting.length,
      approved: approved.length,
      rejected: rejected.length,
      value: budgets.reduce((sum, budget) => sum + Number(budget.total), 0),
    };
  }, [budgets]);
  const visibleBudgets = useMemo(() => {
    const groups: Record<typeof statusFilter, BudgetDTO["status"][] | "ALL"> = {
      OPEN: ["DRAFT", "SENT"],
      APPROVED: ["APPROVED", "PARTIALLY_APPROVED", "COMPLETED"],
      REJECTED: ["REJECTED", "CANCELED"],
      ALL: "ALL",
    };
    const allowed = groups[statusFilter];
    const query = search.trim().toLowerCase();
    return budgets.filter((budget) => {
      if (allowed !== "ALL" && !allowed.includes(budget.status)) return false;
      if (!query) return true;
      return [budget.code, budget.title, budget.patient.name].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [budgets, search, statusFilter]);
  function beginEdit(budget: BudgetDTO) {
    setEditingBudget(budget); setPatient(budget.patient.id); setTitle(budget.title); setNotes(budget.notes ?? ""); setPriceTableId(budget.priceTable?.id ?? ""); setDiscount(Number(budget.discount));
    setItems(budget.items.map((item) => ({
      procedureId: item.procedureId,
      odontogramProcedureId: item.odontogramProcedureId,
      description: item.description,
      code: item.code,
      toothRefs: item.teeth.map((tooth) => ({ toothNumber: tooth.toothNumber, surfaces: [...tooth.surfaces] })),
      professionalId: item.professionalId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      notes: item.notes ?? "",
    })));
    setEditing(true);
  }
  function save() {
    if (!canManage) return;
    startSaving(async () => {
      const result = await saveBudgetAction({
        id: editingBudget?.id,
        expectedUpdatedAt: editingBudget?.updatedAt,
        patientId: patient,
        priceTableId: priceTableId || null,
        title,
        notes: notes || null,
        discount,
        items: items.map((item) => ({
          procedureId: item.procedureId,
          odontogramProcedureId: item.odontogramProcedureId,
          description: item.description,
          code: item.code,
          teeth: item.toothRefs,
          professionalId: item.professionalId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          notes: item.notes || null,
        })),
      });
      if (!result.success) { toast.error(result.error); return; }
      toast.success(result.message); setEditing(false); setEditingBudget(null); setItems([]); setDiscount(0); setNotes(""); await load();
    });
  }
  if (!data) return <PageSkeleton />;

  function cancelEditing() {
    setEditing(false);
    setEditingBudget(null);
  }

  if (editing) {
    return (
      <BudgetEditorScreen
        data={data}
        editingBudget={editingBudget}
        patient={patient}
        title={title}
        priceTableId={priceTableId}
        notes={notes}
        items={items}
        discount={discount}
        subtotal={subtotal}
        total={total}
        saving={saving}
        canManage={canManage}
        canApprove={canApprove}
        companyName={companyName ?? "Clínica"}
        createdByName={createdByName ?? ""}
        onPatientChange={setPatient}
        onTitleChange={setTitle}
        onPriceTableChange={setPriceTableId}
        onNotesChange={setNotes}
        onDiscountChange={setDiscount}
        onItemsChange={setItems}
        prefilledTeeth={prefilledTeeth}
        onSave={save}
        onCancel={cancelEditing}
        onSend={() => {
          if (!editingBudget) {
            toast.info("Salve o orçamento antes de enviar.");
            return;
          }
          startSaving(async () => {
            const result = await sendBudgetAction({ id: editingBudget.id, expectedUpdatedAt: editingBudget.updatedAt });
            if (!result.success) { toast.error(result.error); return; }
            toast.success(result.message);
            setEditingBudget(result.data);
            await load();
          });
        }}
        onApprove={() => {
          if (!editingBudget) {
            toast.info("Salve e envie o orçamento antes de aprovar.");
            return;
          }
          startSaving(async () => {
            const result = await approveBudgetAction({ id: editingBudget.id, expectedUpdatedAt: editingBudget.updatedAt });
            if (!result.success) { toast.error(result.error); return; }
            toast.success(result.message);
            cancelEditing();
            await load();
          });
        }}
        onCancelBudget={() => {
          if (!editingBudget) {
            cancelEditing();
            return;
          }
          startSaving(async () => {
            const result = await cancelBudgetAction({ id: editingBudget.id, expectedUpdatedAt: editingBudget.updatedAt });
            if (!result.success) { toast.error(result.error); return; }
            toast.success(result.message);
            cancelEditing();
            await load();
          });
        }}
      />
    );
  }

  const professionals = data.professionals;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">Orçamentos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Propostas clínicas com dente, face e procedimento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente, número ou título"
              className="h-10 pl-9"
            />
          </div>
          {canManage ? (
            <Button
              className="h-10"
              onClick={() => {
                setEditingBudget(null);
                setItems([]);
                setNotes("");
                setEditing(true);
              }}
            >
              <FilePlus2 className="size-4" />
              Novo orçamento
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={String(summary.total)} hint="Orçamentos da clínica" className="p-3.5" />
        <StatCard label="Aguardando aprovação" value={String(summary.awaiting)} hint="Enviados" tone="warning" className="p-3.5" />
        <StatCard label="Aprovados" value={String(summary.approved)} hint="Inclui parciais e concluídos" tone="success" className="p-3.5" />
        <StatCard label="Rejeitados" value={String(summary.rejected)} hint="Recusados e cancelados" tone="danger" className="p-3.5" />
        <StatCard label="Valor total" value={moneyBrl.format(summary.value)} hint="Soma dos orçamentos" tone="info" className="p-3.5" />
      </section>

      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-1.5 pr-4">
        <div className="flex flex-wrap gap-1">
          {([
            ["OPEN", "Abertos"],
            ["APPROVED", "Aprovados"],
            ["REJECTED", "Rejeitados"],
            ["ALL", "Todos"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                statusFilter === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{visibleBudgets.length} orçamento(s)</p>
      </div>

      <section className="surface-card overflow-hidden">
        {visibleBudgets.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhum orçamento encontrado para o filtro selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Número</th>
                  <th className="px-3 py-2.5 font-medium">Paciente</th>
                  <th className="px-3 py-2.5 font-medium">Data</th>
                  <th className="px-3 py-2.5 font-medium">Profissional</th>
                  <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Atualização</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {visibleBudgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/app/patients/${budget.patient.id}?tab=orcamentos&budgetId=${budget.id}`}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {budget.code}
                      </Link>
                      <p className="text-xs text-muted-foreground">{budget.title}</p>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{budget.patient.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatBudgetDate(budget.createdAt)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {budgetProfessionalName(budget, professionals)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-foreground">
                      {moneyBrl.format(Number(budget.total))}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`status-pill ${budgetStatusTone(budget.status)}`}>
                        {budgetStatusLabel(budget.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatBudgetDateTime(budget.updatedAt)}
                    </td>
                    <td className="px-2 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Ações">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/patients/${budget.patient.id}?tab=orcamentos&budgetId=${budget.id}`}>
                              Ver detalhe
                            </Link>
                          </DropdownMenuItem>
                          {budget.status === "DRAFT" && canManage ? (
                            <DropdownMenuItem onClick={() => beginEdit(budget)}>
                              <Pencil className="size-3.5" />
                              Editar
                            </DropdownMenuItem>
                          ) : null}
                          {budget.status === "DRAFT" && canManage ? (
                            <DropdownMenuItem
                              onClick={async () => {
                                const result = await sendBudgetAction({
                                  id: budget.id,
                                  expectedUpdatedAt: budget.updatedAt,
                                });
                                if (result.success) {
                                  toast.success(result.message);
                                  await load();
                                } else toast.error(result.error);
                              }}
                            >
                              <Send className="size-3.5" />
                              Enviar
                            </DropdownMenuItem>
                          ) : null}
                          {budget.receivableId ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/app/patients/${budget.patient.id}?tab=financeiro`}>Ver financeiro</Link>
                            </DropdownMenuItem>
                          ) : null}
                          {canApprove && budget.status === "SENT" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setReviewing(budget)}>
                                Aprovação por item
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canManage &&
                          canManageFinance &&
                          !budget.receivableId &&
                          (budget.status === "APPROVED" || budget.status === "PARTIALLY_APPROVED") ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/app/patients/${budget.patient.id}?tab=orcamentos&budgetId=${budget.id}`}>
                                Gerar financeiro
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reviewing ? (
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Aprovação por item</p>
              <p className="text-sm text-muted-foreground">{reviewing.title}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReviewing(null)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {reviewing.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {item.description}
                    {item.teeth.length ? ` · ${formatToothRefs(item.teeth)}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{moneyBrl.format(Number(item.total))}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={decisions[item.id] === "APPROVED" ? "default" : "outline"}
                    onClick={() => setDecisions((current) => ({ ...current, [item.id]: "APPROVED" }))}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant={decisions[item.id] === "REJECTED" ? "destructive" : "outline"}
                    onClick={() => setDecisions((current) => ({ ...current, [item.id]: "REJECTED" }))}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            className="mt-4 rounded-xl"
            disabled={saving}
            onClick={() =>
              startSaving(async () => {
                const result = await partiallyApproveBudgetAction({
                  id: reviewing.id,
                  expectedUpdatedAt: reviewing.updatedAt,
                  items: Object.entries(decisions).map(([id, status]) => ({ id, status })),
                });
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success(result.message);
                setReviewing(null);
                await load();
              })
            }
          >
            Confirmar decisões
          </Button>
        </section>
      ) : null}
    </div>
  );
}
