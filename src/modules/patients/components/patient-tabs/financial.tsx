"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { getFinanceDashboardAction } from "@/modules/finance/actions/finance.actions";
import type { PatientClientDTO } from "../../dto/patient.dto";

export function PatientFinancialTab({ patient }: { patient: PatientClientDTO }) {
  const [summary, setSummary] = useState<{ total: string; received: string; balance: string; overdue: string; nextDue: { dueDate: string; balance: string } | null }>();
  useEffect(() => { void getFinanceDashboardAction({ patientId: patient.id }).then((result) => { if (result.success) setSummary(result.data.summary); }); }, [patient.id]);
  const money = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div><p className="font-medium">Financeiro</p><p className="text-sm text-muted-foreground">Resumo de recebíveis e pagamentos.</p></div><Button asChild size="sm" variant="outline" className="rounded-lg"><Link href={`/app/finance?patientId=${patient.id}`}>Abrir financeiro</Link></Button></div>
    {!summary ? <p className="text-sm text-muted-foreground">Carregando situação financeira...</p> : <><div className="grid grid-cols-2 gap-2 text-sm"><Metric label="Contratado" value={money(summary.total)} /><Metric label="Recebido" value={money(summary.received)} /><Metric label="Em aberto" value={money(summary.balance)} /><Metric label="Vencido" value={money(summary.overdue)} /></div>{summary.nextDue ? <div className="rounded-xl bg-muted p-3 text-sm"><Wallet className="mr-1 inline size-4" />Próximo vencimento: {new Date(summary.nextDue.dueDate).toLocaleDateString("pt-BR")} · {money(summary.nextDue.balance)}</div> : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhuma parcela pendente.</p>}</>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }

export function PatientFinancialTabActions({ patientId }: { patientId: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="rounded-lg">
      <Link href={`/app/finance?patientId=${patientId}`}>Abrir financeiro</Link>
    </Button>
  );
}
