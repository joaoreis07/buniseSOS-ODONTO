import type { FeatureKey, Role } from "@prisma/client";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  role,
  flags,
  userInitials,
  userName,
}: {
  children: React.ReactNode;
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar role={role} flags={flags} />
      <div className="lg:pl-60">
        <AppHeader
          role={role}
          flags={flags}
          userInitials={userInitials}
          userName={userName}
        />
        <main className="w-full p-4 lg:px-6 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
