import type { FeatureKey } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import type { Permission } from "@/shared/lib/rbac";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  feature?: FeatureKey;
  title: string;
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
    label: "",
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
        href: "/app/reports",
        label: "Relatórios",
        title: "Relatórios",
        icon: FileBarChart,
        permission: "reports:view",
        feature: "reports",
        ignoreFeatureFlag: true,
      },
      {
        href: "/app/communications",
        label: "Comunicações",
        title: "Comunicações",
        icon: MessageCircle,
        permission: "patients:view",
        feature: "patients",
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
  if (pathname.startsWith("/app/patients/")) return "Paciente";
  const exact = APP_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact.title;
  const nested = APP_NAV_ITEMS.find(
    (item) => item.href !== "/app" && pathname.startsWith(item.href),
  );
  return nested?.title ?? "Painel";
}
