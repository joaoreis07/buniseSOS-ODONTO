import { AgendaView } from "@/modules/agenda/components/agenda-view";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

export default async function AgendaPage() {
  const user = await requirePermission("agenda:view");
  const canManage = hasPermission(user.role, "agenda:manage");

  return <AgendaView canManage={canManage} />;
}
