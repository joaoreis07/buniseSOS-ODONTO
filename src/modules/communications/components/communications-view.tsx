"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, MessageCircle, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/components/empty-state";
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

const PAGE_SIZE = 50;

function digits(value: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function formatLastContact(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
}

export function CommunicationsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PatientClientDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const load = useCallback(async (query: string, nextPage: number) => {
    const result = await listPatientsAction({
      search: query.trim() || undefined,
      status: "ACTIVE",
      page: nextPage,
      pageSize: PAGE_SIZE,
      sort: "name_asc",
    });
    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setItems(result.data.items);
    setTotal(result.data.total);
    setTotalPages(result.data.totalPages);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      void load(search, page);
    }, 180);
    return () => clearTimeout(handle);
  }, [load, page, search]);

  const stats = useMemo(() => {
    const whatsapp = items.filter((item) => digits(item.whatsapp ?? item.phone).length >= 10).length;
    const phone = items.filter((item) => digits(item.phone).length >= 8).length;
    const email = items.filter((item) => Boolean(item.email)).length;
    return { whatsapp, phone, email, total: items.length };
  }, [items]);

  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, total);

  if (loading && items.length === 0) return <PageSkeleton />;

  if (error && items.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Comunicações"
          description="Encontre rapidamente o contato dos seus pacientes."
        />
        <div className="surface-card p-5">
          <p className="font-medium text-destructive">Não foi possível carregar os contatos</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => {
              setLoading(true);
              void load(search, page);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Comunicações"
        description="Encontre rapidamente o contato dos seus pacientes."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          size="compact"
          label="WhatsApp"
          value={String(stats.whatsapp)}
          hint="Contatos via WhatsApp"
          icon={MessageCircle}
          tone="success"
        />
        <StatCard
          size="compact"
          label="Ligações"
          value={String(stats.phone)}
          hint="Números para ligação"
          icon={Phone}
          tone="primary"
        />
        <StatCard
          size="compact"
          label="E-mails"
          value={String(stats.email)}
          hint="Contatos por e-mail"
          icon={Mail}
          tone="info"
        />
        <StatCard
          size="compact"
          label="Total de contatos"
          value={String(stats.total)}
          hint="Pacientes nesta busca"
          icon={Users}
          tone="neutral"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, telefone ou CPF do paciente..."
              className="h-8 pl-8"
            />
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum contato encontrado"
              description="Ajuste a busca ou cadastre pacientes ativos para iniciar o contato."
              actionLabel="Abrir pacientes"
              onAction={() => {
                window.location.href = "/app/patients";
              }}
            />
          ) : (
            <div className="surface-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Paciente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Última consulta</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((patient) => {
                    const phone = digits(patient.phone);
                    const wa = digits(patient.whatsapp ?? patient.phone);
                    return (
                      <TableRow key={patient.id}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2.5">
                            <PatientAvatar
                              name={patient.fullName}
                              photoUrl={patient.photoUrl}
                              className="size-8"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/app/patients/${patient.id}`}
                                className="block truncate font-medium text-foreground hover:text-primary"
                              >
                                {patient.fullName}
                              </Link>
                              <p className="truncate text-xs text-muted-foreground">
                                {patient.cpf ? formatCpf(patient.cpf) : "CPF —"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {formatPhone(patient.phone) || "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate py-2 text-muted-foreground">
                          {patient.email || "—"}
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {formatLastContact(patient.lastAppointmentAt)}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-wrap items-center gap-1">
                            {wa.length >= 10 ? (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="border-success/40 text-success hover:bg-success/10"
                              >
                                <a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer">
                                  <MessageCircle className="size-3.5" />
                                  WhatsApp
                                </a>
                              </Button>
                            ) : null}
                            {phone.length >= 8 ? (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="border-primary/40 text-primary hover:bg-primary/10"
                              >
                                <a href={`tel:+55${phone}`}>
                                  <Phone className="size-3.5" />
                                  Ligar
                                </a>
                              </Button>
                            ) : null}
                            {patient.email ? (
                              <Button asChild variant="outline" size="icon" className="size-8" aria-label="E-mail">
                                <a href={`mailto:${patient.email}`}>
                                  <Mail className="size-3.5" />
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Mostrando {firstRow} a {lastRow} de {total} contato(s) ativos
                </p>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="px-2 text-xs text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <SectionCard title="Atalhos">
            <div className="grid gap-1.5">
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/app/patients">
                  <Users className="size-3.5" />
                  Abrir pacientes
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                WhatsApp, ligação e e-mail abrem o aplicativo do dispositivo. Não há envio automático.
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Dicas">
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-[var(--success-foreground)]" />
                WhatsApp abre a conversa no aplicativo ou no WhatsApp Web.
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Ligar usa o discador do computador ou do celular.
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-[var(--info-foreground)]" />
                E-mail abre o cliente de e-mail padrão.
              </li>
            </ul>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
