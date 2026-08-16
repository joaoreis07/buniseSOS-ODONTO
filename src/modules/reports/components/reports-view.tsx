import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import type { DashboardOverviewDTO } from "@/modules/dashboard/dto/dashboard.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ReportsView({ data }: { data: DashboardOverviewDTO }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Acompanhe os principais indicadores da sua clínica."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Pacientes" value={data.kpis.patients == null ? "—" : String(data.kpis.patients)} />
        <Kpi
          label="Consultas hoje"
          value={data.kpis.appointmentsToday == null ? "—" : String(data.kpis.appointmentsToday)}
        />
        <Kpi
          label="Orçamentos abertos"
          value={data.kpis.openBudgets == null ? "—" : String(data.kpis.openBudgets)}
        />
        <Kpi
          label="Recebido no mês"
          value={data.kpis.monthlyReceived == null ? "—" : money.format(Number(data.kpis.monthlyReceived))}
        />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ReportCard
          href="/app/patients"
          icon={Users}
          title="Pacientes"
          description="Base cadastral e status da carteira."
        />
        <ReportCard
          href="/app/agenda"
          icon={CalendarDays}
          title="Agenda"
          description="Consultas do dia e da semana."
        />
        <ReportCard
          href="/app/patients"
          icon={ClipboardList}
          title="Tratamentos"
          description="Planos e progresso no contexto do paciente."
        />
        <ReportCard
          href="/app/patients"
          icon={FileText}
          title="Orçamentos"
          description="Propostas abertas e aprovadas."
        />
        <ReportCard
          href="/app/reports"
          icon={Wallet}
          title="Financeiro"
          description="Recebimentos, saldo e pendências."
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="font-semibold">Consultas da semana</h3>
          <div className="mt-4 space-y-3">
            {data.weekAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta na semana.</p>
            ) : (
              data.weekAppointments.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.patientName}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" }).format(
                      new Date(item.startsAt),
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="surface-card p-5">
          <h3 className="font-semibold">Top procedimentos</h3>
          <div className="mt-4 space-y-3">
            {data.topProcedures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum procedimento registrado.</p>
            ) : (
              data.topProcedures.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {index + 1}. {item.name}
                  </span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
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

function ReportCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="surface-card flex items-start gap-4 p-5 transition hover:border-primary/40">
      <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}
