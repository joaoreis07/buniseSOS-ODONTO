import type { Plan, Role } from "@prisma/client";
import { PLAN_LABELS, ROLE_LABELS } from "@/modules/app-shell/labels";
import { PageHeader } from "@/shared/components/page-header";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";

export function ProfileView({
  name,
  email,
  initials,
  role,
  plan,
  companyName,
}: {
  name: string | null;
  email: string | null;
  initials: string;
  role: Role;
  plan: Plan;
  companyName: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Perfil" description="Informações da conta autenticada." />
      <section className="surface-card p-8 text-center">
        <Avatar className="mx-auto size-20">
          <AvatarFallback className="bg-brand-600 text-xl text-white">{initials}</AvatarFallback>
        </Avatar>
        <h3 className="mt-4 text-xl font-semibold">{name ?? "Usuário"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABELS[role]}</p>
        <dl className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <Field label="E-mail" value={email} />
          <Field label="Telefone" value={null} />
          <Field label="Especialidade" value={null} />
          <Field label="CRO" value={null} />
          <Field label="Clínica" value={companyName} />
          <Field label="Plano" value={PLAN_LABELS[plan]} />
        </dl>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
