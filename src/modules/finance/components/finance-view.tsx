"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { StatCard } from "@/shared/components/stat-card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatToothRefsCompact } from "@/modules/odontogram/utils/tooth-surfaces";
import { getFinanceDashboardAction, registerPaymentAction } from "../actions/finance.actions";
import type { getFinanceDashboard } from "../services/finance.service";
import {
  financeEventLabel,
  financeStatusLabel,
  financeStatusTone,
  formatFinanceDate,
  moneyBrl,
  paymentMethodLabel,
} from "../utils/finance-status";

type FinanceData = Awaited<ReturnType<typeof getFinanceDashboard>>;
type ReceivableRow = FinanceData["receivables"][number];
type InstallmentRow = ReceivableRow["installments"][number];

const METHODS = ["PIX", "CASH", "CARD_CREDIT", "CARD_DEBIT", "BOLETO", "TRANSFER", "OTHER"] as const;

type FlatRow = {
  receivable: ReceivableRow;
  installment: InstallmentRow;
  method: string | null;
  paidAt: string | null;
  paymentId: string | null;
};

function sameMonth(iso: string, now = new Date()) {
  const date = new Date(iso);
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function FinanceView({
  patientId,
  receivableId,
  canReceive = false,
}: {
  patientId?: string;
  receivableId?: string;
  canReceive?: boolean;
}) {
  const [data, setData] = useState<FinanceData>();
  const [error, setError] = useState<string>();
  const [selectedId, setSelectedId] = useState<string | undefined>(receivableId);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "PAID" | "OVERDUE">("ALL");
  const [period, setPeriod] = useState<"ALL" | "MONTH" | "OVERDUE">("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [paying, startPayment] = useTransition();
  const [receive, setReceive] = useState<FlatRow | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("PIX");

  const load = useCallback(() => {
    setError(undefined);
    const filters = patientId || receivableId
      ? { ...(patientId ? { patientId } : {}), ...(receivableId ? { receivableId } : {}) }
      : undefined;
    void getFinanceDashboardAction(filters).then((result) => {
      if (!result.success) {
        setData(undefined);
        setError(result.error);
        return;
      }
      setData(result.data);
      if (receivableId) setSelectedId(receivableId);
    });
  }, [patientId, receivableId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="surface-card p-5 text-destructive">
        <p className="font-semibold">Não foi possível carregar o Financeiro</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }
  if (!data) return <PageSkeleton />;

  const rows = data.receivables.flatMap((receivable) =>
    receivable.installments.map((installment) => {
      const lastPayment = installment.payments[0];
      return {
        receivable,
        installment,
        method: lastPayment?.method ?? null,
        paidAt: lastPayment?.paidAt ?? null,
        paymentId: lastPayment?.id ?? null,
      } satisfies FlatRow;
    }),
  );

  const visible = rows.filter((row) => {
    const haystack = [
      row.receivable.patient.name,
      row.receivable.code,
      row.receivable.title,
      row.receivable.budgetCode ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (statusFilter === "PAID" && row.installment.status !== "PAID") return false;
    if (statusFilter === "OVERDUE" && row.installment.status !== "OVERDUE") return false;
    if (
      statusFilter === "OPEN" &&
      !["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(row.installment.status)
    ) {
      return false;
    }
    if (period === "MONTH" && !sameMonth(row.installment.dueDate)) return false;
    if (period === "OVERDUE" && row.installment.status !== "OVERDUE") return false;
    if (methodFilter !== "ALL" && row.method !== methodFilter) return false;
    return true;
  });

  const selected = data.receivables.find((item) => item.id === selectedId);
  const methodsPresent = [...new Set(rows.map((row) => row.method).filter(Boolean))] as string[];

  function openReceive(row: FlatRow) {
    setReceive(row);
    setAmount(row.installment.balance);
    setMethod("PIX");
  }

  function confirmReceive() {
    if (!receive) return;
    startPayment(async () => {
      const result = await registerPaymentAction({
        installmentId: receive.installment.id,
        amount: Number(amount),
        method,
        paidAt: new Date().toISOString(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Pagamento registrado");
      setReceive(null);
      load();
    });
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">Financeiro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recebíveis, parcelas e saldo da clínica.
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total"
          value={moneyBrl.format(Number(data.summary.total))}
          hint="Contratado"
          icon={Wallet}
          tone="primary"
          size="compact"
          className="p-3.5"
        />
        <StatCard
          label="Recebido"
          value={moneyBrl.format(Number(data.summary.received))}
          icon={CheckCircle2}
          tone="success"
          size="compact"
          className="p-3.5"
        />
        <StatCard
          label="Em aberto"
          value={moneyBrl.format(Number(data.summary.balance))}
          icon={Clock}
          tone="warning"
          size="compact"
          className="p-3.5"
        />
        <StatCard
          label="Atrasado"
          value={moneyBrl.format(Number(data.summary.overdue))}
          icon={AlertCircle}
          tone="danger"
          size="compact"
          className="p-3.5"
        />
      </section>

      <div className="surface-card flex flex-wrap items-center gap-2 p-1.5 pr-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Paciente, lançamento ou orçamento"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["ALL", "Todos"],
              ["OPEN", "Em aberto"],
              ["PAID", "Pagos"],
              ["OVERDUE", "Atrasados"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                statusFilter === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as typeof period)}
          className="h-9 rounded-lg border border-input bg-input-background px-2.5 text-sm"
          aria-label="Período"
        >
          <option value="ALL">Todo o período</option>
          <option value="MONTH">Vencimento neste mês</option>
          <option value="OVERDUE">Somente atrasados</option>
        </select>
        <select
          value={methodFilter}
          onChange={(event) => setMethodFilter(event.target.value)}
          className="h-9 rounded-lg border border-input bg-input-background px-2.5 text-sm"
          aria-label="Forma de pagamento"
        >
          <option value="ALL">Todas as formas</option>
          {methodsPresent.map((item) => (
            <option key={item} value={item}>
              {paymentMethodLabel(item)}
            </option>
          ))}
        </select>
        <p className="ml-auto text-xs text-muted-foreground">{visible.length} parcela(s)</p>
      </div>

      <section className="surface-card overflow-hidden">
        {visible.length === 0 ? (
          <p className="p-5 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado para os filtros selecionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Paciente</th>
                  <th className="px-3 py-2 font-medium">Descrição</th>
                  <th className="px-3 py-2 font-medium">Parcela</th>
                  <th className="px-3 py-2 font-medium">Vencimento</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 text-right font-medium">Pago</th>
                  <th className="px-3 py-2 font-medium">Forma</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const canReceiveRow =
                    canReceive &&
                    Number(row.installment.balance) > 0 &&
                    row.installment.status !== "CANCELLED";
                  return (
                    <tr
                      key={row.installment.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/app/patients/${row.receivable.patient.id}?tab=financeiro`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {row.receivable.patient.name}
                        </Link>
                      </td>
                      <td className="min-w-[180px] px-3 py-2">
                        <button
                          type="button"
                          className="text-left font-medium text-foreground hover:text-primary"
                          onClick={() => setSelectedId(row.receivable.id)}
                        >
                          {row.receivable.title}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {row.receivable.code}
                          {row.receivable.budgetCode ? ` · ${row.receivable.budgetCode}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {row.installment.sequence}/{row.receivable.installments.length}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatFinanceDate(row.installment.dueDate)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {moneyBrl.format(Number(row.installment.amount))}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--success-foreground)]">
                        {moneyBrl.format(Number(row.installment.receivedAmount))}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {paymentMethodLabel(row.method)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`status-pill ${financeStatusTone(row.installment.status)}`}>
                          {financeStatusLabel(row.installment.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {canReceiveRow ? (
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => openReceive(row)}>
                              Receber
                            </Button>
                          ) : null}
                          {row.paymentId ? (
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                              <Link href={`/recibo/${row.paymentId}`} target="_blank" rel="noreferrer">
                                Recibo
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end border-t border-border px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Saldo em aberto</span>
          <span className="ml-3 font-semibold tabular-nums text-destructive">
            {moneyBrl.format(Number(data.summary.balance))}
          </span>
        </div>
      </section>

      {selected ? (
        <section className="surface-card p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selected.code} · {selected.patient.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Saldo {moneyBrl.format(Number(selected.balance))}
                {selected.budgetCode ? ` · ${selected.budgetCode}` : ""}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(undefined)}>
              Fechar
            </Button>
          </div>
          {selected.items.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3 text-sm">
              <p className="font-medium">Itens do tratamento</p>
              {selected.items.map((item) => (
                <p key={item.id} className="mt-1 text-muted-foreground">
                  {item.description}
                  {item.teeth.length ? ` · ${formatToothRefsCompact(item.teeth)}` : ""}
                  {" · "}
                  {moneyBrl.format(Number(item.total))}
                </p>
              ))}
            </div>
          ) : null}
          {selected.events.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3 text-sm">
              <p className="font-medium">Histórico</p>
              {selected.events.slice(0, 6).map((event) => (
                <p key={event.id} className="mt-1 text-xs text-muted-foreground">
                  {financeEventLabel(event.type)}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                  {" · "}
                  {formatFinanceDate(event.createdAt)}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <Dialog open={Boolean(receive)} onOpenChange={(open) => !open && setReceive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receber parcela</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {receive
                ? `${receive.receivable.title} · ${receive.installment.sequence}/${receive.receivable.installments.length}`
                : null}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pay-amount">Valor</Label>
              <Input
                id="clinic-pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pay-method">Forma de pagamento</Label>
              <select
                id="clinic-pay-method"
                className="h-9 w-full rounded-lg border border-input bg-input-background px-3 text-sm text-foreground"
                value={method}
                onChange={(event) => setMethod(event.target.value as (typeof METHODS)[number])}
              >
                {METHODS.map((item) => (
                  <option key={item} value={item}>
                    {paymentMethodLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReceive(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmReceive} disabled={paying}>
              {paying ? "Registrando..." : "Confirmar recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
