import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Printer,
  Settings2,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import type { Plan } from "@prisma/client";
import { PLAN_LABELS } from "@/modules/app-shell/labels";
import { PageHeader } from "@/shared/components/page-header";

const GROUPS = [
  {
    href: "#clinica",
    icon: Building2,
    title: "Clínica",
    description: "Dados cadastrais, identidade e informações da empresa.",
  },
  {
    href: "#usuarios",
    icon: Users,
    title: "Usuários",
    description: "Permissões e acessos da equipe. RBAC já está ativo no backend.",
  },
  {
    href: "#procedimentos",
    icon: Stethoscope,
    title: "Procedimentos",
    description: "Catálogo clínico usado no odontograma, plano e orçamento.",
  },
  {
    href: "#convenios",
    icon: Shield,
    title: "Convênios",
    description: "Planos e convênios vinculados aos pacientes.",
  },
  {
    href: "#financeiro",
    icon: CreditCard,
    title: "Financeiro",
    description: "Formas de pagamento e preferências de recebimento.",
  },
  {
    href: "#impressoes",
    icon: Printer,
    title: "Impressões",
    description: "Modelos de documentos e impressão. Em construção.",
  },
  {
    href: "/app/agenda",
    icon: CalendarDays,
    title: "Agenda",
    description: "Horários, profissionais e salas da clínica.",
  },
  {
    href: "#sistema",
    icon: Settings2,
    title: "Sistema",
    description: "Preferências gerais do BusinessOS Odonto.",
  },
] as const;

export function SettingsView({
  companyName,
  plan,
  canManage,
}: {
  companyName: string;
  plan: Plan;
  canManage: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Organize a clínica por grupos. Itens sem editor próprio mostram o estado atual, sem dados fictícios."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          const inner = (
            <>
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{group.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{group.description}</span>
              </span>
            </>
          );
          const className = "surface-card flex items-start gap-4 p-5 text-left transition hover:border-brand-200";
          return group.href.startsWith("/") ? (
            <Link key={group.title} href={group.href} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={group.title} id={group.href.slice(1)} className={className}>
              {inner}
            </div>
          );
        })}
      </section>

      <section id="clinica" className="surface-card p-5">
        <h3 className="font-semibold">Clínica</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Nome</dt>
            <dd className="mt-1 text-sm font-medium">{companyName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Plano</dt>
            <dd className="mt-1 text-sm font-medium">{PLAN_LABELS[plan]}</dd>
          </div>
        </dl>
        {!canManage ? (
          <p className="mt-4 text-sm text-muted-foreground">Você pode visualizar, mas não alterar configurações.</p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            O editor cadastral da clínica será liberado nas próximas etapas. Multi-tenant e plano já estão ativos.
          </p>
        )}
      </section>
    </div>
  );
}
