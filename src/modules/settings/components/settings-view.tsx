import {
  Building2,
  CalendarDays,
  CreditCard,
  MessageCircle,
  Settings2,
  Stethoscope,
  Users,
} from "lucide-react";
import type { Plan } from "@prisma/client";
import { PLAN_LABELS } from "@/modules/app-shell/labels";
import { PageHeader } from "@/shared/components/page-header";

const GROUPS = [
  {
    id: "clinica",
    icon: Building2,
    title: "Clínica",
    description: "Dados cadastrais, identidade e informações da empresa.",
  },
  {
    id: "usuarios",
    icon: Users,
    title: "Usuários",
    description: "Permissões e acessos da equipe. RBAC já está ativo no backend.",
  },
  {
    id: "profissionais",
    icon: Stethoscope,
    title: "Profissionais",
    description: "Dentistas, especialidades e vínculos com a agenda.",
  },
  {
    id: "comunicacao",
    icon: MessageCircle,
    title: "Comunicação",
    description: "Contatos de pacientes via WhatsApp e telefone.",
  },
  {
    id: "financeiro",
    icon: CreditCard,
    title: "Financeiro",
    description: "Formas de pagamento e preferências de recebimento.",
  },
  {
    id: "agenda",
    icon: CalendarDays,
    title: "Agenda",
    description: "Horários, profissionais, salas e cadeiras.",
  },
  {
    id: "sistema",
    icon: Settings2,
    title: "Sistema",
    description: "Preferências gerais do BusinessOS Odonto.",
  },
] as const;

export function SettingsView({
  companyName,
  plan,
  canManage,
}: {
  companyName: string;
  plan: Plan;
  canManage: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Organize a clínica por categorias. Itens sem editor próprio mostram o estado atual, sem dados fictícios."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="surface-card flex items-start gap-4 p-5 text-left transition hover:border-primary/40"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{group.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{group.description}</span>
              </span>
            </a>
          );
        })}
      </section>

      <section id="clinica" className="surface-card p-5">
        <h3 className="font-semibold">Clínica</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Nome</dt>
            <dd className="mt-1 text-sm font-medium">{companyName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Plano</dt>
            <dd className="mt-1 text-sm font-medium">{PLAN_LABELS[plan]}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          {canManage
            ? "O editor cadastral da clínica será liberado nas próximas etapas. Multi-tenant e plano já estão ativos."
            : "Você pode visualizar, mas não alterar configurações."}
        </p>
      </section>

      <section id="usuarios" className="surface-card p-5">
        <h3 className="font-semibold">Usuários</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Controle de papéis (Administrador, Gerente e Colaborador) já está ativo.
        </p>
      </section>

      <section id="profissionais" className="surface-card p-5">
        <h3 className="font-semibold">Profissionais</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Profissionais, salas e cadeiras são gerenciados na Agenda.
        </p>
      </section>

      <section id="comunicacao" className="surface-card p-5">
        <h3 className="font-semibold">Comunicação</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A recepção encontra pacientes e abre WhatsApp ou ligação em Comunicações.
        </p>
      </section>

      <section id="financeiro" className="surface-card p-5">
        <h3 className="font-semibold">Financeiro</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Parcelas e recebimentos ficam na ficha do paciente, na aba Financeiro.
        </p>
      </section>

      <section id="agenda" className="surface-card p-5">
        <h3 className="font-semibold">Agenda</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Horários, profissionais, salas e cadeiras já estão no módulo de Agenda.
        </p>
      </section>

      <section id="sistema" className="surface-card p-5">
        <h3 className="font-semibold">Sistema</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tema escuro oficial do BusinessOS Odonto. Preferências avançadas virão nas próximas etapas.
        </p>
      </section>
    </div>
  );
}
