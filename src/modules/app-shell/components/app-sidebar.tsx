"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FeatureKey, Plan, Role } from "@prisma/client";
import { Menu, X } from "lucide-react";
import { Brand } from "@/shared/components/brand";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { hasPermission } from "@/shared/lib/rbac";
import { cn } from "@/shared/lib/utils";
import { ROLE_LABELS } from "../labels";
import { APP_NAV_GROUPS } from "../nav";

function NavLinks({
  role,
  flags,
  onNavigate,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
      {APP_NAV_GROUPS.flatMap((group) =>
        group.items.filter((item) => {
          if (!hasPermission(role, item.permission)) return false;
          if (item.feature && !item.ignoreFeatureFlag && !flags[item.feature]) return false;
          return true;
        }),
      ).map(({ href, icon: Icon, label }) => {
        const active =
          href === "/app"
            ? pathname === "/app"
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary font-medium text-primary-foreground"
                : "text-sidebar-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  userInitials,
  userName,
  role,
}: {
  userInitials: string;
  userName: string | null;
  role: Role;
}) {
  return (
    <div className="mt-auto border-t border-sidebar-border pt-3">
      <Link
        href="/app/profile"
        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/5"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-xs text-white">{userInitials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {userName ?? "Usuário"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
        </span>
      </Link>
    </div>
  );
}

export function AppSidebar({
  role,
  flags,
  userInitials,
  userName,
  plan,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
  plan: Plan;
}) {
  void plan;
  return (
    <aside className="app-sidebar fixed inset-y-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <NavLinks role={role} flags={flags} />
      <SidebarFooter userInitials={userInitials} userName={userName} role={role} />
    </aside>
  );
}

export function MobileNav({
  role,
  flags,
  userInitials,
  userName,
  plan,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
  plan: Plan;
}) {
  const [open, setOpen] = useState(false);
  void plan;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/5"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavLinks role={role} flags={flags} onNavigate={() => setOpen(false)} />
            <SidebarFooter userInitials={userInitials} userName={userName} role={role} />
          </aside>
        </div>
      )}
    </>
  );
}
