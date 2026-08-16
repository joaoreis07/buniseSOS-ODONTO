"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Ban,
  FileText,
  MoreHorizontal,
  Pencil,
  Receipt,
  Trash2,
  Wallet,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  getFinanceDashboardAction,
  registerPaymentAction,
} from "@/modules/finance/actions/finance.actions";
import type { getFinanceDashboard } from "@/modules/finance/services/finance.service";
import type { PatientClientDTO } from "../../dto/patient.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const METHODS = ["PIX", "CASH", "CARD_CREDIT", "CARD_DEBIT", "BOLETO", "TRANSFER", "OTHER"] as const;

type FinanceData = Awaited<ReturnType<typeof getFinanceDashboard>>;
type Row = {
  receivableId: string;
  installmentId: string;
  launchedAt: string;
  description: string;
  amount: string;
  paid: string;
  balance: string;
  method: string | null;
  sequence: number;
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

  function reload() {
    void getFinanceDashboardAction({ patientId: patient.id }).then((result) => {
      if (result.success) setData(result.data);
    });
  }

  useEffect(() => {
    reload();
  }, [patient.id]);

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    return data.receivables.flatMap((receivable) =>
      receivable.installments.map((installment) => {
        const lastPayment = installment.payments[0];
        return {
          receivableId: receivable.id,
          installmentId: installment.id,
          launchedAt: installment.dueDate,
          description: `${receivable.title} · Parcela ${installment.sequence}`,
          amount: installment.amount,
          paid: installment.receivedAmount,
          balance: installment.balance,
          method: lastPayment?.method ?? null,
          sequence: installment.sequence,
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
          <p className="font-medium">Recibos</p>
          <p className="text-sm text-muted-foreground">Pagamentos já registrados deste paciente.</p>
        </div>
        {visible.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum recibo emitido ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor pago</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.installmentId}>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{money.format(Number(row.paid))}</TableCell>
                  <TableCell>{methodLabel(row.method)}</TableCell>
                  <TableCell>
                    {row.paidAt ? new Intl.DateTimeFormat("pt-BR").format(new Date(row.paidAt)) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">Financeiro</p>
          <p className="text-sm text-muted-foreground">Lançamentos, parcelas e saldo do paciente.</p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total do plano" value={money.format(Number(data.summary.total))} tone="text-primary" />
        <Metric label="Já realizado" value={money.format(Number(data.summary.received))} tone="text-success" />
        <Metric label="Em andamento" value={money.format(Number(inProgress))} tone="text-primary" />
        <Metric label="Pendentes" value={money.format(Number(data.summary.overdue))} tone="text-destructive" />
      </section>

      <div className="surface-card overflow-hidden">
        {visible.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum lançamento financeiro para este paciente.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lançamento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor a pagar</TableHead>
                <TableHead>Valor pago</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Forma pagto.</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                const canReceive = Number(row.balance) > 0 && row.status !== "CANCELLED";
                return (
                  <TableRow key={row.installmentId}>
                    <TableCell>
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(row.launchedAt))}
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{money.format(Number(row.amount))}</TableCell>
                    <TableCell>{money.format(Number(row.paid))}</TableCell>
                    <TableCell className={Number(row.balance) > 0 ? "text-destructive" : ""}>
                      {money.format(Number(row.balance))}
                    </TableCell>
                    <TableCell>{methodLabel(row.method)}</TableCell>
                    <TableCell>{row.sequence}</TableCell>
                    <TableCell>
                      {row.paidAt ? new Intl.DateTimeFormat("pt-BR").format(new Date(row.paidAt)) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-end border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">Saldo a pagar</span>
          <span className="ml-3 font-semibold text-destructive">
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
                className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
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

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export function PatientFinancialTabActions({ patientId }: { patientId: string }) {
  void patientId;
  return null;
}
