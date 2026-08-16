"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import type { PatientAppointmentHistoryDTO, PatientClientDTO } from "../dto/patient.dto";
import {
  deletePatientAction,
  getPatientAction,
  listPatientAppointmentHistoryAction,
} from "../actions/patient.actions";
import { formatCpf, formatPhone } from "../utils/patient.utils";
import { PatientAvatar } from "./patient-avatar";
import { PatientStatusBadge } from "./patient-status-badge";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientAnamnesisTab } from "./patient-tabs/anamnesis";
import { PatientBudgetsTab } from "./patient-tabs/budgets";
import { PatientClinicalRecordTab } from "./patient-tabs/clinical-record";
import { PatientDocumentsTab } from "./patient-tabs/documents";
import { PatientFinancialTab } from "./patient-tabs/financial";
import { PatientOdontogramTab } from "./patient-tabs/odontogram-placeholder";
import { PatientOverviewTab } from "./patient-tabs/overview";
import { PatientTreatmentPlanTab } from "./patient-tabs/treatment-plan";

const TAB_TRIGGER =
  "rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary";

function whatsappHref(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/55${digits}` : null;
}

function telHref(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits ? `tel:+55${digits}` : null;
}

export function PatientRecord({
  patientId,
  canManage,
  canManageClinical,
  canManageOdontogram,
}: {
  patientId: string;
  canManage: boolean;
  canManageClinical: boolean;
  canManageOdontogram: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "cadastro";
  const [patient, setPatient] = useState<PatientClientDTO | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointmentHistoryDTO[]>([]);
  const [tab, setTab] = useState(initialTab);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    void getPatientAction(patientId).then((result) => {
      if (!result.success) {
        toast.error(result.error);
        router.push("/app/patients");
        return;
      }
      setPatient(result.data);
    });
    void listPatientAppointmentHistoryAction(patientId).then((result) => {
      if (result.success) setAppointments(result.data);
    });
  }, [patientId, router]);

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((item) => new Date(item.startsAt).getTime() >= now && item.status !== "CANCELED")
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  }, [appointments]);

  if (!patient) return <PageSkeleton />;

  const wa = whatsappHref(patient.whatsapp ?? patient.phone);
  const call = telHref(patient.phone);
  const currentPatientId = patient.id;

  function handleDelete() {
    startDelete(async () => {
      const result = await deletePatientAction({ id: currentPatientId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Paciente removido");
      router.push("/app/patients");
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        <Link href="/app/patients" className="hover:text-primary">
          Pacientes
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-foreground">{patient.fullName}</span>
      </p>

      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Button asChild variant="outline" size="icon" className="mt-1 size-9 shrink-0">
              <Link href="/app/patients" aria-label="Voltar">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <PatientAvatar
              name={patient.fullName}
              photoUrl={patient.photoUrl}
              className="size-16"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">
                  {patient.fullName}
                </h1>
                <PatientStatusBadge isActive={patient.isActive} status={patient.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Paciente desde{" "}
                {new Intl.DateTimeFormat("pt-BR").format(new Date(patient.createdAt))}
                {patient.age != null ? ` · ${patient.age} anos` : ""}
                {patient.birthDate
                  ? ` (${new Intl.DateTimeFormat("pt-BR").format(new Date(patient.birthDate))})`
                  : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {patient.cpf ? <span>CPF {formatCpf(patient.cpf)}</span> : null}
                {patient.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5 text-primary" />
                    {formatPhone(patient.phone)}
                  </span>
                ) : null}
                {patient.whatsapp ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </span>
                ) : null}
                {patient.email ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3.5 text-primary" />
                    {patient.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {wa ? (
              <Button asChild variant="outline" size="sm" className="rounded-lg text-success">
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
            {call ? (
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <a href={call}>
                  <Phone className="size-3.5" />
                  Ligar
                </a>
              </Button>
            ) : null}
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setFormOpen(true)}
              >
                <Pencil className="size-3.5" />
                Editar
              </Button>
            ) : null}
            {canManage ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8 rounded-lg">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {patient.fullName} será removido da listagem. O histórico será preservado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      <Trash2 className="mr-1 size-3.5" />
                      {deleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Próxima consulta</p>
            <p className="mt-1 text-sm font-medium">
              {nextAppointment
                ? `${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(nextAppointment.startsAt))} · ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(nextAppointment.startsAt))}`
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Alerta de retorno</p>
            <p className={`mt-1 text-sm font-medium ${patient.hasReturnAlert ? "text-warning" : ""}`}>
              {patient.hasReturnAlert ? "Retorno pendente" : "Sem alerta"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Consultar CPF</p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary"
              onClick={() => {
                if (!patient.cpf) {
                  toast.message("Este paciente não possui CPF cadastrado.");
                  return;
                }
                void navigator.clipboard.writeText(patient.cpf.replace(/\D/g, ""));
                toast.success("CPF copiado");
              }}
            >
              <Search className="size-3.5" />
              {patient.cpf ? formatCpf(patient.cpf) : "Indisponível"}
            </button>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="cadastro" className={TAB_TRIGGER}>
            Cadastro
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className={TAB_TRIGGER}>
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="financeiro" className={TAB_TRIGGER}>
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="fotos" className={TAB_TRIGGER}>
            Fotos
          </TabsTrigger>
          <TabsTrigger value="tratamento" className={TAB_TRIGGER}>
            Tratamento
          </TabsTrigger>
          <TabsTrigger value="odontograma" className={TAB_TRIGGER}>
            Odontograma
          </TabsTrigger>
          <TabsTrigger value="anamnese" className={TAB_TRIGGER}>
            Anamnese
          </TabsTrigger>
          <TabsTrigger value="documentos" className={TAB_TRIGGER}>
            Documentos
          </TabsTrigger>
          <TabsTrigger value="exames" className={TAB_TRIGGER}>
            Exames
          </TabsTrigger>
          <TabsTrigger value="recibos" className={TAB_TRIGGER}>
            Recibos
          </TabsTrigger>
        </TabsList>
        <div className="pt-5">
          <TabsContent value="cadastro">
            <PatientOverviewTab patient={patient} />
          </TabsContent>
          <TabsContent value="orcamentos">
            <PatientBudgetsTab patient={patient} canManage={canManage} />
          </TabsContent>
          <TabsContent value="financeiro">
            <PatientFinancialTab patient={patient} />
          </TabsContent>
          <TabsContent value="fotos">
            <EmptyModule title="Fotos" description="Nenhuma foto clínica cadastrada para este paciente." />
          </TabsContent>
          <TabsContent value="tratamento">
            <div className="space-y-6">
              <PatientTreatmentPlanTab patient={patient} canManage={canManage} />
              <PatientClinicalRecordTab patient={patient} canManage={canManageClinical} />
            </div>
          </TabsContent>
          <TabsContent value="odontograma">
            <PatientOdontogramTab patient={patient} canManage={canManageOdontogram} />
          </TabsContent>
          <TabsContent value="anamnese">
            <PatientAnamnesisTab patient={patient} />
          </TabsContent>
          <TabsContent value="documentos">
            <PatientDocumentsTab patient={patient} />
          </TabsContent>
          <TabsContent value="exames">
            <EmptyModule title="Exames" description="Nenhum exame cadastrado para este paciente." />
          </TabsContent>
          <TabsContent value="recibos">
            <PatientFinancialTab patient={patient} receiptsOnly />
          </TabsContent>
        </div>
      </Tabs>

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={patient}
        onSaved={(updated) => setPatient(updated)}
      />
    </div>
  );
}

function EmptyModule({ title, description }: { title: string; description: string }) {
  return (
    <div className="surface-card p-8 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

