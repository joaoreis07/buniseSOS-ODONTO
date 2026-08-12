import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Users,
  Wallet,
} from "lucide-react";
import { getFirstName } from "@/shared/lib/session";
import { Button } from "@/shared/components/ui/button";

const NEXT_MODULES = [
  {
    title: "Agenda",
    description: "Hub operacional da clínica — dia, semana e mês.",
    icon: CalendarDays,
  },
  {
    title: "Pacientes",
    description: "Cadastro completo, anamnese e histórico clínico.",
    icon: Users,
  },
  {
    title: "Orçamentos",
    description: "Procedimentos, dentes e aprovação comercial.",
    icon: FileText,
  },
  {
    title: "Financeiro",
    description: "Parcelas ligadas a tratamento e paciente.",
    icon: Wallet,
  },
] as const;

export function DashboardOverview({
  userName,
  companyName,
  role,
}: {
  userName: string | null;
  companyName: string;
  role: string;
}) {
  const firstName = getFirstName(userName);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Olá, {firstName}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Foundation pronta para {companyName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Shell, autenticação, multi-tenant, RBAC, tema e command palette estão ativos.
          Os módulos clínicos serão liberados etapa a etapa — começando pela Agenda.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            Role: {role}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Auth ativa
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Tenant isolado
          </span>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.02em]">Próximos módulos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Visíveis na navegação, ainda não implementados nesta etapa.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/app/settings">
              Configurações
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEXT_MODULES.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-brand-200"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-muted/40 p-6">
        <p className="text-sm font-medium">Atalhos</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px]">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px]">
              K
            </kbd>{" "}
            abre a command palette
          </li>
          <li>Use o ícone de lua/sol no header para alternar tema claro/escuro</li>
          <li>Conta demo: admin@odonto.demo / Demo@123456</li>
        </ul>
      </section>
    </div>
  );
}
