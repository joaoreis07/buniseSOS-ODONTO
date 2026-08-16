"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  FileText,
  MessageSquare,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { SectionCard } from "@/shared/components/section-card";
import { StatCard } from "@/shared/components/stat-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import type { DashboardOverviewDTO } from "../dto/dashboard.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

  const weekByDay = WEEKDAY_LABELS.map((label, index) => ({
    label,
    count: data.weekAppointments.filter((item) => new Date(item.startsAt).getDay() === index).length,
  }));
  const weekTotal = data.weekAppointments.length;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">
            Olá, {firstName} 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo de {data.companyName.trim()} hoje.
          </p>
        </div>
        <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm">
          <CalendarDays className="size-4 text-primary" />
          {todayLabel()}
        </span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pacientes cadastrados"
          value={data.kpis.patients == null ? "—" : String(data.kpis.patients)}
          hint="Base ativa da clínica"
          href="/app/patients"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Consultas hoje"
          value={data.kpis.appointmentsToday == null ? "—" : String(data.kpis.appointmentsToday)}
          hint={
            data.todayAppointments.length > 0
              ? `Próxima: ${formatTime(data.todayAppointments[0].startsAt)}`
              : "Nenhuma consulta hoje"
          }
          href="/app/agenda"
          icon={CalendarDays}
          tone="success"
        />
        <StatCard
          label="Orçamentos ativos"
          value={data.kpis.openBudgets == null ? "—" : String(data.kpis.openBudgets)}
          hint="Aguardando aprovação"
          href="/app/budgets"
          icon={FileText}
          tone="warning"
        />
        <StatCard
          label="Recebimentos do mês"
          value={
            data.kpis.monthlyReceived == null
              ? "—"
              : money.format(Number(data.kpis.monthlyReceived))
          }
          hint="Valores já recebidos"
          href="/app/finance"
          icon={Wallet}
          tone="info"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Recebimentos"
          description="Valores realmente recebidos nos últimos 6 meses."
          action={
            <Link
              href="/app/finance"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-brand-50"
            >
              Ver financeiro
              <ArrowRight className="size-3" />
            </Link>
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
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <AreaChart data={data.monthlySeries} margin={{ left: 4, right: 8, top: 8 }}>
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
                <li key={item.name} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-brand-50 text-[11px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-foreground">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Consultas da semana" description={`${weekTotal} no total`}>
          <ul className="space-y-2.5">
            {weekByDay.map((day) => (
              <li key={day.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{day.label}</span>
                <span className="text-sm font-semibold text-foreground">{day.count}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Agenda de hoje"
          footerHref="/app/agenda"
          footerLabel="Ver agenda completa"
        >
          {data.todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {data.todayAppointments.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/app/agenda"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                  >
                    <span className="w-11 shrink-0 text-sm font-semibold text-primary">
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Alertas">
          {data.alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {data.alerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className="flex gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
                      <AlertTriangle className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {alert.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {alert.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Pacientes recentes"
          footerHref="/app/patients"
          footerLabel="Ver todos os pacientes"
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
                    <span className="truncate text-sm text-foreground">
                      {patient.preferredName || patient.name}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/app/agenda", label: "Agenda", hint: "Consultas e horários", icon: CalendarDays },
          { href: "/app/patients", label: "Pacientes", hint: "Cadastro e fichas", icon: Users },
          {
            href: "/app/communications",
            label: "Comunicações",
            hint: "WhatsApp e ligações",
            icon: MessageSquare,
          },
          { href: "/app/reports", label: "Relatórios", hint: "Indicadores da clínica", icon: Wallet },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="surface-card flex items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-md"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-primary">
              <item.icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{item.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </div>
  );
}
