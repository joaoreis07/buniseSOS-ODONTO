export type DashboardAppointmentItem = {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  procedure: string | null;
  professionalName: string;
  status: string;
};

export type DashboardRecentPatient = {
  id: string;
  name: string;
  preferredName: string | null;
  photoUrl: string | null;
  updatedAt: string;
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type DashboardMonthPoint = {
  month: string;
  received: number;
};

export type DashboardTopProcedure = {
  name: string;
  count: number;
};

export type DashboardOverviewDTO = {
  companyName: string;
  kpis: {
    patients: number | null;
    appointmentsToday: number | null;
    openBudgets: number | null;
    monthlyReceived: string | null;
  };
  todayAppointments: DashboardAppointmentItem[];
  weekAppointments: DashboardAppointmentItem[];
  recentPatients: DashboardRecentPatient[];
  alerts: DashboardAlert[];
  monthlySeries: DashboardMonthPoint[];
  topProcedures: DashboardTopProcedure[];
};
