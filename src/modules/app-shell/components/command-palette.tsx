"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FeatureKey, Role } from "@prisma/client";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/components/ui/command";
import { hasPermission } from "@/shared/lib/rbac";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { APP_NAV_ITEMS } from "../nav";

export function CommandPalette({
  role,
  flags,
}: {
  role: Role;
  flags: Record<FeatureKey, boolean>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("businessos:open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("businessos:open-command-palette", onOpen);
    };
  }, []);

  const navItems = APP_NAV_ITEMS.filter((item) => {
    if (!hasPermission(role, item.permission)) return false;
    if (item.feature && !flags[item.feature]) return false;
    return true;
  });

  function go(href: string, comingSoon?: boolean) {
    setOpen(false);
    if (comingSoon) {
      router.push("/app");
      return;
    }
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.title}`}
                onSelect={() => go(item.href, item.comingSoon)}
              >
                <Icon className="mr-2 size-4" />
                {item.label}
                {item.comingSoon && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                    Em breve
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações">
          <CommandItem
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            Alternar tema
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              void logoutAction();
            }}
          >
            <LogOut className="mr-2 size-4" />
            Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
