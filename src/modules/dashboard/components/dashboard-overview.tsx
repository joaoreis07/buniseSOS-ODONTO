"use client";

import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { SectionCard } from "@/shared/components/section-card";
import { StatCard } from "@/shared/components/stat-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { cn } from "@/shared/lib/utils";
import { STATUS_META } from "@/modules/agenda/utils/agenda.utils";
import type { DashboardOverviewDTO } from "../dto/dashboard.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const WEEK_DAYS = [
  { label: "Seg", day: 1 },
  { label: "Ter", day: 2 },
  { label: "Qua", day: 3 },
  { label: "Qui", day: 4 },
  { label: "Sex", day: 5 },
  { label: "Sáb", day: 6 },
  { label: "Dom", day: 0 },
] as const;

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function mondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  next.setDate(next.getDate() + (day === 0 ? -6 : 1 - day));
  return next;
}

function relativeDay(iso: string) {
  const then = new Date(iso);
  const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const startToday = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  ).getTime();
  const diff = Math.round((startToday - startThen) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff === -1) return "Amanhã";
  if (diff > 1) return `${diff} dias`;
  return `em ${Math.abs(diff)} dias`;
}

function monthDelta(series: DashboardOverviewDTO["monthlySeries"]) {
  if (series.length < 2) return null;
  const current = series[series.length - 1]?.received ?? 0;
  const previous = series[series.length - 2]?.received ?? 0;
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function appointmentTone(status: string) {
  return STATUS_META[status as keyof typeof STATUS_META]?.tone ?? "status-neutral";
}

function appointmentLabel(status: string) {
  return STATUS_META[status as keyof typeof STATUS_META]?.label ?? status;
}

export function DashboardOverview({
  userName,
  data,
}: {
  userName: string | null;
  data: DashboardOverviewDTO;
}) {
  const firstName = userName?.trim().split(/\s+/)[0] || "usuário";
  const chartConfig = {
    received: { label: "Recebimentos", color: "var(--primary)" },
  };
  const weekStart = mondayOfCurrentWeek();
  const weekByDay = WEEK_DAYS.map((item, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      label: item.label,
      date: date.getDate(),
      count: data.weekAppointments.filter((row) => new Date(row.startsAt).getDay() === item.day)
        .length,
    };
  });
  const weekMax = Math.max(1, ...weekByDay.map((day) => day.count));
  const weekTotal = weekByDay.reduce((sum, day) => sum + day.count, 0);
  const procedureMax = Math.max(1, ...data.topProcedures.map((item) => item.count));
  const receivedDelta = monthDelta(data.monthlySeries);
  const financeSlices = data.financeSummary
    ? [
        {
          key: "received",
          name: "Recebido",
          value: Number(data.financeSummary.received),
          color: "#0066ff",
        },
        {
          key: "toReceive",
          name: "A receber",
          value: Number(data.financeSummary.toReceive),
          color: "#10b981",
        },
        {
          key: "overdue",
          name: "Atrasado",
          value: Number(data.financeSummary.overdue),
          color: "#ef4444",
        },
      ].filter((slice) => slice.value > 0)
    : [];
  const financeTotal = Number(data.financeSummary?.total ?? 0);
  const financeConfig = {
    received: { label: "Recebido", color: "#0066ff" },
    toReceive: { label: "A receber", color: "#10b981" },
    overdue: { label: "Atrasado", color: "#ef4444" },
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">
            Olá, {firstName} 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo de {data.companyName.trim()} hoje.
          </p>
        </div>
        <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground">
          <CalendarDays className="size-4 text-primary" />
          {todayLabel()}
        </span>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pacientes cadastrados"
          value={data.kpis.patients == null ? "—" : String(data.kpis.patients)}
          hint={
            data.kpis.patientsThisMonth
              ? <span className="text-primary">↑ {data.kpis.patientsThisMonth} este mês</span>
              : "Base ativa da clínica"
          }
          href={data.kpis.patients == null ? undefined : "/app/patients"}
          icon={Users}
          tone="primary"
          size="compact"
        />
        <StatCard
          label="Consultas hoje"
          value={data.kpis.appointmentsToday == null ? "—" : String(data.kpis.appointmentsToday)}
          hint={
            data.todayAppointments.length > 0
              ? `Próxima: ${formatTime(data.todayAppointments[0].startsAt)}`
              : "Nenhuma consulta hoje"
          }
          href={data.kpis.appointmentsToday == null ? undefined : "/app/agenda"}
          icon={CalendarDays}
          tone="info"
          size="compact"
        />
        <StatCard
          label="Orçamentos ativos"
          value={data.kpis.openBudgets == null ? "—" : String(data.kpis.openBudgets)}
          hint={
            data.kpis.openBudgetsTotal != null
              ? `Total: ${money.format(Number(data.kpis.openBudgetsTotal))}`
              : "Aguardando aprovação"
          }
          href={data.kpis.openBudgets == null ? undefined : "/app/budgets"}
          icon={FileText}
          tone="warning"
          size="compact"
        />
        <StatCard
          label="Recebimentos do mês"
          value={
            data.kpis.monthlyReceived == null
              ? "—"
              : money.format(Number(data.kpis.monthlyReceived))
          }
          hint={
            receivedDelta == null ? (
              "Valores já recebidos"
            ) : receivedDelta >= 0 ? (
              <span className="text-primary">↑ {receivedDelta}% vs mês passado</span>
            ) : (
              <span className="text-warning">↓ {Math.abs(receivedDelta)}% vs mês passado</span>
            )
          }
          href={data.kpis.monthlyReceived == null ? undefined : "/app/finance"}
          icon={Wallet}
          tone="success"
          size="compact"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Recebimentos"
          description="Valores realmente recebidos nos últimos 6 meses."
          action={
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              6 meses
            </span>
          }
        >
          {data.kpis.monthlyReceived == null ? (
            <p className="py-10 text-sm text-muted-foreground">
              Sem permissão para visualizar recebimentos.
            </p>
          ) : data.monthlySeries.every((point) => point.received === 0) ? (
            <p className="py-10 text-sm text-muted-foreground">
              Ainda não há recebimentos registrados.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-52 w-full">
              <AreaChart data={data.monthlySeries} margin={{ left: 4, right: 16, top: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  className="text-xs"
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

        <SectionCard title="Top procedimentos">
          {data.topProcedures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum procedimento registrado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {data.topProcedures.map((item, index) => (
                <li key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm text-foreground">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {item.count}
                    </span>
                  </div>
                  <span className="block h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((item.count / procedureMax) * 100)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Consultas da semana" description={`${weekTotal} no total`}>
          <ul className="space-y-2">
            {weekByDay.map((day) => (
              <li key={day.label} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-sm text-muted-foreground">
                  {day.label} {String(day.date).padStart(2, "0")}
                </span>
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary/80"
                    style={{ width: `${Math.round((day.count / weekMax) * 100)}%` }}
                  />
                </span>
                <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                  {day.count}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <SectionCard
          title="Agenda de hoje"
          footerHref={data.kpis.appointmentsToday == null ? undefined : "/app/agenda"}
          footerLabel="Ver agenda completa"
        >
          {data.todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <ul className="-mx-1 space-y-0.5">
              {data.todayAppointments.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/app/agenda"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                  >
                    <span className="w-11 shrink-0 text-sm font-semibold tabular-nums text-primary">
                      {formatTime(item.startsAt)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.patientName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.procedure || "Consulta"} · {item.professionalName}
                      </span>
                    </span>
                    <span className={cn("status-pill", appointmentTone(item.status))}>
                      {appointmentLabel(item.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Resumo financeiro (mês)"
          footerHref={data.financeSummary ? "/app/finance" : undefined}
          footerLabel="Ver detalhes financeiros"
        >
          {data.financeSummary == null ? (
            <p className="text-sm text-muted-foreground">
              Sem permissão para visualizar o financeiro.
            </p>
          ) : financeTotal <= 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento financeiro ainda.</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative mx-auto size-[148px] shrink-0">
                <ChartContainer
                  config={financeConfig}
                  className="aspect-square !aspect-square size-[148px]"
                >
                  <PieChart>
                    <Pie
                      data={financeSlices}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={66}
                      strokeWidth={0}
                    >
                      {financeSlices.map((slice) => (
                        <Cell key={slice.key} fill={slice.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent hideLabel />}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <p className="text-[13px] font-semibold tabular-nums text-foreground">
                      {money.format(financeTotal)}
                    </p>
                  </div>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-2.5">
                {[
                  {
                    label: "Recebido",
                    value: data.financeSummary.received,
                    tone: "bg-primary",
                  },
                  {
                    label: "A receber",
                    value: data.financeSummary.toReceive,
                    tone: "bg-success",
                  },
                  {
                    label: "Atrasado",
                    value: data.financeSummary.overdue,
                    tone: "bg-destructive",
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={cn("size-2 rounded-full", item.tone)} />
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {money.format(Number(item.value))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Orçamentos pendentes"
          footerHref={data.kpis.openBudgets == null ? undefined : "/app/budgets"}
          footerLabel="Ver todos orçamentos"
        >
          {data.kpis.openBudgets == null ? (
            <p className="text-sm text-muted-foreground">
              Sem permissão para visualizar orçamentos.
            </p>
          ) : data.pendingBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum orçamento pendente.</p>
          ) : (
            <ul className="-mx-1 space-y-0.5">
              {data.pendingBudgets.map((budget) => (
                <li key={budget.id}>
                  <Link
                    href={`/app/budgets?patientId=${budget.patientId}&edit=${budget.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {budget.patientName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {relativeDay(budget.updatedAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {money.format(Number(budget.total))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
