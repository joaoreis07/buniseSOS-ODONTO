"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FeatureKey, Role } from "@prisma/client";
import { Menu, X } from "lucide-react";
import { Brand } from "@/shared/components/brand";
import { hasPermission } from "@/shared/lib/rbac";
import { cn } from "@/shared/lib/utils";
import { APP_NAV_ITEMS } from "../nav";

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
  const items = APP_NAV_ITEMS.filter((item) => {
    if (!hasPermission(role, item.permission)) return false;
    if (item.feature && !flags[item.feature]) return false;
    return true;
  });

  return (
    <nav className="mt-4 grid gap-0.5">
      {items.map(({ href, icon: Icon, label, comingSoon }) => {
        const active =
          href === "/app"
            ? pathname === "/app"
            : pathname === href || pathname.startsWith(`${href}/`);

        if (comingSoon) {
          return (
            <span
              key={href}
              title="Em breve"
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 opacity-55"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                Em breve
              </span>
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-white/[0.08] font-medium text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({
  role,
  flags,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
}) {
  return (
    <aside className="fixed inset-y-0 hidden w-60 border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:block">
      <div className="px-2">
        <Brand light />
      </div>
      <p className="mt-8 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
        Clínica
      </p>
      <NavLinks role={role} flags={flags} />
      <div className="absolute bottom-5 left-3 right-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
        <p className="text-xs font-medium text-slate-200">Foundation</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          Base pronta. Próximo módulo: Agenda.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav({
  role,
  flags,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar px-3 py-5 text-sidebar-foreground shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-2">
              <Brand light />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavLinks role={role} flags={flags} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
