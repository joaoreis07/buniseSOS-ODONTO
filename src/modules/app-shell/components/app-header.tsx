"use client";

import type { FeatureKey, Role } from "@prisma/client";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { resolvePageTitle } from "../nav";
import { usePathname } from "next/navigation";
import { MobileNav } from "./app-sidebar";
import { CommandPalette } from "./command-palette";

export function AppHeader({
  role,
  flags,
  userInitials,
  userName,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
}) {
  const pathname = usePathname();
  const title = resolvePageTitle(pathname);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md lg:px-8">
        <MobileNav role={role} flags={flags} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("businessos:open-command-palette"));
          }}
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition hover:bg-muted sm:flex"
        >
          <Search className="size-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-6 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

        {mounted && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-brand-600 text-xs text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{userName ?? "Usuário"}</p>
              <p className="text-xs text-muted-foreground capitalize">{role.toLowerCase()}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void logoutAction();
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <CommandPalette role={role} flags={flags} />
    </>
  );
}
