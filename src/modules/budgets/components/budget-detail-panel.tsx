"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  MoreVertical,
  Pencil,
  Printer,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { formatToothRefsCompact } from "@/modules/odontogram/utils/tooth-surfaces";
import { GenerateFinanceDialog } from "@/modules/finance/components/generate-finance-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { BudgetDTO } from "../dto/budget.dto";
import {
  approveBudgetAction,
  cancelBudgetAction,
  rejectBudgetAction,
  sendBudgetAction,
} from "../actions/budget.actions";
import {
  budgetEventLabel,
  budgetProfessionalName,
  budgetStatusHint,
  budgetStatusLabel,
  budgetStatusTone,
  formatBudgetDateTime,
  moneyBrl,
} from "../utils/budget-status";

export function BudgetDetailPanel({
  budget,
  professionals,
  canManage,
  canApprove,
  canManageFinance,
  onBack,
  onEdit,
  onChanged,
}: {
  budget: BudgetDTO;
  professionals: { id: string; name: string }[];
  canManage: boolean;
  canApprove?: boolean;
  canManageFinance?: boolean;
  onBack: () => void;
  onEdit?: () => void;
  onChanged: (next?: BudgetDTO) => void;
}) {
  const [pending, start] = useTransition();
  const professional = budgetProfessionalName(budget, professionals);
  const canSend = canManage && budget.status === "DRAFT";
  const canApproveNow = Boolean(canApprove && budget.status === "SENT");
  const canReject = canApproveNow;
  const canCancel = canManage && !["CANCELED", "COMPLETED", "REJECTED"].includes(budget.status);
  const canGenerateFinance =
    Boolean(canManage && canManageFinance) &&
    !budget.receivableId &&
    (budget.status === "APPROVED" || budget.status === "PARTIALLY_APPROVED");

  function runTransition(
    action: typeof sendBudgetAction,
    successFallback: string,
  ) {
    start(async () => {
      const result = await action({ id: budget.id, expectedUpdatedAt: budget.updatedAt });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? successFallback);
      onChanged(result.data);
    });
  }

  return (
    <div className="space-y-4">
      <header className="surface-card flex flex-wrap items-center gap-2 px-3 py-2.5">
        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Voltar" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
              Orçamento {budget.code}
            </h2>
            <span className={`status-pill ${budgetStatusTone(budget.status)}`}>
              {budgetStatusLabel(budget.status)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {budget.patient.name} · {formatBudgetDateTime(budget.createdAt)} · {professional}
            {budget.priceTable ? ` · ${budget.priceTable.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {canSend ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => runTransition(sendBudgetAction, "Orçamento enviado")}
            >
              <Send className="size-3.5" />
              Enviar orçamento
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            Imprimir
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5">
                <MoreVertical className="size-3.5" />
                Mais
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canSend && onEdit ? (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-3.5" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="size-3.5" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Salve uma cópia pelo editor após duplicar.")}>
                <Copy className="size-3.5" />
                Duplicar
              </DropdownMenuItem>
              {canReject ? (
                <DropdownMenuItem onClick={() => runTransition(rejectBudgetAction, "Orçamento recusado")}>
                  Recusar
                </DropdownMenuItem>
              ) : null}
              {canCancel ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => runTransition(cancelBudgetAction, "Orçamento cancelado")}
                  >
                    Cancelar orçamento
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h3 className="text-sm font-semibold text-foreground">Procedimentos</h3>
              <span className="text-xs text-muted-foreground">{budget.items.length} item(ns)</span>
            </div>
            {budget.items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum procedimento neste orçamento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Procedimento</th>
                      <th className="px-3 py-2 font-medium">Dente/Face</th>
                      <th className="px-3 py-2 font-medium">Qtd</th>
                      <th className="px-3 py-2 font-medium">Unitário</th>
                      <th className="px-3 py-2 font-medium">Desc.</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground">
                          {item.code ? `${item.code} · ` : ""}
                          {item.description}
                          {item.notes ? (
                            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{item.notes}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">
                          {item.teeth.length ? formatToothRefsCompact(item.teeth) : "—"}
                        </td>
                        <td className="px-3 py-2 text-foreground">{Number(item.quantity)}</td>
                        <td className="px-3 py-2 text-foreground">{moneyBrl.format(Number(item.unitPrice))}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {Number(item.discount) > 0 ? moneyBrl.format(Number(item.discount)) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">
                          {moneyBrl.format(Number(item.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="surface-card p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Observações</h3>
            </div>
            <p className="text-sm text-muted-foreground">{budget.notes?.trim() || "Nenhuma observação registrada."}</p>
          </section>
        </div>

        <aside className="space-y-3">
          <section className="surface-card p-3.5">
            <h3 className="text-sm font-semibold text-foreground">Resumo do orçamento</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">{moneyBrl.format(Number(budget.subtotal))}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd className="font-medium text-[var(--success-foreground)]">
                  {Number(budget.discount) > 0 ? `− ${moneyBrl.format(Number(budget.discount))}` : moneyBrl.format(0)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="text-xl font-semibold tracking-[-0.03em] text-primary">
                  {moneyBrl.format(Number(budget.total))}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Validade não cadastrada · {budget.priceTable?.name ?? "Particular"}
            </p>
          </section>

          <section className="surface-card p-3">
            <h3 className="text-sm font-semibold text-foreground">Pagamento</h3>
            {budget.receivableId ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">Financeiro gerado a partir deste orçamento.</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/app/patients/${budget.patient.id}?tab=financeiro`}>Ver financeiro</Link>
                </Button>
              </div>
            ) : canGenerateFinance ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">Ainda não há condição financeira vinculada.</p>
                <GenerateFinanceDialog
                  budgetId={budget.id}
                  total={Number(budget.total)}
                  patientId={budget.patient.id}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                A forma de pagamento é definida no financeiro após a aprovação.
              </p>
            )}
          </section>

          <section className="surface-card p-3">
            <h3 className="text-sm font-semibold text-foreground">Status</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className={`status-pill ${budgetStatusTone(budget.status)}`}>
                {budgetStatusLabel(budget.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{budgetStatusHint(budget.status)}</p>
            {canApproveNow ? (
              <Button
                type="button"
                className="mt-3 h-10 w-full"
                disabled={pending}
                onClick={() => runTransition(approveBudgetAction, "Orçamento aprovado")}
              >
                <Check className="size-3.5" />
                Marcar como aprovado
              </Button>
            ) : null}
          </section>

          <section className="surface-card p-3">
            <h3 className="text-sm font-semibold text-foreground">Histórico</h3>
            {budget.events.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Sem eventos registrados.</p>
            ) : (
              <ol className="mt-2 space-y-0">
                {budget.events.slice(0, 8).map((event, index, list) => (
                  <li key={event.id} className="relative flex gap-2.5 py-1.5 pl-1">
                    {index < list.length - 1 ? (
                      <span className="absolute left-[7px] top-6 bottom-0 w-px bg-border" />
                    ) : null}
                    <span className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{budgetEventLabel(event.type)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {event.actorName ?? "Sistema"} · {formatBudgetDateTime(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-3.5" />
          Imprimir orçamento
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast.info("Salve uma cópia pelo editor após duplicar.")}
        >
          <Copy className="size-3.5" />
          Duplicar orçamento
        </Button>
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={pending}
            onClick={() => runTransition(cancelBudgetAction, "Orçamento cancelado")}
          >
            Cancelar orçamento
          </Button>
        ) : null}
      </div>
    </div>
  );
}
