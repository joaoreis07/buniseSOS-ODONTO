"use client";

import Link from "next/link";
import {
  CalendarDays,
  ArrowRight,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Brand, Pill } from "@/shared/components/brand";
import { Button } from "@/shared/components/ui/button";
import { DemoButton } from "@/modules/marketing/components/demo-button";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/register">Começar</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 lg:pt-16">
        <Pill>
          <Sparkles className="size-3" />
          SaaS premium para clínicas odontológicas
        </Pill>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
          Gestão odontológica com a elegância do BusinessOS.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Agenda, pacientes, odontograma, orçamentos e financeiro em uma plataforma
          limpa, rápida e feita para o ritmo da clínica.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/register">
              Criar clínica
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <DemoButton />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Explore a clínica demo sem criar conta · dados fictícios para validação
        </p>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Agenda moderna",
              body: "Visão diária, semanal e mensal com fluxo inspirado no Google Calendar.",
            },
            {
              icon: Stethoscope,
              title: "Clínico completo",
              body: "Pacientes, odontograma e planos de tratamento no mesmo workspace.",
            },
            {
              icon: Shield,
              title: "Multi-tenant seguro",
              body: "Isolamento por clínica, RBAC e autenticação da família BusinessOS.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="surface-card p-5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="size-4" />
              </span>
              <h2 className="mt-4 text-sm font-semibold tracking-[-0.02em] text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
