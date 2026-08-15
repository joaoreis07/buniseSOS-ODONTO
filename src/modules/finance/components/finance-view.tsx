"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { Button } from "@/shared/components/ui/button";
import { formatToothRefs } from "@/modules/odontogram/utils/tooth-surfaces";
import { getFinanceDashboardAction, registerPaymentAction } from "../actions/finance.actions";
import type { getFinanceDashboard } from "../services/finance.service";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type FinanceData = Awaited<ReturnType<typeof getFinanceDashboard>>;
type ReceivableRow = FinanceData["receivables"][number];

function statusClass(status: string) {
  if (status === "PAID" || status === "SETTLED") return "bg-emerald-50 text-emerald-700";
  if (status === "OVERDUE") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-800";
}

export function FinanceView({ patientId, receivableId }: { patientId?: string; receivableId?: string }) {
  const [data, setData] = useState<FinanceData>();
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<ReceivableRow>();
  const [tab, setTab] = useState<"summary" | "receivable">("summary");
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

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <p className="font-semibold">Não foi possível carregar o Financeiro</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }
  if (!data) return <PageSkeleton />;

  const cards = [
    ["Recebido", data.summary.received],
    ["A receber", data.summary.balance],
    ["Vencido", data.summary.overdue],
    ["Contratado", data.summary.total],
  ] as const;
  const upcoming = data.receivables
    .flatMap((row) =>
      row.installments
        .filter((item) => item.status !== "PAID" && item.status !== "CANCELLED")
        .map((item) => ({ ...item, patientName: row.patient.name, receivableId: row.id, row })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 7);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-.04em]">Financeiro</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recebíveis, parcelas e saldo da clínica.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <Button size="sm" variant={tab === "summary" ? "secondary" : "ghost"} className="rounded-lg" onClick={() => setTab("summary")}>
            Resumo
          </Button>
          <Button size="sm" variant={tab === "receivable" ? "secondary" : "ghost"} className="rounded-lg" onClick={() => setTab("receivable")}>
            Contas a receber
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">{money.format(Number(value))}</p>
          </div>
        ))}
      </section>

      {tab === "summary" && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="surface-card p-5">
            <p className="font-semibold">Visão do mês</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Resultado baseado nos recebíveis existentes. Despesas ainda não são lançadas neste módulo.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-800">Recebido</p>
                <p className="mt-1 text-lg font-semibold text-emerald-900">{money.format(Number(data.summary.received))}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs text-amber-800">A receber</p>
                <p className="mt-1 text-lg font-semibold text-amber-900">{money.format(Number(data.summary.balance))}</p>
              </div>
            </div>
          </div>
          <div className="surface-card p-5">
            <p className="font-semibold">Contas a receber (próximos vencimentos)</p>
            <div className="mt-4 space-y-2">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma parcela pendente.</p>
              ) : (
                upcoming.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelected(item.row);
                      setTab("receivable");
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left hover:bg-muted/40"
                  >
                    <span>
                      <span className="block text-sm font-medium">{item.patientName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                    </span>
                    <span className="text-sm font-medium">{money.format(Number(item.balance))}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {tab === "receivable" && (
        <>
          <section className="surface-card p-5">
            <div>
              <p className="font-semibold">Recebíveis</p>
              <p className="text-sm text-muted-foreground">Saldo, parcelas e situação financeira dos pacientes.</p>
            </div>
            <div className="mt-4 space-y-2">
              {data.receivables.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum recebível encontrado.
                </p>
              ) : (
                data.receivables.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelected(row)}
                    className="flex w-full flex-col gap-2 rounded-xl border p-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{row.patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.code} · {row.budgetCode ?? "Origem manual"} · {row.installments.length} parcela(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        Saldo <strong>{money.format(Number(row.balance))}</strong>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(row.status)}`}>{row.status}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {selected && (
            <section className="surface-card p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-lg font-semibold">{selected.patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.code} · Saldo {money.format(Number(selected.balance))}
                  </p>
                </div>
                <button type="button" onClick={() => setSelected(undefined)} className="text-sm text-muted-foreground">
                  Fechar
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {selected.installments.map((installment) => (
                  <div key={installment.id} className="rounded-xl border p-3">
                    <div className="flex justify-between">
                      <span>
                        {installment.sequence}/{selected.installments.length} · {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                      <strong>{money.format(Number(installment.balance))}</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Valor {money.format(Number(installment.amount))} · Pago {money.format(Number(installment.receivedAmount))} · {installment.status}
                    </p>
                    {Number(installment.balance) > 0 && (
                      <button
                        type="button"
                        disabled={paying}
                        onClick={() =>
                          startPayment(async () => {
                            const amount = window.prompt("Valor do pagamento", installment.balance);
                            if (!amount) return;
                            const result = await registerPaymentAction({
                              installmentId: installment.id,
                              amount: Number(amount),
                              method: "PIX",
                              paidAt: new Date().toISOString(),
                            });
                            if (result.success) {
                              toast.success(result.message);
                              window.location.reload();
                            } else toast.error(result.error);
                          })
                        }
                        className="mt-2 text-sm font-medium text-primary"
                      >
                        Registrar pagamento
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {selected.items.length > 0 && (
                <div className="mt-4 border-t pt-3 text-sm">
                  <p className="font-medium">Itens do tratamento</p>
                  {selected.items.map((item) => (
                    <p key={item.id} className="mt-1 text-muted-foreground">
                      {item.description}
                      {item.teeth.length ? ` · ${formatToothRefs(item.teeth)}` : ""} · {money.format(Number(item.total))}
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-4 border-t pt-3 text-sm">
                <p className="font-medium">Histórico</p>
                {selected.events.map((event) => (
                  <p key={event.id} className="mt-1 text-muted-foreground">
                    {event.type.replaceAll("_", " ").toLowerCase()} · {new Date(event.createdAt).toLocaleString("pt-BR")}
                  </p>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
