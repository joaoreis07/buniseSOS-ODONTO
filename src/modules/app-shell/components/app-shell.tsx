import type { FeatureKey, Plan, Role } from "@prisma/client";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  role,
  flags,
  userInitials,
  userName,
  plan,
  companyName,
}: {
  children: React.ReactNode;
  role: Role;
  flags: Record<FeatureKey, boolean>;
  userInitials: string;
  userName: string | null;
  plan: Plan;
  companyName: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar
        role={role}
        flags={flags}
        userInitials={userInitials}
        userName={userName}
        plan={plan}
      />
      <div className="app-content lg:pl-60">
        <AppHeader
          role={role}
          flags={flags}
          userInitials={userInitials}
          userName={userName}
          plan={plan}
          companyName={companyName}
        />
        <main className="w-full p-4 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
