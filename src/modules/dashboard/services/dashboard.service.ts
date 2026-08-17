import { Prisma } from "@prisma/client";
import { assertTenantId } from "@/shared/lib/tenant";
import { prisma } from "@/shared/lib/prisma";
import type { DashboardAlert, DashboardOverviewDTO } from "../dto/dashboard.dto";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeekMonday(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  return addDays(next, day === 0 ? -6 : 1 - day);
}

function mapAppointment(row: {
  id: string;
  startsAt: Date;
  procedure: string | null;
  status: string;
  patient: { id: string; name: string; preferredName: string | null };
  professional: { name: string };
}) {
  return {
    id: row.id,
    patientId: row.patient.id,
    patientName: row.patient.preferredName || row.patient.name,
    startsAt: row.startsAt.toISOString(),
    procedure: row.procedure,
    professionalName: row.professional.name,
    status: row.status,
  };
}

const overdueInstallmentWhere = (companyId: string, now: Date): Prisma.InstallmentWhereInput => ({
  companyId,
  deletedAt: null,
  status: { notIn: ["PAID", "CANCELLED"] },
  balance: { gt: 0 },
  OR: [{ status: "OVERDUE" }, { dueDate: { lt: now } }],
});

export async function getShellAlerts(
  companyId: string,
  access: { patients: boolean; finance: boolean },
): Promise<DashboardAlert[]> {
  assertTenantId(companyId);
  const now = new Date();

  const [overdueCount, returnAlerts] = await Promise.all([
    access.finance
      ? prisma.installment.count({ where: overdueInstallmentWhere(companyId, now) })
      : Promise.resolve(0),
    access.patients
      ? prisma.returnAlert.findMany({
          where: { companyId, deletedAt: null, completedAt: null, dueDate: { lte: now } },
          include: { patient: { select: { id: true, name: true } } },
          take: 4,
          orderBy: { dueDate: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return [
    ...(overdueCount > 0
      ? [
          {
            id: "overdue",
            title: `${overdueCount} parcela(s) vencida(s)`,
            description: "Há contas a receber em atraso.",
            href: "/app/finance",
          },
        ]
      : []),
    ...returnAlerts.map((alert) => ({
      id: alert.id,
      title: `Retorno: ${alert.patient.name}`,
      description: alert.reason || "Paciente com retorno pendente.",
      href: `/app/patients?patientId=${alert.patient.id}`,
    })),
  ];
}

export async function getDashboardOverview(
  companyId: string,
  access: {
    patients: boolean;
    agenda: boolean;
    budgets: boolean;
    finance: boolean;
  },
): Promise<DashboardOverviewDTO> {
  assertTenantId(companyId);

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrow = addDays(todayStart, 1);
  const weekStart = startOfWeekMonday(now);
  const weekEnd = addDays(weekStart, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const seriesStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const openBudgetWhere: Prisma.TreatmentBudgetWhereInput = {
    companyId,
    deletedAt: null,
    status: { in: ["DRAFT", "SENT"] },
  };

  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { name: true },
  });

  const [
    patients,
    patientsThisMonth,
    appointmentsToday,
    openBudgets,
    openBudgetsTotal,
    monthlyReceived,
    todayRows,
    weekRows,
    recentPatients,
    pendingBudgetRows,
    receivableTotals,
    overdueBalance,
    payments,
    procedures,
    alerts,
  ] = await Promise.all([
    access.patients
      ? prisma.patient.count({ where: { companyId, deletedAt: null } })
      : Promise.resolve(null),
    access.patients
      ? prisma.patient.count({
          where: { companyId, deletedAt: null, createdAt: { gte: monthStart } },
        })
      : Promise.resolve(null),
    access.agenda
      ? prisma.appointment.count({
          where: {
            companyId,
            deletedAt: null,
            startsAt: { gte: todayStart, lt: tomorrow },
            status: { notIn: ["CANCELED"] },
          },
        })
      : Promise.resolve(null),
    access.budgets
      ? prisma.treatmentBudget.count({ where: openBudgetWhere })
      : Promise.resolve(null),
    access.budgets
      ? prisma.treatmentBudget.aggregate({
          where: openBudgetWhere,
          _sum: { total: true },
        })
      : Promise.resolve(null),
    access.finance
      ? prisma.payment.aggregate({
          where: { companyId, deletedAt: null, paidAt: { gte: monthStart } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    access.agenda
      ? prisma.appointment.findMany({
          where: {
            companyId,
            deletedAt: null,
            startsAt: { gte: todayStart, lt: tomorrow },
            status: { notIn: ["CANCELED"] },
          },
          include: {
            patient: { select: { id: true, name: true, preferredName: true } },
            professional: { select: { name: true } },
          },
          orderBy: { startsAt: "asc" },
          take: 8,
        })
      : Promise.resolve([]),
    access.agenda
      ? prisma.appointment.findMany({
          where: {
            companyId,
            deletedAt: null,
            startsAt: { gte: weekStart, lt: weekEnd },
            status: { notIn: ["CANCELED"] },
          },
          include: {
            patient: { select: { id: true, name: true, preferredName: true } },
            professional: { select: { name: true } },
          },
          orderBy: { startsAt: "asc" },
          take: 80,
        })
      : Promise.resolve([]),
    access.patients
      ? prisma.patient.findMany({
          where: { companyId, deletedAt: null },
          select: {
            id: true,
            name: true,
            preferredName: true,
            photoUrl: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    access.budgets
      ? prisma.treatmentBudget.findMany({
          where: openBudgetWhere,
          select: {
            id: true,
            total: true,
            updatedAt: true,
            status: true,
            patient: { select: { id: true, name: true, preferredName: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    access.finance
      ? prisma.receivable.aggregate({
          where: { companyId, deletedAt: null },
          _sum: { receivedAmount: true, balance: true, total: true },
        })
      : Promise.resolve(null),
    access.finance
      ? prisma.installment.aggregate({
          where: overdueInstallmentWhere(companyId, now),
          _sum: { balance: true },
        })
      : Promise.resolve(null),
    access.finance
      ? prisma.payment.findMany({
          where: { companyId, deletedAt: null, paidAt: { gte: seriesStart } },
          select: { amount: true, paidAt: true },
        })
      : Promise.resolve([]),
    prisma.odontogramProcedure.groupBy({
      by: ["title"],
      where: { companyId, deletedAt: null },
      _count: { title: true },
      orderBy: { _count: { title: "desc" } },
      take: 5,
    }),
    getShellAlerts(companyId, { patients: access.patients, finance: access.finance }),
  ]);

  const monthlySeries = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const received = payments
      .filter((payment) => `${payment.paidAt.getFullYear()}-${payment.paidAt.getMonth()}` === key)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", ""),
      received,
    };
  });

  const received = Number(receivableTotals?._sum.receivedAmount ?? 0);
  const balance = Number(receivableTotals?._sum.balance ?? 0);
  const overdue = Number(overdueBalance?._sum.balance ?? 0);
  const toReceive = Math.max(0, balance - overdue);

  return {
    companyName: company?.name ?? "sua clínica",
    kpis: {
      patients,
      patientsThisMonth,
      appointmentsToday,
      openBudgets,
      openBudgetsTotal:
        openBudgetsTotal?._sum?.total != null
          ? String(openBudgetsTotal._sum.total)
          : access.budgets
            ? "0"
            : null,
      monthlyReceived:
        monthlyReceived?._sum.amount != null
          ? String(monthlyReceived._sum.amount)
          : access.finance
            ? "0"
            : null,
    },
    todayAppointments: todayRows.map(mapAppointment),
    weekAppointments: weekRows.map(mapAppointment),
    recentPatients: recentPatients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      preferredName: patient.preferredName,
      photoUrl: patient.photoUrl,
      updatedAt: patient.updatedAt.toISOString(),
    })),
    pendingBudgets: pendingBudgetRows.map((row) => ({
      id: row.id,
      patientId: row.patient.id,
      patientName: row.patient.preferredName || row.patient.name,
      total: String(row.total),
      updatedAt: row.updatedAt.toISOString(),
      status: row.status,
    })),
    financeSummary: access.finance
      ? {
          received: received.toFixed(2),
          toReceive: toReceive.toFixed(2),
          overdue: overdue.toFixed(2),
          total: (received + balance).toFixed(2),
        }
      : null,
    alerts,
    monthlySeries,
    topProcedures: procedures.map((item) => ({ name: item.title, count: item._count.title })),
  };
}
