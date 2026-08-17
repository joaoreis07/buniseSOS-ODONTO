import type { PaymentReceiptDTO } from "../services/finance.service";
import { PrintReceiptButton } from "./print-receipt-button";
import { moneyBrl, paymentMethodLabel } from "../utils/finance-status";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function clinicLine(clinic: PaymentReceiptDTO["clinic"]) {
  const parts = [
    clinic.address,
    [clinic.city, clinic.state].filter(Boolean).join("/"),
    clinic.zipCode,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function ReceiptDocument({
  receipt,
  showActions = false,
}: {
  receipt: PaymentReceiptDTO;
  showActions?: boolean;
}) {
  return (
    <article className="bos-receipt mx-auto w-full max-w-[720px] bg-white p-8 text-zinc-900 print:max-w-none print:p-0">
      <header className="border-b border-zinc-200 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0066ff]">
              BusinessOS Odonto
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Recibo {receipt.number}</h1>
            <p className="mt-2 text-base font-medium">{receipt.clinic.name}</p>
            {clinicLine(receipt.clinic) ? (
              <p className="text-sm text-zinc-600">{clinicLine(receipt.clinic)}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-zinc-600">
              {receipt.clinic.phone ? <span>{receipt.clinic.phone}</span> : null}
              {receipt.clinic.cnpj ? <span>CNPJ {receipt.clinic.cnpj}</span> : null}
            </div>
          </div>
          <div className="text-right text-sm text-zinc-600">
            <p className="font-medium text-zinc-900">{dateFmt.format(new Date(receipt.paidAt))}</p>
            {receipt.receivableCode ? <p className="mt-1">{receipt.receivableCode}</p> : null}
          </div>
        </div>
      </header>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Paciente</dt>
          <dd className="mt-1 text-base font-semibold">{receipt.patient.name}</dd>
          {receipt.patient.cpf ? (
            <dd className="text-sm text-zinc-600">CPF {receipt.patient.cpf}</dd>
          ) : null}
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Pagamento</dt>
          <dd className="mt-1 font-medium">{receipt.description}</dd>
          <dd className="text-sm text-zinc-600">Identificação {receipt.number}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Valor</dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight text-[#0066ff]">
            {moneyBrl.format(Number(receipt.amount))}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Forma de pagamento</dt>
          <dd className="mt-1 font-medium">
            {paymentMethodLabel(receipt.method)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Data</dt>
          <dd className="mt-1 font-medium">{dateFmt.format(new Date(receipt.paidAt))}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Registrado por</dt>
          <dd className="mt-1 font-medium">{receipt.registeredByName ?? "—"}</dd>
        </div>
      </dl>

      <p className="mt-8 text-sm leading-6 text-zinc-600">
        Recebemos de {receipt.patient.name} a importância de {moneyBrl.format(Number(receipt.amount))}{" "}
        referente ao pagamento associado acima.
      </p>

      {receipt.notes?.trim() ? (
        <section className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Observações</p>
          <p className="mt-1 text-sm text-zinc-700">{receipt.notes}</p>
        </section>
      ) : null}

      {showActions ? <PrintReceiptButton /> : null}
    </article>
  );
}
