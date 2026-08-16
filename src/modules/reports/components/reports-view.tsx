"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CalendarDays, CircleDollarSign, TrendingDown, Wallet } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import { SectionCard } from "@/shared/components/section-card";
import { StatCard } from "@/shared/components/stat-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { cn } from "@/shared/lib/utils";
import type { DashboardOverviewDTO } from "@/modules/dashboard/dto/dashboard.dto";
import { getFinanceDashboardAction } from "@/modules/finance/actions/finance.actions";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR");

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "financeiro", label: "Financeiro" },
  { id: "atendimentos", label: "Atendimentos" },
  { id: "pacientes", label: "Pacientes" },
  { id: "procedimentos", label: "Procedimentos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReportsView({ data }: { data: DashboardOverviewDTO }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [finance, setFinance] = useState<{
    total: string;
    received: string;
    balance: string;
    overdue: string;
  } | null>(null);

  useEffect(() => {
    void getFinanceDashboardAction().then((result) => {
      if (result.success) setFinance(result.data.summary);
    });
  }, []);

  const receiptsConfig = {
    received: { label: "Recebimentos", color: "var(--primary)" },
  };
  const appointmentsConfig = {
    appointments: { label: "Consultas", color: "var(--chart-2)" },
  };

  const weekSeries = WEEKDAY_LABELS.map((label, index) => ({
    label,
    appointments: data.weekAppointments.filter(
      (item) => new Date(item.startsAt).getDay() === index,
    ).length,
  }));

  const totalProcedures = data.topProcedures.reduce((sum, item) => sum + item.count, 0);
  const hasReceipts = data.monthlySeries.some((point) => point.received > 0);
  const billed = finance?.total ?? data.kpis.monthlyReceived;
  const received = finance?.received ?? data.kpis.monthlyReceived;
  const toReceive = finance?.balance;
  const billedNumber = billed == null ? 0 : Number(billed);

  const showFinance = tab === "overview" || tab === "financeiro";
  const overview = tab === "overview";

  function share(value: string | null | undefined) {
    if (value == null || billedNumber <= 0) return null;
    return `${Math.round((Number(value) / billedNumber) * 100)}%`;
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Relatórios"
        description="Acompanhe os principais indicadores da sua clínica."
      />

      <nav className="surface-card flex flex-wrap gap-1 p-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition",
              tab === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {showFinance ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            size="compact"
            label="Faturamento bruto"
            value={billed == null ? "—" : money.format(Number(billed))}
            hint="Total gerado em recebíveis"
            icon={Wallet}
            tone="primary"
          />
          <StatCard
            size="compact"
            label="Recebimentos"
            value={received == null ? "—" : money.format(Number(received))}
            hint="Valores já confirmados"
            icon={CircleDollarSign}
            tone="success"
          />
          <StatCard
            size="compact"
            label="A receber"
            value={toReceive == null ? "—" : money.format(Number(toReceive))}
            hint={
              finance?.overdue && Number(finance.overdue) > 0
                ? `${money.format(Number(finance.overdue))} em atraso`
                : "Saldo em aberto"
            }
            icon={CalendarDays}
            tone="warning"
          />
          <StatCard
            size="compact"
            label="Despesas"
            value="—"
            hint="Não há módulo de despesas no sistema"
            icon={TrendingDown}
            tone="neutral"
          />
        </section>
      ) : null}

      {showFinance ? (
        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SectionCard
            title="Faturamento x Recebimentos"
            description="Últimos 6 meses, apenas valores confirmados."
          >
            {!hasReceipts ? (
              <p className="py-8 text-sm text-muted-foreground">
                Ainda não há recebimentos registrados no período.
              </p>
            ) : (
              <ChartContainer config={receiptsConfig} className="h-48 w-full">
                <AreaChart data={data.monthlySeries} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(value: number) =>
                      value >= 1000
                        ? `R$ ${(value / 1000).toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}k`
                        : `R$ ${value}`
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="received"
                    stroke="var(--color-received)"
                    strokeWidth={2}
                    fill="var(--color-received)"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Situação financeira"
            footerHref="/app/finance"
            footerLabel="Ver financeiro"
          >
            <ul className="space-y-2.5 text-sm">
              <FinanceRow
                label="Recebido"
                value={received == null ? "—" : money.format(Number(received))}
                share={share(received)}
                tone="bg-primary"
                valueClass="text-foreground"
              />
              <FinanceRow
                label="A receber"
                value={toReceive == null ? "—" : money.format(Number(toReceive))}
                share={share(toReceive)}
                tone="bg-[var(--warning-foreground)]"
                valueClass="text-[var(--warning-foreground)]"
              />
              <FinanceRow
                label="Atrasado"
                value={finance?.overdue == null ? "—" : money.format(Number(finance.overdue))}
                share={share(finance?.overdue)}
                tone="bg-destructive"
                valueClass="text-destructive"
              />
              <FinanceRow
                label="Despesas"
                value="—"
                share={null}
                tone="bg-muted-foreground/40"
                valueClass="text-muted-foreground"
              />
            </ul>
          </SectionCard>
        </section>
      ) : null}

      {overview ? (
        <section className="grid gap-3 lg:grid-cols-3">
          <ProceduresCard items={data.topProcedures} total={totalProcedures} />
          <AppointmentsChartCard
            series={weekSeries}
            total={data.weekAppointments.length}
            config={appointmentsConfig}
          />
          <AgendaCard appointments={data.weekAppointments} />
        </section>
      ) : null}

      {tab === "atendimentos" ? (
        <section className="grid gap-3 xl:grid-cols-2">
          <AppointmentsChartCard
            series={weekSeries}
            total={data.weekAppointments.length}
            config={appointmentsConfig}
          />
          <AgendaCard appointments={data.weekAppointments} />
        </section>
      ) : null}

      {tab === "procedimentos" ? (
        <ProceduresCard items={data.topProcedures} total={totalProcedures} />
      ) : null}

      {tab === "pacientes" ? (
        <SectionCard
          title="Pacientes recentes"
          description={
            data.kpis.patients == null
              ? "Atualizações mais recentes da base."
              : `${data.kpis.patients} paciente(s) na clínica.`
          }
          footerHref="/app/patients"
          footerLabel="Ver pacientes"
        >
          {data.recentPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {data.recentPatients.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/app/patients/${patient.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {patient.preferredName || patient.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {dateFmt.format(new Date(patient.updatedAt))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-primary" />
        Recebimentos do gráfico: últimos 6 meses. Consultas: semana atual. Indicadores financeiros:
        saldo atual da clínica.
      </p>
    </div>
  );
}

function FinanceRow({
  label,
  value,
  share,
  tone,
  valueClass,
}: {
  label: string;
  value: string;
  share: string | null;
  tone: string;
  valueClass: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className={`size-2 shrink-0 rounded-full ${tone}`} />
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        {share ? <span className="text-xs text-muted-foreground">{share}</span> : null}
        <span className={`font-semibold tabular-nums ${valueClass}`}>{value}</span>
      </span>
    </li>
  );
}

function ProceduresCard({
  items,
  total,
}: {
  items: DashboardOverviewDTO["topProcedures"];
  total: number;
}) {
  return (
    <SectionCard title="Top procedimentos" bodyPadding={false}>
      {items.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          Nenhum procedimento clínico registrado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-3 py-2 font-medium">Procedimento</th>
                <th className="px-3 py-2 text-right font-medium">Qtde</th>
                <th className="px-3 py-2 text-right font-medium">Participação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.name} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="grid size-5 shrink-0 place-items-center rounded-md bg-brand-50 text-[11px] font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{item.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                    {item.count}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {total > 0 ? `${Math.round((item.count / total) * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function AppointmentsChartCard({
  series,
  total,
  config,
}: {
  series: { label: string; appointments: number }[];
  total: number;
  config: { appointments: { label: string; color: string } };
}) {
  return (
    <SectionCard
      title="Consultas realizadas"
      description={`${total} consultas na semana.`}
      footerHref="/app/agenda"
      footerLabel="Ver agenda"
    >
      <ChartContainer config={config} className="h-44 w-full">
        <BarChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="appointments" fill="var(--color-appointments)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </SectionCard>
  );
}

function AgendaCard({
  appointments,
}: {
  appointments: DashboardOverviewDTO["weekAppointments"];
}) {
  return (
    <SectionCard
      title="Situação da agenda"
      description="Próximas consultas da semana."
      footerHref="/app/agenda"
      footerLabel="Ver agenda"
    >
      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma consulta na semana.</p>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {appointments.slice(0, 8).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.patientName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.procedure || "Consulta"} · {item.professionalName}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                }).format(new Date(item.startsAt))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
