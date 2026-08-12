import type { FeatureKey } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  NotebookPen,
  Settings,
  Smile,
  Users,
  Wallet,
} from "lucide-react";
import type { Permission } from "@/shared/lib/rbac";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  feature?: FeatureKey;
  title: string;
  /** Foundation: módulos futuros aparecem desabilitados no shell */
  comingSoon?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: "/app",
    label: "Visão geral",
    title: "Visão geral",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    href: "/app/agenda",
    label: "Agenda",
    title: "Agenda",
    icon: CalendarDays,
    permission: "agenda:view",
    feature: "agenda",
  },
  {
    href: "/app/patients",
    label: "Pacientes",
    title: "Pacientes",
    icon: Users,
    permission: "patients:view",
    feature: "patients",
  },
  {
    href: "/app/clinical-records",
    label: "Prontuário",
    title: "Prontuário Clínico",
    icon: NotebookPen,
    permission: "clinical_records:view",
    feature: "clinical_records",
  },
  {
    href: "/app/treatment-plans",
    label: "Tratamento",
    title: "Plano de Tratamento",
    icon: ClipboardList,
    permission: "treatment_plans:view",
    feature: "treatments",
  },
  {
    href: "/app/budgets",
    label: "Orçamentos",
    title: "Orçamentos",
    icon: FileText,
    permission: "budgets:view",
    feature: "budgets",
  },
  {
    href: "/app/finance",
    label: "Financeiro",
    title: "Financeiro",
    icon: Wallet,
    permission: "finance:view",
    feature: "finance",
  },
  {
    href: "/app/odontogram",
    label: "Odontograma",
    title: "Odontograma",
    icon: Smile,
    permission: "odontogram:view",
    feature: "odontogram",
  },
  {
    href: "/app/settings",
    label: "Configurações",
    title: "Configurações",
    icon: Settings,
    permission: "settings:view",
  },
];

export function resolvePageTitle(pathname: string): string {
  const exact = APP_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) {
    return exact.title;
  }
  const nested = APP_NAV_ITEMS.find(
    (item) => item.href !== "/app" && pathname.startsWith(item.href),
  );
  return nested?.title ?? "Painel";
}
