"use client";

import { Button } from "@/shared/components/ui/button";

export function PrintReceiptButton() {
  return (
    <div className="bos-no-print mt-6 flex flex-wrap gap-2 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        Imprimir / Gerar PDF
      </Button>
    </div>
  );
}
