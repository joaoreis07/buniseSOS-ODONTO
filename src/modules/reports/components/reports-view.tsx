import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Package,
  Settings2,
  Smile,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import type { DashboardOverviewDTO } from "@/modules/dashboard/dto/dashboard.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CARDS = [
  { href: "/app/finance", icon: Wallet, title: "Financeiro", description: "Recebimentos, saldo e parcelas." },
  { href: "/app/odontogram", icon: Smile, title: "Produção", description: "Procedimentos clínicos registrados." },
  { href: "/app/patients", icon: Users, title: "Pacientes", description: "Base cadastral da clínica." },
  { href: "/app/agenda", icon: CalendarDays, title: "Agenda", description: "Consultas do dia e da semana." },
  { href: "/app/treatment-plans", icon: ClipboardList, title: "Tratamentos", description: "Planos e progresso clínico." },
  { href: "/app/finance", icon: FileText, title: "Recebimentos", description: "Valores efetivamente pagos." },
  { href: "/app/inventory", icon: Package, title: "Estoque", description: "Materiais e instrumentos." },
  { href: "/app/settings", icon: Settings2, title: "Personalizado", description: "Relatórios avançados em construção." },
] as const;

export function ReportsView({ data }: { data: DashboardOverviewDTO }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Indicadores com dados reais da clínica. Métricas sem backend não são inventadas."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Pacientes" value={data.kpis.patients == null ? "—" : String(data.kpis.patients)} />
        <Kpi label="Consultas hoje" value={data.kpis.appointmentsToday == null ? "—" : String(data.kpis.appointmentsToday)} />
        <Kpi label="Orçamentos abertos" value={data.kpis.openBudgets == null ? "—" : String(data.kpis.openBudgets)} />
        <Kpi
          label="Recebido no mês"
          value={data.kpis.monthlyReceived == null ? "—" : money.format(Number(data.kpis.monthlyReceived))}
        />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="surface-card flex items-start gap-4 p-5 transition hover:border-brand-200">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{card.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{card.description}</span>
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
