"use client";

import { useState, type ReactNode } from "react";
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
import { STARTER_PATIENT_LIMIT } from "@/modules/billing/plan-limits";
import { PageHeader } from "@/shared/components/page-header";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { ClinicSettingsForm, type ClinicSettingsData } from "./clinic-settings-form";

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

const VISIBLE_PLANS: Plan[] = ["STARTER", "PROFESSIONAL", "BUSINESS"];

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

function InfoNote({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-muted-foreground">{children}</p>;
}

export function SettingsView({
  plan,
  canManage,
  initialTab,
  clinic,
}: {
  plan: Plan;
  canManage: boolean;
  initialTab?: CategoryId;
  clinic: ClinicSettingsData;
}) {
  const [active, setActive] = useState<CategoryId>(initialTab ?? "geral");

  return (
    <div className="space-y-4">
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
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {category.label}
            </button>
          );
        })}
      </nav>

      {active === "geral" ? <ClinicSettingsForm initial={clinic} canManage={canManage} /> : null}

      {active === "usuarios" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Usuários" description="Área informativa">
            <InfoNote>
              Os papéis Administrador, Gerente e Colaborador já estão ativos. O editor de convites e
              usuários ainda não está disponível nesta tela.
            </InfoNote>
          </SectionCard>
          <SectionCard title="Seu perfil" description="Dados da conta conectada">
            <InfoNote>Nome, e-mail e senha são gerenciados na tela de perfil.</InfoNote>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/app/profile">Abrir meu perfil</Link>
            </Button>
          </SectionCard>
        </div>
      ) : null}

      {active === "permissoes" ? (
        <SectionCard title="Permissões" description="Papéis existentes no sistema">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Administrador" value="Acesso total" />
            <Field label="Gerente" value="Gestão e financeiro" />
            <Field label="Colaborador" value="Agenda e pacientes" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            As permissões são aplicadas no servidor (RBAC) e refletem automaticamente nos menus e
            ações disponíveis. Não é possível criar papéis nesta tela.
          </p>
        </SectionCard>
      ) : null}

      {active === "financeiro" ? (
        <SectionCard title="Financeiro" description="Área informativa">
          <InfoNote>
            Lançamentos, parcelas e recebimentos ficam na ficha do paciente, na aba Financeiro. Não
            há categorias de despesa nem métodos de pagamento configuráveis nesta tela.
          </InfoNote>
        </SectionCard>
      ) : null}

      {active === "agenda" ? (
        <SectionCard title="Agenda" description="Horários e profissionais">
          <InfoNote>
            Horários, profissionais, consultórios e cadeiras já estão disponíveis no módulo de
            Agenda, com filtros por profissional e consultório.
          </InfoNote>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/app/agenda">Abrir Agenda</Link>
          </Button>
        </SectionCard>
      ) : null}

      {active === "comunicacoes" ? (
        <SectionCard title="Comunicações" description="Área informativa">
          <InfoNote>
            Não há gateway de WhatsApp, e-mail ou ligação nesta tela. A recepção encontra pacientes
            e abre o aplicativo do dispositivo em Comunicações.
          </InfoNote>
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
            <Field label="Tema" value="Escuro" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Senha e sessão são gerenciadas no perfil e no login. Os mecanismos de autenticação não
            são alterados nesta tela.
          </p>
        </SectionCard>
      ) : null}

      {active === "integracoes" ? (
        <SectionCard title="Integrações" description="Área informativa">
          <InfoNote>
            Nenhuma integração externa está habilitada neste ambiente. WhatsApp e ligações usam os
            links nativos do dispositivo.
          </InfoNote>
        </SectionCard>
      ) : null}

      {active === "planos" ? (
        <SectionCard title="Planos" description="Assinatura da clínica">
          <div className="grid gap-3 md:grid-cols-3">
            {VISIBLE_PLANS.map((item) => {
              const current = item === plan;
              return (
                <div
                  key={item}
                  className={cn(
                    "rounded-lg border px-3 py-3",
                    current ? "border-brand-200 bg-brand-50" : "border-border bg-muted/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{PLAN_LABELS[item]}</p>
                    {current ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground">
                        Atual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {item === "STARTER"
                      ? `Até ${STARTER_PATIENT_LIMIT} pacientes.`
                      : "Sem limite de pacientes neste plano."}
                  </p>
                </div>
              );
            })}
          </div>
          {plan === "ENTERPRISE" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Plano atual: {PLAN_LABELS.ENTERPRISE}.
            </p>
          ) : null}
          {plan === "STARTER" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Ao atingir {STARTER_PATIENT_LIMIT} pacientes, o cadastro de novos pacientes é
              bloqueado até o upgrade.
            </p>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            O checkout de assinatura ainda não está disponível nesta tela.
          </p>
        </SectionCard>
      ) : null}
    </div>
  );
}
