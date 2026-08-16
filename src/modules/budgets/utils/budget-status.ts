import type { BudgetEventType } from "@prisma/client";
import type { BudgetDTO } from "../dto/budget.dto";

export function budgetStatusLabel(status: BudgetDTO["status"]): string {
  return {
    DRAFT: "Rascunho",
    SENT: "Aguardando aprovação",
    APPROVED: "Aprovado",
    PARTIALLY_APPROVED: "Parcialmente aprovado",
    REJECTED: "Rejeitado",
    CANCELED: "Cancelado",
    COMPLETED: "Concluído",
  }[status];
}

export function budgetStatusTone(status: BudgetDTO["status"]): string {
  return {
    DRAFT: "status-neutral",
    SENT: "status-warning",
    APPROVED: "status-success",
    PARTIALLY_APPROVED: "status-warning",
    REJECTED: "status-danger",
    CANCELED: "status-danger",
    COMPLETED: "status-success",
  }[status];
}

export function budgetStatusHint(status: BudgetDTO["status"]): string {
  return {
    DRAFT: "Ainda não enviado ao paciente.",
    SENT: "Aguardando retorno do paciente.",
    APPROVED: "Orçamento aprovado.",
    PARTIALLY_APPROVED: "Alguns itens foram aprovados.",
    REJECTED: "Orçamento recusado.",
    CANCELED: "Orçamento cancelado.",
    COMPLETED: "Tratamento concluído.",
  }[status];
}

export function budgetEventLabel(type: string): string {
  const labels: Record<BudgetEventType, string> = {
    CREATED: "Orçamento criado",
    UPDATED: "Orçamento atualizado",
    ITEM_ADDED: "Item adicionado",
    ITEM_UPDATED: "Item atualizado",
    ITEM_REMOVED: "Item removido",
    SENT: "Enviado",
    APPROVED: "Aprovado",
    PARTIALLY_APPROVED: "Aprovação parcial",
    REJECTED: "Rejeitado",
    CANCELED: "Cancelado",
    COMPLETED: "Concluído",
  };
  return labels[type as BudgetEventType] ?? type.replaceAll("_", " ").toLowerCase();
}

export function budgetProfessionalName(
  budget: BudgetDTO,
  professionals: { id: string; name: string }[],
): string {
  const ids = [...new Set(budget.items.map((item) => item.professionalId).filter(Boolean))] as string[];
  const names = ids
    .map((id) => professionals.find((pro) => pro.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  if (names.length) return names.join(", ");
  return budget.events.find((event) => event.type === "CREATED")?.actorName ?? "—";
}

export const moneyBrl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBudgetDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function formatBudgetDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
