"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Check, FilePlus2, Pencil, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { approveBudgetAction, cancelBudgetAction, deleteBudgetAction, getBudgetEditorDataAction, getOdontogramBudgetPrefillAction, listBudgetsAction, partiallyApproveBudgetAction, saveBudgetAction, sendBudgetAction } from "../actions/budget.actions";
import { GenerateFinanceDialog } from "@/modules/finance/components/generate-finance-dialog";
import type { BudgetDTO, BudgetEditorDataDTO } from "../dto/budget.dto";

type DraftItem = { procedureId: string | null; odontogramProcedureId?: string | null; description: string; code: string | null; teeth: string; professionalId: string | null; quantity: number; unitPrice: number; discount: number; notes: string };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusLabel(status: BudgetDTO["status"]) {
  return ({ DRAFT: "Rascunho", SENT: "Enviado", APPROVED: "Aprovado", PARTIALLY_APPROVED: "Parcialmente aprovado", REJECTED: "Recusado", CANCELED: "Cancelado", COMPLETED: "Concluído" })[status];
}

export function BudgetsView({ patientId, prefilledTeeth, prefilledProcedureIds, canManage, canApprove, canManageFinance }: { patientId?: string; prefilledTeeth?: string; prefilledProcedureIds?: string; canManage: boolean; canApprove: boolean; canManageFinance: boolean }) {
  const [data, setData] = useState<BudgetEditorDataDTO | null>(null);
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [editing, setEditing] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<BudgetDTO["status"] | "ALL">("ALL");
  const [saving, startSaving] = useTransition();
  const [patient, setPatient] = useState(patientId ?? "");
  const [title, setTitle] = useState("Proposta de tratamento");
  const [priceTableId, setPriceTableId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [reviewing, setReviewing] = useState<BudgetDTO | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "APPROVED" | "REJECTED">>({});

  const load = useCallback(async () => {
    const [editor, list] = await Promise.all([getBudgetEditorDataAction(), listBudgetsAction(patientId ? { patientId } : undefined)]);
    if (!editor.success) { toast.error(editor.error); return; }
    if (!list.success) { toast.error(list.error); return; }
    setData(editor.data); setBudgets(list.data);
    if (patientId && prefilledProcedureIds && canManage) {
      const prefill = await getOdontogramBudgetPrefillAction({ patientId, procedureIds: prefilledProcedureIds.split(",").filter(Boolean) });
      if (prefill.success) {
        setPatient(patientId); setEditing(true);
        setItems(prefill.data.map((clinical) => {
          const catalog = editor.data.procedures.find((procedure) => procedure.code === clinical.code);
          return { procedureId: catalog?.id ?? null, odontogramProcedureId: clinical.id, description: clinical.title, code: clinical.code, teeth: String(clinical.toothNumber), professionalId: null, quantity: 1, unitPrice: Number(catalog?.defaultPrice ?? 0), discount: 0, notes: "" };
        }));
      } else toast.error(prefill.error);
    }
  }, [canManage, patientId, prefilledProcedureIds]);
  useEffect(() => { void load(); }, [load]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0), [items]);
  const total = Math.max(0, subtotal - discount);
  const visibleBudgets = useMemo(() => budgets.filter((budget) => statusFilter === "ALL" || budget.status === statusFilter), [budgets, statusFilter]);
  function beginEdit(budget: BudgetDTO) {
    setEditingBudget(budget); setPatient(budget.patient.id); setTitle(budget.title); setPriceTableId(budget.priceTable?.id ?? ""); setDiscount(Number(budget.discount));
    setItems(budget.items.map((item) => ({ procedureId: item.procedureId, odontogramProcedureId: item.odontogramProcedureId, description: item.description, code: item.code, teeth: item.teeth.join(", "), professionalId: item.professionalId, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), discount: Number(item.discount), notes: item.notes ?? "" })));
    setEditing(true);
  }
  function addItem() {
    if (!data) return;
    const procedure = data.procedures[0];
    setItems((current) => [...current, { procedureId: procedure?.id ?? null, description: procedure?.name ?? "", code: procedure?.code ?? null, teeth: prefilledTeeth ?? "", professionalId: data.professionals[0]?.id ?? null, quantity: 1, unitPrice: Number(procedure?.defaultPrice ?? 0), discount: 0, notes: "" }]);
  }
  function updateItem(index: number, field: keyof DraftItem, value: string | number | null) {
    setItems((current) => current.map((item, i) => {
      if (i !== index) return item;
      if (field === "procedureId") {
        const procedure = data?.procedures.find((p) => p.id === value);
        return { ...item, procedureId: value as string | null, description: procedure?.name ?? item.description, code: procedure?.code ?? null, unitPrice: Number(procedure?.defaultPrice ?? item.unitPrice) };
      }
      return { ...item, [field]: value };
    }));
  }
  function save() {
    if (!canManage) return;
    startSaving(async () => {
      const result = await saveBudgetAction({ id: editingBudget?.id, expectedUpdatedAt: editingBudget?.updatedAt, patientId: patient, priceTableId: priceTableId || null, title, discount, items: items.map((item) => ({ ...item, teeth: item.teeth.split(",").map((value) => Number(value.trim())).filter(Boolean), notes: item.notes || null })) });
      if (!result.success) { toast.error(result.error); return; }
      toast.success(result.message); setEditing(false); setEditingBudget(null); setItems([]); setDiscount(0); await load();
    });
  }
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Planejamento clínico-comercial</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Orçamentos</h2></div>
        {canManage && <Button className="rounded-xl" onClick={() => { setEditingBudget(null); setItems([]); setEditing(true); }}><FilePlus2 className="mr-2 size-4" />Novo orçamento</Button>}
      </header>

      {editing && <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">Paciente<select value={patient} onChange={(e) => setPatient(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3"><option value="">Selecione</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-medium">Título<input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3" /></label>
            <label className="grid gap-1 text-sm font-medium">Tabela de preços<select value={priceTableId} onChange={(e) => setPriceTableId(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3"><option value="">Sem tabela</option>{data.priceTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => <div key={index} className="rounded-2xl border border-border p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs font-medium">Procedimento<select value={item.procedureId ?? ""} onChange={(e) => updateItem(index, "procedureId", e.target.value || null)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="">Personalizado</option>{data.procedures.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
                <label className="grid gap-1 text-xs font-medium">Profissional<select value={item.professionalId ?? ""} onChange={(e) => updateItem(index, "professionalId", e.target.value || null)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="">Não definido</option>{data.professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
                <label className="grid gap-1 text-xs font-medium">Dentes FDI (separados por vírgula)<input value={item.teeth} onChange={(e) => updateItem(index, "teeth", e.target.value)} placeholder="16, 26" className="h-9 rounded-lg border border-input bg-background px-2 text-sm" /></label>
                <label className="grid gap-1 text-xs font-medium">Quantidade<input type="number" min="0.01" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" /></label>
                <label className="grid gap-1 text-xs font-medium">Valor unitário<input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" /></label>
                <label className="grid gap-1 text-xs font-medium">Desconto do item<input type="number" min="0" step="0.01" value={item.discount} onChange={(e) => updateItem(index, "discount", Number(e.target.value))} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" /></label>
              </div>
              <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold">{money.format(item.quantity * item.unitPrice - item.discount)}</span><Button variant="ghost" size="sm" className="text-rose-700" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}><X className="size-4" /></Button></div>
            </div>)}
          </div>
          <Button variant="outline" className="rounded-xl" onClick={addItem}>Adicionar procedimento</Button>
        </div>
        <aside className="h-fit rounded-3xl border border-border bg-card p-5 xl:sticky xl:top-5">
          <p className="text-sm font-semibold">Resumo do orçamento</p>
          <div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money.format(subtotal)}</span></div><label className="grid gap-1"><span className="text-muted-foreground">Desconto geral</span><input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-9 rounded-lg border border-input bg-background px-2" /></label><div className="flex justify-between border-t pt-3 text-base font-semibold"><span>Total</span><span>{money.format(total)}</span></div></div>
          <Button className="mt-6 w-full rounded-xl" disabled={saving || !patient || !items.length} onClick={save}>{saving ? "Salvando..." : "Salvar orçamento"}</Button>
        </aside>
      </section>}

      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{visibleBudgets.length} orçamento(s)</p><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="ALL">Todos os status</option>{(["DRAFT","SENT","APPROVED","PARTIALLY_APPROVED","REJECTED","CANCELED","COMPLETED"] as const).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div>
      <section className="space-y-3">{visibleBudgets.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhum orçamento encontrado para o filtro selecionado.</div> : visibleBudgets.map((budget) => <article key={budget.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{budget.title}</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{statusLabel(budget.status)}</span></div><p className="mt-1 text-sm text-muted-foreground">{budget.code} · {budget.patient.name} · {budget.items.length} item(ns)</p></div><div className="flex flex-wrap items-center gap-2"><strong>{money.format(Number(budget.total))}</strong>{budget.receivableId ? <><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Financeiro gerado</span><Button asChild size="sm" variant="outline"><Link href={`/app/finance?patientId=${budget.patient.id}&receivableId=${budget.receivableId}`}>Ver financeiro</Link></Button></> : (budget.status === "APPROVED" || budget.status === "PARTIALLY_APPROVED") && canManage && canManageFinance ? <GenerateFinanceDialog budgetId={budget.id} total={Number(budget.total)} patientId={budget.patient.id} /> : null}{budget.status === "DRAFT" && canManage && <><Button size="sm" variant="outline" onClick={() => beginEdit(budget)}><Pencil className="mr-1 size-3.5" />Editar</Button><Button size="sm" variant="outline" onClick={async () => { const result = await sendBudgetAction({ id: budget.id, expectedUpdatedAt: budget.updatedAt }); if (result.success) { toast.success(result.message); await load(); } else toast.error(result.error); }}><Send className="mr-1 size-3.5" />Enviar</Button></>}</div></div><div className="mt-3 border-t pt-3 text-xs text-muted-foreground">{budget.events.length ? <span>Histórico: {budget.events.slice(0, 3).map((event) => `${event.type.replaceAll("_", " ").toLowerCase()} · ${new Date(event.createdAt).toLocaleDateString("pt-BR")}`).join(" · ")}</span> : <span>Sem eventos registrados.</span>}</div></article>)}</section>
      {reviewing && <section className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><p className="font-semibold">Aprovação por item</p><p className="text-sm text-muted-foreground">{reviewing.title}</p></div><Button variant="ghost" size="sm" onClick={() => setReviewing(null)}><X className="size-4" /></Button></div><div className="mt-4 space-y-2">{reviewing.items.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.description}{item.teeth.length ? ` · ${item.teeth.join(", ")}` : ""}</p><p className="text-sm text-muted-foreground">{money.format(Number(item.total))}</p></div><div className="flex gap-1"><Button size="sm" variant={decisions[item.id] === "APPROVED" ? "default" : "outline"} onClick={() => setDecisions((current) => ({ ...current, [item.id]: "APPROVED" }))}>Aprovar</Button><Button size="sm" variant={decisions[item.id] === "REJECTED" ? "destructive" : "outline"} onClick={() => setDecisions((current) => ({ ...current, [item.id]: "REJECTED" }))}>Recusar</Button></div></div>)}</div><Button className="mt-4 rounded-xl" disabled={saving} onClick={() => startSaving(async () => { const result = await partiallyApproveBudgetAction({ id: reviewing.id, expectedUpdatedAt: reviewing.updatedAt, items: Object.entries(decisions).map(([id, status]) => ({ id, status })) }); if (!result.success) { toast.error(result.error); return; } toast.success(result.message); setReviewing(null); await load(); })}>Confirmar decisões</Button></section>}
    </div>
  );
}
