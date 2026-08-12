import { ComingSoonPage } from "@/shared/components/coming-soon-page";
import { requirePermission } from "@/shared/lib/session";

export default async function SettingsPage() {
  await requirePermission("settings:view");

  return (
    <ComingSoonPage
      title="Configurações em breve"
      description="Empresa, preferências, profissionais e permissões serão configurados nas próximas etapas. A estrutura de multi-tenant e RBAC já está preparada."
    />
  );
}
