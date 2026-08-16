import { CommunicationsView } from "@/modules/communications/components/communications-view";
import { requirePermission } from "@/shared/lib/session";

export default async function CommunicationsPage() {
  await requirePermission("patients:view");
  return <CommunicationsView />;
}
