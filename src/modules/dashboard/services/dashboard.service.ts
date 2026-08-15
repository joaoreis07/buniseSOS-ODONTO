import { assertTenantId } from "@/shared/lib/tenant";
import { prisma } from "@/shared/lib/prisma";
import type { DashboardOverviewDTO } from "../dto/dashboard.dto";

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
  const weekEnd = addDays(todayStart, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const seriesStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { name: true },
  });

  const [
    patients,
    appointmentsToday,
    openBudgets,
    monthlyReceived,
    todayRows,
    weekRows,
    recentPatients,
    overdueCount,
    returnAlerts,
    payments,
    procedures,
  ] = await Promise.all([
    access.patients
      ? prisma.patient.count({ where: { companyId, deletedAt: null } })
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
      ? prisma.treatmentBudget.count({
          where: { companyId, deletedAt: null, status: { in: ["DRAFT", "SENT"] } },
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
            startsAt: { gte: todayStart, lt: weekEnd },
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
    access.finance
      ? prisma.installment.count({
          where: { companyId, deletedAt: null, status: "OVERDUE" },
        })
      : Promise.resolve(0),
    access.patients
      ? prisma.returnAlert.findMany({
          where: { companyId, deletedAt: null, completedAt: null, dueDate: { lte: now } },
          include: { patient: { select: { id: true, name: true } } },
          take: 4,
          orderBy: { dueDate: "asc" },
        })
      : Promise.resolve([]),
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

  const alerts = [
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

  return {
    companyName: company?.name ?? "sua clínica",
    kpis: {
      patients,
      appointmentsToday,
      openBudgets,
      monthlyReceived: monthlyReceived?._sum.amount != null ? String(monthlyReceived._sum.amount) : access.finance ? "0" : null,
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
    alerts,
    monthlySeries,
    topProcedures: procedures.map((item) => ({ name: item.title, count: item._count.title })),
  };
}
