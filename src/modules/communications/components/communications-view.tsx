"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/page-header";
import { PageSkeleton } from "@/shared/components/page-skeleton";
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
    <div className="space-y-6">
      <PageHeader
        title="Comunicações"
        description="Encontre rapidamente o contato dos seus pacientes."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="WhatsApp" value={String(stats.whatsapp)} hint="Contatos via WhatsApp" />
        <Stat label="Telefones" value={String(stats.phone)} hint="Números para ligação" />
        <Stat label="E-mails" value={String(stats.email)} hint="Contatos por e-mail" />
        <Stat label="Total" value={String(stats.total)} hint="Pacientes nesta busca" />
      </section>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, telefone ou CPF do paciente..."
          className="rounded-lg pl-9"
        />
      </div>

      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((patient) => {
                const phone = digits(patient.phone);
                const wa = digits(patient.whatsapp ?? patient.phone);
                return (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PatientAvatar name={patient.fullName} photoUrl={patient.photoUrl} />
                        <div>
                          <p className="font-medium">{patient.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {patient.cpf ? formatCpf(patient.cpf) : "CPF —"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPhone(patient.phone) || "—"}</TableCell>
                    <TableCell>
                      {wa.length >= 10 ? (
                        <a
                          href={`https://wa.me/55${wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-success hover:underline"
                        >
                          <MessageCircle className="size-3.5" />
                          Abrir WhatsApp
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {phone.length >= 8 ? (
                        <Button asChild size="sm" className="rounded-lg">
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
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
