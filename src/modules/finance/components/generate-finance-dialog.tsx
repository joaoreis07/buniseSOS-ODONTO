"use client";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { generateFinanceFromBudgetAction } from "../actions/finance.actions";
import { previewInstallments } from "../utils/installment-preview";

export function GenerateFinanceDialog({ budgetId, total, patientId }: { budgetId: string; total: number; patientId: string }) {
  const [open, setOpen] = useState(false), [count, setCount] = useState(1), [entry, setEntry] = useState(0), [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, start] = useTransition();
  const preview = useMemo(() => entry <= total && count > 0 ? previewInstallments(total, count, entry, date) : [], [total, count, entry, date]);
  const confirm = () => start(async () => {
    const result = await generateFinanceFromBudgetAction({ budgetId, installmentCount: count, entryAmount: entry, paymentMethod: "PIX", firstDueDate: new Date(date).toISOString() });
    if (!result.success) { toast.error(result.error); return; }
    toast.success(result.message);
    window.location.href = `/app/patients/${patientId}?tab=financeiro`;
  });
  return <><Button size="sm" onClick={() => setOpen(true)}>Gerar financeiro</Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl"><h3 className="text-lg font-semibold">Gerar financeiro</h3><p className="mt-1 text-sm text-muted-foreground">Valor aprovado: {new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(total)}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm">Parcelas<input type="number" min="1" value={count} onChange={e=>setCount(Number(e.target.value))} className="mt-1 h-9 w-full rounded border px-2"/></label><label className="text-sm">Entrada<input type="number" min="0" value={entry} onChange={e=>setEntry(Number(e.target.value))} className="mt-1 h-9 w-full rounded border px-2"/></label><label className="text-sm">1º vencimento<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 h-9 w-full rounded border px-2"/></label></div><div className="mt-4 space-y-1 rounded-xl bg-muted p-3 text-sm">{entry>0&&<p>Entrada — {entry.toFixed(2)}</p>}{preview.map(i=><p key={i.sequence}>{i.sequence}/{count} — R$ {i.amount.toFixed(2)} — {i.dueDate.toLocaleDateString("pt-BR")}</p>)}</div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button><Button disabled={pending||!preview.length} onClick={confirm}>Confirmar geração</Button></div></div></div>}</>;
}
