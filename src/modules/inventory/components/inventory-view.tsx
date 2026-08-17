"use client";

import { Package } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";

export function InventoryView() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Estoque"
        description="Materiais, medicamentos e instrumentos. O controle de estoque ainda não possui backend neste produto."
      />
      <div className="flex flex-wrap gap-2">
        {["Todos", "Materiais", "Medicamentos", "Instrumentos"].map((label, index) => (
          <span
            key={label}
            className={`rounded-lg px-3 py-1.5 text-sm ${index === 0 ? "bg-muted font-medium" : "text-muted-foreground"}`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Estoque</th>
              <th className="px-4 py-3 font-medium">Mínimo</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
        </table>
        <EmptyState
          icon={Package}
          title="Estoque ainda não disponível"
          description="Nenhum item é inventado. Quando o módulo for implementado, materiais, medicamentos e instrumentos aparecerão nesta tabela."
        />
      </div>
    </div>
  );
}
