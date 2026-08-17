import { ReceiptDocument } from "@/modules/finance/components/receipt-document";
import { getPaymentReceipt } from "@/modules/finance/services/finance.service";
import { requirePermission } from "@/shared/lib/session";

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const user = await requirePermission("finance:view");
  const { paymentId } = await params;
  const receipt = await getPaymentReceipt(user.companyId, paymentId);

  return (
    <main className="bos-receipt-page min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 print:bg-white print:p-0">
      <ReceiptDocument receipt={receipt} showActions />
    </main>
  );
}
