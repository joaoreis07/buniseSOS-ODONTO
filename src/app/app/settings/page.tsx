import { SettingsView } from "@/modules/settings/components/settings-view";
import { getClinicSettings } from "@/modules/settings/services/settings.service";
import { hasPermission } from "@/shared/lib/rbac";
import { requirePermission } from "@/shared/lib/session";

const SETTINGS_TABS = [
  "geral",
  "usuarios",
  "permissoes",
  "financeiro",
  "agenda",
  "comunicacoes",
  "seguranca",
  "integracoes",
  "planos",
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requirePermission("settings:view");
  const { tab } = await searchParams;
  const company = await getClinicSettings(user.companyId);
  const initialTab = SETTINGS_TABS.includes(tab as (typeof SETTINGS_TABS)[number])
    ? (tab as (typeof SETTINGS_TABS)[number])
    : undefined;

  return (
    <SettingsView
      plan={company.plan}
      canManage={hasPermission(user.role, "settings:manage")}
      initialTab={initialTab}
      clinic={{
        name: company.name,
        plan: company.plan,
        logo: company.logo,
        phone: company.phone,
        email: company.email,
        cnpj: company.cnpj,
        address: company.address,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        language: company.settings?.language ?? "pt-BR",
        timezone: company.settings?.timezone ?? "America/Sao_Paulo",
        dateFormat: company.settings?.dateFormat ?? "dd/MM/yyyy",
        currency: company.settings?.currency ?? "BRL",
        notifications: company.settings?.notifications ?? true,
      }}
    />
  );
}
