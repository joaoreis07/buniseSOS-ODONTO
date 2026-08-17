"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Printer, Receipt } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  getPaymentReceiptAction,
  listPatientReceiptsAction,
} from "@/modules/finance/actions/finance.actions";
import { ReceiptDocument } from "@/modules/finance/components/receipt-document";
import type { PatientReceiptDTO, PaymentReceiptDTO } from "@/modules/finance/services/finance.service";
import {
  formatFinanceDate,
  moneyBrl,
  paymentMethodLabel,
} from "@/modules/finance/utils/finance-status";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientReceiptsTab({
  patient,
  canView,
  highlightPaymentId,
}: {
  patient: PatientClientDTO;
  canView: boolean;
  highlightPaymentId?: string | null;
}) {
  const [rows, setRows] = useState<PatientReceiptDTO[]>();
  const [selected, setSelected] = useState<PaymentReceiptDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openedHighlight = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    const result = await listPatientReceiptsAction({ patientId: patient.id });
    if (result.success) {
      setRows(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [canView, patient.id]);

  const openReceipt = useCallback(async (paymentId: string) => {
    const result = await getPaymentReceiptAction({ paymentId });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSelected(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!highlightPaymentId || !rows?.length) return;
    if (openedHighlight.current === highlightPaymentId) return;
    const match = rows.find((row) => row.paymentId === highlightPaymentId);
    if (!match) return;
    openedHighlight.current = highlightPaymentId;
    void openReceipt(match.paymentId);
  }, [highlightPaymentId, openReceipt, rows]);

  function printReceipt(paymentId: string) {
    window.open(`/recibo/${paymentId}`, "_blank", "noopener,noreferrer");
  }

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">
        Você não tem permissão para visualizar os recibos deste paciente.
      </p>
    );
  }

  if (!rows) {
    return <p className="text-sm text-muted-foreground">Carregando recibos...</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium text-foreground">Recibos</p>
        <p className="text-sm text-muted-foreground">
          Comprovantes gerados a partir dos pagamentos registrados no financeiro deste paciente.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhum recibo emitido"
          description="Os recibos aparecem automaticamente após o registro de um pagamento."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Número</th>
                  <th className="px-3 py-2 font-medium">Pagamento</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Forma</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.paymentId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">{row.number}</td>
                    <td className="px-3 py-2">{row.description}</td>
                    <td className="px-3 py-2 text-right font-medium text-[var(--success-foreground)]">
                      {moneyBrl.format(Number(row.amount))}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatFinanceDate(row.paidAt)}
                    </td>
                    <td className="px-3 py-2">{paymentMethodLabel(row.method)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Visualizar"
                          onClick={() => void openReceipt(row.paymentId)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Imprimir"
                          onClick={() => printReceipt(row.paymentId)}
                        >
                          <Printer className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => printReceipt(row.paymentId)}
                        >
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl print:border-0 print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Recibo {selected?.number}</DialogTitle>
          </DialogHeader>
          {selected ? <ReceiptDocument receipt={selected} /> : null}
          <DialogFooter className="print:hidden">
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>
              Fechar
            </Button>
            {selected ? (
              <Button type="button" onClick={() => printReceipt(selected.paymentId)}>
                <Printer className="size-3.5" />
                Imprimir / Gerar PDF
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
