"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Ban,
  Banknote,
  Bookmark,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  QrCode,
  Receipt,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  getFinanceDashboardAction,
  registerPaymentAction,
} from "@/modules/finance/actions/finance.actions";
import type { getFinanceDashboard } from "@/modules/finance/services/finance.service";
import type { PatientClientDTO } from "../../dto/patient.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR");
const METHODS = ["PIX", "CASH", "CARD_CREDIT", "CARD_DEBIT", "BOLETO", "TRANSFER", "OTHER"] as const;

type FinanceData = Awaited<ReturnType<typeof getFinanceDashboard>>;
type Row = {
  receivableId: string;
  installmentId: string;
  launchedAt: string;
  title: string;
  description: string;
  budgetId: string | null;
  budgetCode: string | null;
  amount: string;
  paid: string;
  balance: string;
  method: string | null;
  sequence: number;
  installmentCount: number;
  status: string;
  paidAt: string | null;
};

function statusClass(status: string) {
  if (status === "PAID" || status === "SETTLED") return "status-success";
  if (status === "OVERDUE") return "status-danger";
  if (status === "PARTIALLY_PAID" || status === "PENDING") return "status-warning";
  return "status-info";
}

function statusLabel(status: string) {
  return (
    {
      PAID: "Pago",
      SETTLED: "Quitado",
      OVERDUE: "Pendente",
      PARTIALLY_PAID: "Aberto",
      PENDING: "A vencer",
      CANCELLED: "Cancelado",
    } as Record<string, string>
  )[status] ?? status;
}

function methodLabel(method: string | null) {
  if (!method) return "—";
  return (
    {
      PIX: "PIX",
      CASH: "Dinheiro",
      CARD_CREDIT: "Crédito",
      CARD_DEBIT: "Débito",
      BOLETO: "Boleto",
      TRANSFER: "Transferência",
      OTHER: "Outro",
    } as Record<string, string>
  )[method] ?? method;
}

function MethodIcon({ method }: { method: string | null }) {
  if (!method) return null;
  const Icon =
    method === "PIX"
      ? QrCode
      : method === "CASH"
        ? Banknote
        : method === "BOLETO"
          ? FileText
          : CreditCard;
  return <Icon className="size-3.5 shrink-0 text-muted-foreground" />;
}

