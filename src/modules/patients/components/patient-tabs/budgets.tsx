"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { listBudgetsAction } from "@/modules/budgets/actions/budget.actions";
import type { BudgetDTO } from "@/modules/budgets/dto/budget.dto";
import type { PatientClientDTO } from "../../dto/patient.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function PatientBudgetsTab({ patient, canManage }: { patient: PatientClientDTO; canManage: boolean }) {
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void listBudgetsAction({ patientId: patient.id }).then((result) => { if (result.success) setBudgets(result.data); setLoading(false); }); }, [patient.id]);
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><div><p className="font-medium">Orçamentos</p><p className="text-sm text-muted-foreground">Propostas e decisões comerciais.</p></div>{canManage && <Button asChild size="sm" className="rounded-lg"><Link href={`/app/budgets?patientId=${patient.id}`}><FilePlus2 className="mr-1 size-3.5" />Novo orçamento</Link></Button>}</div>
    {loading ? <p className="text-sm text-muted-foreground">Carregando orçamentos...</p> : budgets.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nenhum orçamento registrado.</div> : budgets.map((budget) => <Link key={budget.id} href={`/app/budgets?patientId=${patient.id}`} className="block rounded-xl border p-3 hover:bg-muted/50"><div className="flex justify-between gap-2"><span className="font-medium">{budget.title}</span><span className="font-semibold">{money.format(Number(budget.total))}</span></div><p className="mt-1 text-xs text-muted-foreground">{budget.code} · {budget.status}</p></Link>)}
  </div>;
}
