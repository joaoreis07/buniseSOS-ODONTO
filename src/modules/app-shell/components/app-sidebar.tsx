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
import { PLAN_LABELS, ROLE_LABELS } from "../labels";
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
    <div className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto">
      {APP_NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => {
          if (!hasPermission(role, item.permission)) return false;
          if (item.feature && !item.ignoreFeatureFlag && !flags[item.feature]) return false;
          return true;
        });
        if (items.length === 0) return null;

        return (
          <div key={group.id}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {group.label}
            </p>
            <nav className="mt-2 grid gap-0.5">
              {items.map(({ href, icon: Icon, label }) => {
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary font-medium text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-white hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "opacity-80")} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}
    </div>
  );
}

function SidebarFooter({
  userInitials,
  userName,
  role,
  plan,
}: {
  userInitials: string;
  userName: string | null;
  role: Role;
  plan: Plan;
}) {
  return (
    <div className="mt-auto border-t border-sidebar-border pt-3">
      <Link
        href="/app/profile"
        className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition hover:border-brand-200"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-brand-600 text-xs text-white">{userInitials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {userName ?? "Usuário"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
        </span>
      </Link>
      <p className="mt-2 px-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Plano {PLAN_LABELS[plan]}
      </p>
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
  return (
    <aside className="fixed inset-y-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex lg:shadow-[1px_0_0_rgba(15,23,42,0.04)]">
      <div className="px-2">
        <Brand />
      </div>
      <NavLinks role={role} flags={flags} />
      <SidebarFooter userInitials={userInitials} userName={userName} role={role} plan={plan} />
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
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavLinks role={role} flags={flags} onNavigate={() => setOpen(false)} />
            <SidebarFooter userInitials={userInitials} userName={userName} role={role} plan={plan} />
          </aside>
        </div>
      )}
    </>
  );
}
