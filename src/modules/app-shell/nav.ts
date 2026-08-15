import type { FeatureKey } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileText,
  LayoutDashboard,
  NotebookPen,
  Package,
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
  /** Exibe o item mesmo com feature flag desligada (página visual / em construção). */
  ignoreFeatureFlag?: boolean;
};

export type AppNavGroup = {
  id: string;
  label: string;
  items: AppNavItem[];
};

export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    id: "principal",
    label: "Principal",
    items: [
      {
        href: "/app",
        label: "Painel",
        title: "Painel",
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
        href: "/app/odontogram",
        label: "Odontograma",
        title: "Odontograma",
        icon: Smile,
        permission: "odontogram:view",
        feature: "odontogram",
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
        label: "Tratamentos",
        title: "Planos de Tratamento",
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
        href: "/app/inventory",
        label: "Estoque",
        title: "Estoque",
        icon: Package,
        permission: "settings:view",
        feature: "inventory",
        ignoreFeatureFlag: true,
      },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    items: [
      {
        href: "/app/reports",
        label: "Relatórios",
        title: "Relatórios",
        icon: FileBarChart,
        permission: "reports:view",
        feature: "reports",
        ignoreFeatureFlag: true,
      },
      {
        href: "/app/settings",
        label: "Configurações",
        title: "Configurações",
        icon: Settings,
        permission: "settings:view",
      },
    ],
  },
];

export const APP_NAV_ITEMS: AppNavItem[] = APP_NAV_GROUPS.flatMap((group) => group.items);

export function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/app/profile")) return "Perfil";
  const exact = APP_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) {
    return exact.title;
  }
  const nested = APP_NAV_ITEMS.find(
    (item) => item.href !== "/app" && pathname.startsWith(item.href),
  );
  return nested?.title ?? "Painel";
}
