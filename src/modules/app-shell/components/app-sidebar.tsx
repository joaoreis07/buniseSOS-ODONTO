"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FeatureKey, Plan, Role } from "@prisma/client";
import { ChevronsUpDown, Menu, X } from "lucide-react";
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
    <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
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
                ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-white/[0.07] hover:text-white",
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2 : 1.75} />
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
    <div className="mt-auto pt-3">
      <Link
        href="/app/profile"
        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 transition hover:bg-white/[0.08]"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-xs font-semibold text-white">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {userName ?? "Usuário"}
          </span>
          <span className="block truncate text-xs text-sidebar-foreground">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground" />
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
    <aside className="app-sidebar fixed inset-y-0 z-40 hidden w-60 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
      <div className="px-2">
        <Brand light />
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
        className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <Brand light />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-sidebar-foreground hover:bg-white/[0.07] hover:text-white"
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
