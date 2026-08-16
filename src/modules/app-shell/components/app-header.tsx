"use client";

import type { FeatureKey, Plan, Role } from "@prisma/client";
import { Bell, Building2, Search } from "lucide-react";
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
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
  plan: Plan;
  companyName: string;
}) {
  return (
    <>
      <header className="app-header sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
        <MobileNav
          role={role}
          flags={flags}
          userInitials={userInitials}
          userName={userName}
          plan={plan}
        />

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("businessos:open-command-palette"));
          }}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition hover:bg-white/5 sm:max-w-md"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="truncate">Buscar pacientes, páginas e ações...</span>
          <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground md:inline-flex">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="max-w-[160px] truncate">{companyName}</span>
          </span>

          <span className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
            <Bell className="size-4" />
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-xs text-white">
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
