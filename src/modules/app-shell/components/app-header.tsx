"use client";

import type { FeatureKey, Plan, Role } from "@prisma/client";
import { Bell, Building2, ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import type { DashboardAlert } from "@/modules/dashboard/dto/dashboard.dto";
import { hasPermission } from "@/shared/lib/rbac";
import { ROLE_LABELS } from "../labels";
import { MobileNav } from "./app-sidebar";
import { CommandPalette } from "./command-palette";

export function AppHeader({
  role,
  flags,
  userInitials,
  userName,
  plan,
  companyName,
  isPlatformAdmin = false,
  alerts = [],
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
  plan: Plan;
  companyName: string;
  isPlatformAdmin?: boolean;
  alerts?: DashboardAlert[];
}) {
  const canOpenSettings = hasPermission(role, "settings:view");
  const alertCount = alerts.length;

  return (
    <>
      <header className="app-header sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:px-8">
        <MobileNav
          role={role}
          flags={flags}
          userInitials={userInitials}
          userName={userName}
          plan={plan}
          isPlatformAdmin={isPlatformAdmin}
        />

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("businessos:open-command-palette"));
          }}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition hover:border-border-strong hover:bg-muted sm:max-w-sm"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="truncate">Buscar pacientes, páginas e ações...</span>
          <kbd className="ml-auto hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
              >
                <Building2 className="size-4 text-primary" />
                <span className="max-w-[160px] truncate">{companyName}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground">Clínica atual</p>
                <p className="truncate text-sm font-medium">{companyName}</p>
              </DropdownMenuLabel>
              {canOpenSettings ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings">Configurações da clínica</Link>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Alertas"
              >
                <Bell className="size-4" />
                {alertCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Alertas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alerts.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum alerta no momento.</p>
              ) : (
                alerts.map((alert) => (
                  <DropdownMenuItem key={alert.id} asChild>
                    <Link href={alert.href} className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-medium">{alert.title}</span>
                      <span className="text-xs text-muted-foreground">{alert.description}</span>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-xs font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{userName ?? "Usuário"}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/profile">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void logoutAction();
                }}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandPalette role={role} flags={flags} />
    </>
  );
}
