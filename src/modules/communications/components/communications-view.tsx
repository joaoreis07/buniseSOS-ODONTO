"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/page-header";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { SectionCard } from "@/shared/components/section-card";
import { StatCard } from "@/shared/components/stat-card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { listPatientsAction } from "@/modules/patients/actions/patient.actions";
import type { PatientClientDTO } from "@/modules/patients/dto/patient.dto";
import { formatCpf, formatPhone } from "@/modules/patients/utils/patient.utils";
import { PatientAvatar } from "@/modules/patients/components/patient-avatar";

function digits(value: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export function CommunicationsView() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PatientClientDTO[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      void listPatientsAction({
        search: search.trim() || undefined,
        status: "ACTIVE",
        page: 1,
        pageSize: 50,
        sort: "name_asc",
      }).then((result) => {
        if (!result.success) {
          toast.error(result.error);
          setLoading(false);
          return;
        }
        setItems(result.data.items);
        setLoading(false);
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [search]);

  const stats = useMemo(() => {
    const whatsapp = items.filter((item) => digits(item.whatsapp ?? item.phone).length >= 10).length;
    const phone = items.filter((item) => digits(item.phone).length >= 8).length;
    const email = items.filter((item) => Boolean(item.email)).length;
    return { whatsapp, phone, email, total: items.length };
  }, [items]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Comunicações"
        description="Encontre rapidamente o contato dos seus pacientes."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="WhatsApp"
          value={String(stats.whatsapp)}
          hint="Contatos via WhatsApp"
          icon={MessageCircle}
          tone="success"
        />
        <StatCard
          label="Ligações"
          value={String(stats.phone)}
          hint="Números para ligação"
          icon={Phone}
          tone="primary"
        />
        <StatCard
          label="E-mails"
          value={String(stats.email)}
          hint="Contatos por e-mail"
          icon={Mail}
          tone="info"
        />
        <StatCard
          label="Total de contatos"
          value={String(stats.total)}
          hint="Pacientes nesta busca"
          icon={Users}
          tone="neutral"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, telefone ou CPF do paciente..."
              className="h-10 pl-9"
            />
          </div>

          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="surface-subtle hover:bg-transparent">
                    <TableHead className="px-5">Paciente</TableHead>
                    <TableHead className="px-5">Telefone</TableHead>
                    <TableHead className="px-5">WhatsApp</TableHead>
                    <TableHead className="px-5 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-8 text-muted-foreground">
                        Nenhum paciente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((patient) => {
                      const phone = digits(patient.phone);
                      const wa = digits(patient.whatsapp ?? patient.phone);
                      return (
                        <TableRow key={patient.id}>
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <PatientAvatar name={patient.fullName} photoUrl={patient.photoUrl} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {patient.fullName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {patient.cpf ? formatCpf(patient.cpf) : "CPF —"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-foreground">
                              <Phone className="size-3.5 text-muted-foreground" />
                              {formatPhone(patient.phone) || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3.5">
                            {wa.length >= 10 ? (
                              <a
                                href={`https://wa.me/55${wa}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 font-medium text-success hover:underline"
                              >
                                <MessageCircle className="size-3.5" />
                                Abrir WhatsApp
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-right">
                            {phone.length >= 8 ? (
                              <Button asChild size="sm" variant="outline">
                                <a href={`tel:+55${phone}`}>
                                  <Phone className="size-3.5" />
                                  Ligar
                                </a>
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Atalhos rápidos">
            <div className="grid gap-2">
              <Button asChild variant="outline" className="h-auto justify-start py-2.5">
                <Link href="/app/patients">
                  <MessageCircle className="size-4 text-success" />
                  Novo WhatsApp
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto justify-start py-2.5">
                <Link href="/app/patients">
                  <Phone className="size-4 text-primary" />
                  Ligar para paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto justify-start py-2.5">
                <Link href="/app/patients">
                  <Mail className="size-4" />
                  Enviar e-mail
                </Link>
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Dicas">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
                  <MessageCircle className="size-3.5" />
                </span>
                Clique em <span className="font-medium text-foreground">Abrir WhatsApp</span> para
                iniciar a conversa no WhatsApp Web.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-primary">
                  <Phone className="size-3.5" />
                </span>
                <span>
                  <span className="font-medium text-foreground">Ligar</span> abre o discador do
                  computador ou celular.
                </span>
              </li>
            </ul>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
