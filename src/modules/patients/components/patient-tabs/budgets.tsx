"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Eye, FilePlus2, Pencil, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  approveBudgetAction,
  getBudgetEditorDataAction,
  listBudgetsAction,
  sendBudgetAction,
} from "@/modules/budgets/actions/budget.actions";
import { BudgetDetailPanel } from "@/modules/budgets/components/budget-detail-panel";
import type { BudgetDTO } from "@/modules/budgets/dto/budget.dto";
import {
  budgetStatusLabel,
  budgetStatusTone,
  formatBudgetDate,
  moneyBrl,
} from "@/modules/budgets/utils/budget-status";
import type { PatientClientDTO } from "../../dto/patient.dto";

function proceduresOf(budget: BudgetDTO) {
  const names = budget.items.map((item) => item.description).filter(Boolean);
  if (names.length === 0) return "—";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function PatientBudgetsTab({
  patient,
  canManage,
  canApprove = false,
  canManageFinance = false,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
  canApprove?: boolean;
  canManageFinance?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("budgetId");
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();

  const load = useCallback(async () => {
    const [list, editor] = await Promise.all([
      listBudgetsAction({ patientId: patient.id }),
      getBudgetEditorDataAction(),
    ]);
    if (list.success) setBudgets(list.data);
    if (editor.success) setProfessionals(editor.data.professionals);
    setLoading(false);
  }, [patient.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function openBudget(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "orcamentos");
    if (id) params.set("budgetId", id);
    else params.delete("budgetId");
    router.replace(`/app/patients/${patient.id}?${params.toString()}`, { scroll: false });
  }

  function run(action: typeof sendBudgetAction, budget: BudgetDTO, success: string) {
    start(async () => {
      const result = await action({ id: budget.id, expectedUpdatedAt: budget.updatedAt });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? success);
      await load();
    });
  }

  const selected = selectedId ? budgets.find((budget) => budget.id === selectedId) ?? null : null;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando orçamentos...</p>;
  }

  if (selected) {
    return (
      <BudgetDetailPanel
        budget={selected}
        professionals={professionals}
        canManage={canManage}
        canApprove={canApprove}
        canManageFinance={canManageFinance}
        onBack={() => openBudget(null)}
        onEdit={
          selected.status === "DRAFT" && canManage
            ? () => {
                window.location.href = `/app/budgets?edit=${selected.id}`;
              }
            : undefined
        }
        onChanged={(next) => {
          void load();
          if (next && ["CANCELED", "REJECTED"].includes(next.status) === false) {
            openBudget(next.id);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Orçamentos</p>
          <p className="text-sm text-muted-foreground">Propostas e decisões comerciais deste paciente.</p>
        </div>
        {canManage ? (
          <Button asChild size="sm">
            <Link href={`/app/budgets?patientId=${patient.id}&new=1`}>
              <FilePlus2 className="size-3.5" />
              Novo orçamento
            </Link>
          </Button>
        ) : null}
      </div>
      {budgets.length === 0 ? (
        <div className="surface-card border-dashed p-5 text-sm text-muted-foreground">
          Nenhum orçamento registrado.
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Número</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Procedimentos</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Validade</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-left font-semibold text-foreground hover:text-primary"
                        onClick={() => openBudget(budget.id)}
                      >
                        {budget.code}
                      </button>
                      <p className="text-xs text-muted-foreground">{budget.title}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatBudgetDate(budget.createdAt)}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">
                      {proceduresOf(budget)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {moneyBrl.format(Number(budget.total))}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">Não informada</td>
                    <td className="px-3 py-2">
                      <span className={`status-pill ${budgetStatusTone(budget.status)}`}>
                        {budgetStatusLabel(budget.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Visualizar"
                          onClick={() => openBudget(budget.id)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        {canManage && budget.status === "DRAFT" ? (
                          <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Editar">
                            <Link href={`/app/budgets?edit=${budget.id}`}>
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                        ) : null}
                        {canManage && budget.status === "DRAFT" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Enviar"
                            disabled={pending}
                            onClick={() => run(sendBudgetAction, budget, "Orçamento enviado")}
                          >
                            <Send className="size-3.5" />
                          </Button>
                        ) : null}
                        {canApprove && budget.status === "SENT" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Aprovar"
                            disabled={pending}
                            onClick={() => run(approveBudgetAction, budget, "Orçamento aprovado")}
                          >
                            <Check className="size-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Imprimir"
                          onClick={() => {
                            openBudget(budget.id);
                            window.setTimeout(() => window.print(), 400);
                          }}
                        >
                          <Printer className="size-3.5" />
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
    </div>
  );
}
