"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { getFinanceDashboardAction, registerPaymentAction } from "../actions/finance.actions";
import type { getFinanceDashboard } from "../services/finance.service";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function FinanceView({ patientId, receivableId }: { patientId?: string; receivableId?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getFinanceDashboard>>>();
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<Awaited<ReturnType<typeof getFinanceDashboard>>["receivables"][number]>();
  const [paying, startPayment] = useTransition();
  useEffect(() => {
    setError(undefined);
    setSelected(undefined);
    const filters = patientId || receivableId ? { ...(patientId ? { patientId } : {}), ...(receivableId ? { receivableId } : {}) } : undefined;
    void getFinanceDashboardAction(filters).then((result) => {
      if (!result.success) {
        setData(undefined);
        setError(result.error);
        return;
      }
      setData(result.data);
      if (receivableId) setSelected(result.data.receivables.find((receivable) => receivable.id === receivableId));
    });
  }, [patientId, receivableId]);
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900"><p className="font-semibold">Não foi possível carregar o Financeiro</p><p className="mt-1 text-sm">{error}</p></div>;
  if (!data) return <PageSkeleton />;
  const cards = [["Recebido", data.summary.received], ["A receber", data.summary.balance], ["Vencido", data.summary.overdue], ["Contratado", data.summary.total]] as const;
  return <div className="space-y-5"><header className="rounded-3xl border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Financeiro odontológico</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Contas a receber</h2></header><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{money.format(Number(value))}</p></div>)}</section><section className="rounded-3xl border bg-card p-5"><div><p className="font-semibold">Recebíveis</p><p className="text-sm text-muted-foreground">Saldo, parcelas e situação financeira dos pacientes.</p></div><div className="mt-4 space-y-2">{data.receivables.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum recebível encontrado.</p> : data.receivables.map((row) => <button key={row.id} onClick={() => setSelected(row)} className="flex w-full flex-col gap-2 rounded-xl border p-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{row.patient.name}</p><p className="text-xs text-muted-foreground">{row.code} · {row.budgetCode ?? "Origem manual"} · {row.installments.length} parcela(s)</p></div><div className="flex gap-4 text-sm"><span>Saldo <strong>{money.format(Number(row.balance))}</strong></span><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{row.status}</span></div></button>)}</div></section>{selected && <section className="rounded-3xl border bg-card p-5"><div className="flex justify-between"><div><p className="text-lg font-semibold">{selected.patient.name}</p><p className="text-sm text-muted-foreground">{selected.code} · Saldo {money.format(Number(selected.balance))}</p></div><button onClick={() => setSelected(undefined)} className="text-sm text-muted-foreground">Fechar</button></div><div className="mt-4 grid gap-2">{selected.installments.map((i) => <div key={i.id} className="rounded-xl border p-3"><div className="flex justify-between"><span>{i.sequence}/{selected.installments.length} · {new Date(i.dueDate).toLocaleDateString("pt-BR")}</span><strong>{money.format(Number(i.balance))}</strong></div><p className="mt-1 text-xs text-muted-foreground">Valor {money.format(Number(i.amount))} · Pago {money.format(Number(i.receivedAmount))} · {i.status}</p>{Number(i.balance) > 0 && <button disabled={paying} onClick={() => startPayment(async () => { const amount = window.prompt("Valor do pagamento", i.balance); if (!amount) return; const result = await registerPaymentAction({ installmentId: i.id, amount: Number(amount), method: "PIX", paidAt: new Date().toISOString() }); if (result.success) { toast.success(result.message); window.location.reload(); } else toast.error(result.error); })} className="mt-2 text-sm font-medium text-primary">Registrar pagamento</button>}</div>)}</div><div className="mt-4 border-t pt-3 text-sm"><p className="font-medium">Histórico</p>{selected.events.map((e) => <p key={e.id} className="mt-1 text-muted-foreground">{e.type.replaceAll("_"," ").toLowerCase()} · {new Date(e.createdAt).toLocaleString("pt-BR")}</p>)}</div></section>}</div>;
}