export function PatientFinancialTab({
  patient,
  receiptsOnly = false,
}: {
  patient: PatientClientDTO;
  receiptsOnly?: boolean;
}) {
  const [data, setData] = useState<FinanceData>();
  const [paying, startPay] = useTransition();
  const [receive, setReceive] = useState<Row | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("PIX");

  const reload = useCallback(() => {
    void getFinanceDashboardAction({ patientId: patient.id }).then((result) => {
      if (result.success) setData(result.data);
    });
  }, [patient.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    return data.receivables.flatMap((receivable) =>
      receivable.installments.map((installment) => {
        const lastPayment = installment.payments[0];
        return {
          receivableId: receivable.id,
          installmentId: installment.id,
          launchedAt: installment.dueDate,
          title: receivable.title,
          description: `${receivable.title} · Parcela ${installment.sequence}`,
          budgetId: receivable.budgetId,
          budgetCode: receivable.budgetCode,
          amount: installment.amount,
          paid: installment.receivedAmount,
          balance: installment.balance,
          method: lastPayment?.method ?? null,
          sequence: installment.sequence,
          installmentCount: receivable.installments.length,
          status: installment.status,
          paidAt: lastPayment?.paidAt ?? null,
        };
      }),
    );
  }, [data]);

  const visible = receiptsOnly ? rows.filter((row) => Number(row.paid) > 0) : rows;
  const inProgress = data
    ? (Number(data.summary.balance) - Number(data.summary.overdue)).toFixed(2)
    : "0";

  function openReceive(row: Row) {
    setReceive(row);
    setAmount(row.balance);
    setMethod("PIX");
  }

  function confirmReceive() {
    if (!receive) return;
    startPay(async () => {
      const result = await registerPaymentAction({
        installmentId: receive.installmentId,
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
      reload();
    });
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Carregando situação financeira...</p>;
  }

  if (receiptsOnly) {
    return (
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="font-medium text-foreground">Recibos</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pagamentos já registrados deste paciente.
          </p>
        </div>
        {visible.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Nenhum recibo emitido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Descrição</th>
                  <th className="px-3 py-2 text-right font-medium">Valor pago</th>
                  <th className="px-3 py-2 font-medium">Forma</th>
                  <th className="px-3 py-2 font-medium">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.installmentId} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2">{row.description}</td>
                    <td className="px-3 py-2 text-right font-medium text-success">
                      {money.format(Number(row.paid))}
                    </td>
                    <td className="px-3 py-2">{methodLabel(row.method)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.paidAt ? dateFmt.format(new Date(row.paidAt)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const overdue = Number(data.summary.overdue);
  const nextDue = data.summary.nextDue;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Financeiro</p>
          <p className="text-sm text-muted-foreground">Lançamentos, parcelas e saldo do paciente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {overdue > 0 ? (
            <span className="font-medium text-destructive">
              Vencido {money.format(overdue)}
            </span>
          ) : null}
          {nextDue ? (
            <span className="text-muted-foreground">
              Próximo vencimento {dateFmt.format(new Date(nextDue.dueDate))}
            </span>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href={`/app/patients/${patient.id}?tab=orcamentos`}>Ver orçamentos</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total do plano"
          value={money.format(Number(data.summary.total))}
          tone="primary"
          icon={Wallet}
        />
        <Metric
          label="Já realizado"
          value={money.format(Number(data.summary.received))}
          tone="success"
          icon={CheckCircle2}
        />
        <Metric
          label="Em andamento"
          value={money.format(Number(inProgress))}
          tone="info"
          icon={Clock}
        />
        <Metric
          label="Pendentes"
          value={money.format(Number(data.summary.balance))}
          tone={overdue > 0 ? "danger" : "warning"}
          icon={overdue > 0 ? AlertCircle : Bookmark}
        />
      </section>

      <div className="surface-card overflow-hidden">
        {visible.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Nenhum lançamento financeiro para este paciente. O financeiro é gerado a partir de um
            orçamento aprovado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="w-10 px-2 py-2 font-medium" />
                  <th className="px-3 py-2 font-medium">Lançamento</th>
                  <th className="px-3 py-2 font-medium">Descrição</th>
                  <th className="px-3 py-2 text-right font-medium">Valor a pagar</th>
                  <th className="px-3 py-2 text-right font-medium">Valor pago</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo</th>
                  <th className="px-3 py-2 font-medium">Forma pagto.</th>
                  <th className="px-3 py-2 font-medium">Parcelas</th>
                  <th className="px-3 py-2 font-medium">Pagamento</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const canReceive = Number(row.balance) > 0 && row.status !== "CANCELLED";
                  const budgetHref = row.budgetId
                    ? `/app/patients/${patient.id}?tab=orcamentos&budgetId=${row.budgetId}`
                    : null;
                  return (
                    <tr key={row.installmentId} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                      <td className="w-10 px-2 py-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" aria-label="Ações do lançamento">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {canReceive ? (
                              <DropdownMenuItem onSelect={() => openReceive(row)}>
                                <Wallet className="size-3.5 text-success" />
                                Receber parcela
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onSelect={() => toast.message("Edição de lançamento ainda não está disponível.")}
                            >
                              <Pencil className="size-3.5 text-primary" />
                              Editar lançamento
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => toast.message("Exclusão de lançamento ainda não está disponível.")}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                              Excluir lançamento
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => toast.message("Cancelamento de pagamento ainda não está disponível.")}
                            >
                              <Ban className="size-3.5 text-warning" />
                              Cancelar pagamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => toast.message("Recibo será gerado nas próximas etapas.")}
                            >
                              <Receipt className="size-3.5 text-primary" />
                              Recibo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => toast.message(`Parcela ${row.sequence} deste lançamento.`)}
                            >
                              <FileText className="size-3.5" />
                              Parcelas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => toast.message("Emissão de NFS-e ainda não está disponível.")}
                            >
                              <FileText className="size-3.5 text-primary" />
                              Emitir NFS-e
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                        {dateFmt.format(new Date(row.launchedAt))}
                      </td>
                      <td className="min-w-[180px] px-3 py-2">
                        <p className="font-medium text-foreground">{row.title}</p>
                        {row.budgetCode ? (
                          budgetHref ? (
                            <Link
                              href={budgetHref}
                              className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              {row.budgetCode}
                              <ExternalLink className="size-3" />
                            </Link>
                          ) : (
                            <p className="mt-0.5 text-xs text-muted-foreground">{row.budgetCode}</p>
                          )
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">Sem orçamento vinculado</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                        {money.format(Number(row.amount))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-success">
                        {money.format(Number(row.paid))}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums ${
                          Number(row.balance) > 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {money.format(Number(row.balance))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <MethodIcon method={row.method} />
                          {methodLabel(row.method)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                        {row.sequence}/{row.installmentCount}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {row.paidAt ? dateFmt.format(new Date(row.paidAt)) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`status-pill ${statusClass(row.status)}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end border-t border-border px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Saldo a pagar</span>
          <span className="ml-3 font-semibold tabular-nums text-destructive">
            {money.format(Number(data.summary.balance))}
          </span>
        </div>
      </div>

      <Dialog open={Boolean(receive)} onOpenChange={(open) => !open && setReceive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receber parcela</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{receive?.description}</p>
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Valor</Label>
              <Input
                id="pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-method">Forma de pagamento</Label>
              <select
                id="pay-method"
                className="h-9 w-full rounded-lg border border-input bg-input-background px-3 text-sm text-foreground"
                value={method}
                onChange={(event) => setMethod(event.target.value as (typeof METHODS)[number])}
              >
                {METHODS.map((item) => (
                  <option key={item} value={item}>
                    {methodLabel(item)}
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

export function PatientFinancialTabActions({ patientId }: { patientId: string }) {
  void patientId;
  return null;
}

const METRIC_TONE = {
  primary: "bg-brand-50 text-primary",
  success: "bg-[var(--success-surface)] text-[var(--success-foreground)]",
  info: "bg-[var(--info-surface)] text-[var(--info-foreground)]",
  warning: "bg-[var(--warning-surface)] text-[var(--warning-foreground)]",
  danger: "bg-destructive/10 text-destructive",
} as const;

const METRIC_VALUE_TONE = {
  primary: "text-primary",
  success: "text-[var(--success-foreground)]",
  info: "text-[var(--info-foreground)]",
  warning: "text-[var(--warning-foreground)]",
  danger: "text-destructive",
} as const;

function Metric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof METRIC_TONE;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${METRIC_TONE[tone]}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-0.5 truncate text-[17px] font-semibold tracking-[-0.02em] ${METRIC_VALUE_TONE[tone]}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
