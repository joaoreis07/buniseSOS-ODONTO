"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Link2,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { Plan } from "@prisma/client";
import { PLAN_LABELS } from "@/modules/app-shell/labels";
import { PageHeader } from "@/shared/components/page-header";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

const CATEGORIES = [
  { id: "geral", label: "Geral", icon: Building2 },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "permissoes", label: "Permissões", icon: ShieldCheck },
  { id: "financeiro", label: "Financeiro", icon: CreditCard },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "comunicacoes", label: "Comunicações", icon: MessageCircle },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck },
  { id: "integracoes", label: "Integrações", icon: Link2 },
  { id: "planos", label: "Planos", icon: Wallet },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SettingsView({
  companyName,
  plan,
  canManage,
}: {
  companyName: string;
  plan: Plan;
  canManage: boolean;
}) {
  const [active, setActive] = useState<CategoryId>("geral");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações"
        description="Gerencie as preferências e configurações da sua clínica."
      />

      <nav className="surface-card flex flex-wrap gap-1 p-1.5">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = active === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActive(category.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {category.label}
            </button>
          );
        })}
      </nav>

      {active === "geral" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="Dados da clínica"
            description="Informações básicas da sua clínica"
            className="lg:col-span-2"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome da clínica" value={companyName} />
              <Field label="Plano contratado" value={PLAN_LABELS[plan]} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {canManage
                ? "O editor cadastral da clínica será liberado nas próximas etapas. Multi-tenant e plano já estão ativos no backend."
                : "Você pode visualizar, mas não alterar as configurações da clínica."}
            </p>
          </SectionCard>

          <SectionCard title="Sobre o sistema" description="Informações da sua assinatura">
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
                Plano atual
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{PLAN_LABELS[plan]}</p>
            </div>
            <div className="mt-3">
              <InfoRow label="Multi-tenant" value="Ativo" />
              <InfoRow label="Controle de acesso" value="RBAC ativo" />
              <InfoRow label="Tema" value="Claro" />
            </div>
          </SectionCard>
        </div>
      ) : null}

      {active === "usuarios" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Usuários" description="Equipe com acesso ao sistema">
            <p className="text-sm text-muted-foreground">
              O controle de papéis (Administrador, Gerente e Colaborador) já está ativo. O editor de
              convites e usuários será liberado nas próximas etapas.
            </p>
          </SectionCard>
          <SectionCard title="Seu perfil" description="Dados da conta conectada">
            <p className="text-sm text-muted-foreground">
              Nome, e-mail e senha são gerenciados na tela de perfil.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/app/profile">Abrir meu perfil</Link>
            </Button>
          </SectionCard>
        </div>
      ) : null}

      {active === "permissoes" ? (
        <SectionCard title="Permissões" description="Papéis disponíveis no BusinessOS Odonto">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Administrador" value="Acesso total" />
            <Field label="Gerente" value="Gestão e financeiro" />
            <Field label="Colaborador" value="Agenda e pacientes" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            As permissões são aplicadas no servidor (RBAC) e refletem automaticamente nos menus e
            ações disponíveis.
          </p>
        </SectionCard>
      ) : null}

      {active === "financeiro" ? (
        <SectionCard title="Financeiro" description="Recebimentos e parcelas">
          <p className="text-sm text-muted-foreground">
            Lançamentos, parcelas e recebimentos ficam na ficha do paciente, na aba Financeiro. As
            preferências de formas de pagamento serão liberadas nas próximas etapas.
          </p>
        </SectionCard>
      ) : null}

      {active === "agenda" ? (
        <SectionCard title="Agenda" description="Horários, profissionais e salas">
          <p className="text-sm text-muted-foreground">
            Horários, profissionais, consultórios e cadeiras já estão disponíveis no módulo de
            Agenda, com filtros por profissional e consultório.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/app/agenda">Abrir Agenda</Link>
          </Button>
        </SectionCard>
      ) : null}

      {active === "comunicacoes" ? (
        <SectionCard title="Comunicações" description="WhatsApp e ligações">
          <p className="text-sm text-muted-foreground">
            A recepção encontra pacientes e abre WhatsApp ou ligação diretamente em Comunicações.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/app/communications">Abrir Comunicações</Link>
          </Button>
        </SectionCard>
      ) : null}

      {active === "seguranca" ? (
        <SectionCard title="Segurança" description="Acesso e sessão">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Autenticação" value="Auth.js / JWT" />
            <Field label="Controle de acesso" value="RBAC ativo" />
            <Field label="Multi-tenant" value="Isolamento por clínica" />
            <Field label="Tema" value="Claro (forçado)" />
          </div>
        </SectionCard>
      ) : null}

      {active === "integracoes" ? (
        <SectionCard title="Integrações" description="Conexões externas">
          <p className="text-sm text-muted-foreground">
            Nenhuma integração externa está habilitada neste ambiente. WhatsApp e ligações usam os
            links nativos do dispositivo.
          </p>
        </SectionCard>
      ) : null}

      {active === "planos" ? (
        <SectionCard title="Planos" description="Assinatura da clínica">
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
              Plano atual
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{PLAN_LABELS[plan]}</p>
          </div>
          <div className="mt-3">
            <InfoRow label="Status" value="Ativo" />
            <InfoRow label="Idioma" value="Português (BR)" />
            <InfoRow label="Moeda" value="Real (R$)" />
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
