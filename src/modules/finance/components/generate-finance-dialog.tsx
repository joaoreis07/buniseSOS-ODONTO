"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { generateFinanceFromBudgetAction } from "../actions/finance.actions";
import { previewInstallments } from "../utils/installment-preview";
import { formatFinanceDate, moneyBrl } from "../utils/finance-status";

export function GenerateFinanceDialog({
  budgetId,
  total,
  patientId,
}: {
  budgetId: string;
  total: number;
  patientId: string;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [entry, setEntry] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, start] = useTransition();
  const preview =
    entry <= total && count > 0 ? previewInstallments(total, count, entry, date) : [];

  const confirm = () =>
    start(async () => {
      const result = await generateFinanceFromBudgetAction({
        budgetId,
        installmentCount: count,
        entryAmount: entry,
        paymentMethod: "PIX",
        firstDueDate: new Date(date).toISOString(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      window.location.href = `/app/patients/${patientId}?tab=financeiro`;
    });

  const totalLabel = useMemo(() => moneyBrl.format(total), [total]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Gerar financeiro
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar financeiro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Valor aprovado: {totalLabel}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm">
              <Label htmlFor="fin-count">Parcelas</Label>
              <Input
                id="fin-count"
                type="number"
                min="1"
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <Label htmlFor="fin-entry">Entrada</Label>
              <Input
                id="fin-entry"
                type="number"
                min="0"
                value={entry}
                onChange={(event) => setEntry(Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <Label htmlFor="fin-due">1º vencimento</Label>
              <Input
                id="fin-due"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            {entry > 0 ? <p>Entrada — {moneyBrl.format(entry)}</p> : null}
            {preview.map((item) => (
              <p key={item.sequence} className="text-muted-foreground">
                {item.sequence}/{count} — {moneyBrl.format(item.amount)} —{" "}
                {formatFinanceDate(item.dueDate.toISOString())}
              </p>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={pending || !preview.length} onClick={confirm}>
              {pending ? "Gerando..." : "Confirmar geração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
