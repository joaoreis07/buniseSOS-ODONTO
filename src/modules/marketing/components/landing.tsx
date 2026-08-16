"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ArrowRight,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { Brand, Pill } from "@/shared/components/brand";
import { Button } from "@/shared/components/ui/button";
import { demoLoginAction } from "@/modules/auth/actions/auth.actions";

export function Landing() {
  const router = useRouter();
  const [demoPending, startDemo] = useTransition();

  const openDemo = () => {
    startDemo(async () => {
      const result = await demoLoginAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push("/app");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--brand-50),_transparent_55%),linear-gradient(to_bottom,#fafbfc,#ffffff)]">
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
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
          Gestão odontológica com a elegância do BusinessOS.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
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
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="rounded-xl"
            disabled={demoPending}
            onClick={openDemo}
          >
            {demoPending ? "Abrindo demonstração..." : "Ver demonstração"}
          </Button>
        </div>
        <p className="mt-4 text-sm text-slate-500">
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
              className="rounded-2xl border border-border/80 bg-white/80 p-5 shadow-sm shadow-slate-950/[0.02]"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-4" />
              </span>
              <h2 className="mt-4 text-sm font-semibold tracking-[-0.02em] text-slate-900">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
