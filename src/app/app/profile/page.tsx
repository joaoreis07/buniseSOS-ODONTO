import { ProfileView } from "@/modules/profile/components/profile-view";
import { prisma } from "@/shared/lib/prisma";
import { getUserInitials, requireSession } from "@/shared/lib/session";

export default async function ProfilePage() {
  const user = await requireSession();
  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    select: { name: true, plan: true },
  });

  return (
    <ProfileView
      name={user.name}
      email={user.email}
      initials={getUserInitials(user.name, user.email)}
      role={user.role}
      plan={company?.plan ?? "STARTER"}
      companyName={company?.name ?? "Clínica"}
    />
  );
}
