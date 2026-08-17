"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Plan } from "@prisma/client";
import { PLAN_LABELS } from "@/modules/app-shell/labels";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  updateClinicPreferencesAction,
  updateClinicProfileAction,
  uploadClinicLogoAction,
} from "../actions/settings.actions";

export type ClinicSettingsData = {
  name: string;
  plan: Plan;
  logo: string | null;
  phone: string | null;
  email: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: boolean;
};

export function ClinicSettingsForm({
  initial,
  canManage,
}: {
  initial: ClinicSettingsData;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const [logoPending, setLogoPending] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const [hasLogo, setHasLogo] = useState(Boolean(initial.logo));
  const [profile, setProfile] = useState({
    name: initial.name,
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    cnpj: initial.cnpj ?? "",
    address: initial.address ?? "",
    city: initial.city ?? "",
    state: initial.state ?? "",
    zipCode: initial.zipCode ?? "",
  });
  const [prefs, setPrefs] = useState({
    language: initial.language,
    timezone: initial.timezone,
    dateFormat: initial.dateFormat,
    currency: initial.currency,
    notifications: initial.notifications,
  });

  function saveProfile() {
    start(async () => {
      const result = await updateClinicProfileAction(profile);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    });
  }

  function savePrefs() {
    start(async () => {
      const result = await updateClinicPreferencesAction(prefs);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    });
  }

  function onLogo(file: File | null) {
    if (!file) return;
    setLogoPending(true);
    start(async () => {
      try {
        const form = new FormData();
        form.set("file", file);
        const result = await uploadClinicLogoAction(form);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(result.message);
        setHasLogo(true);
        setLogoVersion((value) => value + 1);
      } finally {
        setLogoPending(false);
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard
        title="Dados da clínica"
        description="Informações básicas da sua clínica"
        className="lg:col-span-2"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome da clínica">
            <Input
              value={profile.name}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
            />
          </Field>
          <Field label="Plano contratado">
            <Input value={PLAN_LABELS[initial.plan]} disabled />
          </Field>
          <Field label="Telefone">
            <Input
              value={profile.phone}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={profile.email}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
            />
          </Field>
          <Field label="CNPJ">
            <Input
              value={profile.cnpj}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, cnpj: event.target.value }))}
            />
          </Field>
          <Field label="CEP">
            <Input
              value={profile.zipCode}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, zipCode: event.target.value }))}
            />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input
              value={profile.address}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={profile.city}
              disabled={!canManage}
              onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))}
            />
          </Field>
          <Field label="UF">
            <Input
              maxLength={2}
              value={profile.state}
              disabled={!canManage}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))
              }
            />
          </Field>
        </div>
        {canManage ? (
          <Button type="button" size="sm" className="mt-4" onClick={saveProfile} disabled={pending}>
            {pending && !logoPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Você pode visualizar, mas não alterar as configurações da clínica.
          </p>
        )}
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Logo" description="Identidade visual da clínica">
          <div className="flex items-center gap-3">
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/company/logo?v=${logoVersion}`}
                alt="Logo da clínica"
                className="size-16 rounded-lg border border-border object-contain bg-muted/40"
                onError={() => setHasLogo(false)}
              />
            ) : (
              <div className="grid size-16 place-items-center rounded-lg border border-dashed border-border bg-muted/40 text-center text-[10px] leading-tight text-muted-foreground">
                Sem
                <br />
                logo
              </div>
            )}
            {canManage ? (
              <div className="min-w-0 flex-1">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={logoPending}
                  onChange={(event) => onLogo(event.target.files?.[0] ?? null)}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {logoPending ? "Enviando logo..." : "PNG, JPG ou WebP."}
                </p>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Preferências básicas" description="Idioma, fuso e notificações">
          <div className="space-y-3">
            <Field label="Idioma">
              <select
                className="h-9 w-full rounded-lg border border-input bg-input-background px-3 text-sm"
                value={prefs.language}
                disabled={!canManage}
                onChange={(event) => setPrefs((prev) => ({ ...prev, language: event.target.value }))}
              >
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English</option>
              </select>
            </Field>
            <Field label="Fuso horário">
              <Input
                value={prefs.timezone}
                disabled={!canManage}
                onChange={(event) => setPrefs((prev) => ({ ...prev, timezone: event.target.value }))}
              />
            </Field>
            <Field label="Formato de data">
              <Input
                value={prefs.dateFormat}
                disabled={!canManage}
                onChange={(event) => setPrefs((prev) => ({ ...prev, dateFormat: event.target.value }))}
              />
            </Field>
            <Field label="Moeda">
              <Input
                value={prefs.currency}
                disabled={!canManage}
                onChange={(event) => setPrefs((prev) => ({ ...prev, currency: event.target.value }))}
              />
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="clinic-notifications">Notificações</Label>
              <Switch
                id="clinic-notifications"
                checked={prefs.notifications}
                disabled={!canManage}
                onCheckedChange={(value) => setPrefs((prev) => ({ ...prev, notifications: value }))}
              />
            </div>
          </div>
          {canManage ? (
            <Button type="button" size="sm" className="mt-4" variant="outline" onClick={savePrefs} disabled={pending}>
              {pending && !logoPending ? "Salvando..." : "Salvar preferências"}
            </Button>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
