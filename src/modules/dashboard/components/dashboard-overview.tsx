"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  FileText,
  Smile,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/shared/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { cn } from "@/shared/lib/utils";
import type { DashboardOverviewDTO } from "../dto/dashboard.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(
    new Date(iso),
  );
}

function KpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  icon: typeof Users;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card flex items-start gap-4 p-5 transition hover:border-brand-200 hover:shadow-sm"
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", iconClassName)}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </span>
    </Link>
  );
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
    received: { label: "Recebimentos", color: "var(--brand-600)" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">Olá, {firstName} 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo operacional de {data.companyName.trim()}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/app/agenda">
              <CalendarDays className="mr-1 size-4" />
              Agenda
            </Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/app/patients">
              <Users className="mr-1 size-4" />
              Pacientes
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pacientes cadastrados"
          value={data.kpis.patients == null ? "—" : String(data.kpis.patients)}
          href="/app/patients"
          icon={Users}
          iconClassName="bg-brand-50 text-brand-700"
        />
        <KpiCard
          label="Consultas hoje"
          value={data.kpis.appointmentsToday == null ? "—" : String(data.kpis.appointmentsToday)}
          href="/app/agenda"
          icon={CalendarDays}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          label="Orçamentos abertos"
          value={data.kpis.openBudgets == null ? "—" : String(data.kpis.openBudgets)}
          href="/app/budgets"
          icon={FileText}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <KpiCard
          label="Recebimentos do mês"
          value={data.kpis.monthlyReceived == null ? "—" : money.format(Number(data.kpis.monthlyReceived))}
          href="/app/finance"
          icon={Wallet}
          iconClassName="bg-violet-50 text-violet-700"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold tracking-[-0.02em]">Recebimentos (últimos 6 meses)</h3>
              <p className="mt-1 text-sm text-muted-foreground">Valores realmente recebidos no período.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/app/finance">
                Ver financeiro
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
          {data.kpis.monthlyReceived == null ? (
            <p className="mt-8 text-sm text-muted-foreground">Sem permissão para visualizar recebimentos.</p>
          ) : data.monthlySeries.every((point) => point.received === 0) ? (
            <p className="mt-8 text-sm text-muted-foreground">Ainda não há recebimentos registrados.</p>
          ) : (
            <ChartContainer config={chartConfig} className="mt-4 h-56 w-full">
              <AreaChart data={data.monthlySeries}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke="var(--color-received)"
                  fill="var(--color-received)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

        <div className="surface-card p-5">
          <h3 className="font-semibold tracking-[-0.02em]">Agenda do dia</h3>
          <div className="mt-4 space-y-2">
            {data.todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
            ) : (
              data.todayAppointments.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/agenda`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-border hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.procedure || "Consulta"} · {item.professionalName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-brand-700">{formatTime(item.startsAt)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5">
          <h3 className="font-semibold tracking-[-0.02em]">Top procedimentos</h3>
          <div className="mt-4 space-y-3">
            {data.topProcedures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum procedimento clínico registrado ainda.</p>
            ) : (
              data.topProcedures.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                      {index + 1}
                    </span>
                    <p className="truncate text-sm">{item.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-semibold tracking-[-0.02em]">Consultas da semana</h3>
          <div className="mt-4 space-y-3">
            {data.weekAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta na semana.</p>
            ) : (
              data.weekAppointments.map((item) => (
                <div key={item.id} className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDay(item.startsAt)} · {formatTime(item.startsAt)}
                    {item.procedure ? ` · ${item.procedure}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-card p-5">
            <h3 className="font-semibold tracking-[-0.02em]">Alertas</h3>
            <div className="mt-4 space-y-3">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
              ) : (
                data.alerts.map((alert) => (
                  <Link key={alert.id} href={alert.href} className="flex gap-3 rounded-xl hover:bg-muted/40">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>
                      <span className="block text-sm font-medium">{alert.title}</span>
                      <span className="block text-xs text-muted-foreground">{alert.description}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold tracking-[-0.02em]">Pacientes recentes</h3>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link href="/app/patients">Ver todos</Link>
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {data.recentPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
              ) : (
                data.recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/app/patients?patientId=${patient.id}`}
                    className="flex items-center justify-between rounded-xl px-1 py-1.5 hover:bg-muted/40"
                  >
                    <span className="truncate text-sm">{patient.preferredName || patient.name}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/app/odontogram", label: "Odontograma", icon: Smile },
          { href: "/app/clinical-records", label: "Prontuário", icon: FileText },
          { href: "/app/budgets", label: "Orçamentos", icon: FileText },
          { href: "/app/finance", label: "Financeiro", icon: Wallet },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="surface-card flex items-center gap-3 p-4 text-sm font-medium transition hover:border-brand-200"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <item.icon className="size-4" />
            </span>
            {item.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
