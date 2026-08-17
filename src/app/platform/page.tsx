import { PLAN_LABELS, ROLE_LABELS } from "@/modules/app-shell/labels";
import { getPlatformOverview } from "@/modules/platform/services/platform.service";
import { PageHeader } from "@/shared/components/page-header";
import { SectionCard } from "@/shared/components/section-card";
import { StatCard } from "@/shared/components/stat-card";
import { requirePlatformAdmin } from "@/shared/lib/session";
import { Building2, CreditCard, Shield, Users } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Trial",
  ACTIVE: "Ativa",
  PAST_DUE: "Inadimplente",
  CANCELED: "Cancelada",
  INCOMPLETE: "Incompleta",
};

export default async function PlatformPage() {
  const user = await requirePlatformAdmin();
  const data = await getPlatformOverview(user.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Super Admin"
        description="Visão da plataforma: clínicas, usuários, planos e status de assinatura. Isolado do acesso da clínica."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard size="compact" label="Clínicas" value={String(data.summary.clinics)} icon={Building2} tone="primary" />
        <StatCard size="compact" label="Usuários" value={String(data.summary.users)} icon={Users} tone="neutral" />
        <StatCard
          size="compact"
          label="Planos gratuitos"
          value={String(data.summary.starterClinics)}
          hint="STARTER / Gratuito"
          icon={CreditCard}
          tone="warning"
        />
        <StatCard
          size="compact"
          label="Vínculos"
          value={String(data.summary.memberships)}
          hint="Usuários × clínicas"
          icon={Shield}
          tone="success"
        />
      </section>

      <SectionCard title="Clínicas" description="Tenants da plataforma">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-3 py-2">Clínica</th>
                <th className="px-3 py-2">Plano</th>
                <th className="px-3 py-2">Assinatura</th>
                <th className="px-3 py-2">Usuários</th>
                <th className="px-3 py-2">Pacientes</th>
                <th className="px-3 py-2">Cidade</th>
              </tr>
            </thead>
            <tbody>
              {data.clinics.map((clinic) => (
                <tr key={clinic.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-medium">{clinic.name}</td>
                  <td className="px-3 py-2.5">{PLAN_LABELS[clinic.plan]}</td>
                  <td className="px-3 py-2.5">{STATUS_LABEL[clinic.subscriptionStatus] ?? clinic.subscriptionStatus}</td>
                  <td className="px-3 py-2.5">{clinic._count.memberships}</td>
                  <td className="px-3 py-2.5">{clinic._count.patients}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {[clinic.city, clinic.state].filter(Boolean).join("/") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Usuários" description="Contas da plataforma e vínculo com clínicas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Clínica / papel</th>
                <th className="px-3 py-2">Plataforma</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-medium">{item.name ?? "—"}</td>
                  <td className="px-3 py-2.5">{item.email}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {item.memberships.length
                      ? item.memberships
                          .map((membership) => `${membership.company.name} (${ROLE_LABELS[membership.role]})`)
                          .join(" · ")
                      : "Sem clínica"}
                  </td>
                  <td className="px-3 py-2.5">{item.isPlatformAdmin ? "Super Admin" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
