import { InventoryView } from "@/modules/inventory/components/inventory-view";
import { requirePermission } from "@/shared/lib/session";

export default async function InventoryPage() {
  await requirePermission("settings:view");
  return <InventoryView />;
}
