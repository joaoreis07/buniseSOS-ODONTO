export function financeStatusLabel(status: string): string {
  return (
    {
      PAID: "Pago",
      SETTLED: "Quitado",
      OPEN: "Aberto",
      OVERDUE: "Atrasado",
      PARTIALLY_PAID: "Aberto",
      PENDING: "Pendente",
      CANCELLED: "Cancelado",
    } as Record<string, string>
  )[status] ?? status;
}

export function financeStatusTone(status: string): string {
  return (
    {
      PAID: "status-success",
      SETTLED: "status-success",
      OPEN: "status-warning",
      OVERDUE: "status-danger",
      PARTIALLY_PAID: "status-warning",
      PENDING: "status-warning",
      CANCELLED: "status-neutral",
    } as Record<string, string>
  )[status] ?? "status-neutral";
}

export function paymentMethodLabel(method: string | null | undefined): string {
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

export function financeEventLabel(type: string): string {
  return (
    {
      RECEIVABLE_CREATED: "Lançamento criado",
      INSTALLMENTS_CREATED: "Parcelas geradas",
      PAYMENT_REGISTERED: "Pagamento registrado",
      INSTALLMENT_CANCELLED: "Parcela cancelada",
      RECEIVABLE_CANCELLED: "Lançamento cancelado",
    } as Record<string, string>
  )[type] ?? type.replaceAll("_", " ").toLowerCase();
}

export const moneyBrl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatFinanceDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
