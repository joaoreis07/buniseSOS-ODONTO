"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  BellRing,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Folder,
  History,
  LayoutDashboard,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Stethoscope,
  StickyNote,
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
import { formatCpf, formatPhone, GENDER_LABELS } from "../utils/patient.utils";
import { PatientAvatar } from "./patient-avatar";
import { PatientStatusBadge } from "./patient-status-badge";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientAppointmentsTab } from "./patient-tabs/appointments";
import { PatientBudgetsTab } from "./patient-tabs/budgets";
import { PatientClinicalRecordTab } from "./patient-tabs/clinical-record";
import { PatientDocumentsTab } from "./patient-tabs/documents";
import { PatientFinancialTab } from "./patient-tabs/financial";
import { PatientHistoryTab } from "./patient-tabs/history";
import { PatientNotesTab } from "./patient-tabs/notes";
import { PatientOverviewTab } from "./patient-tabs/overview";
import { PatientTreatmentPlanTab } from "./patient-tabs/treatment-plan";

const TAB_TRIGGER =
  "shrink-0 gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3.5 py-3 text-[13px] font-medium whitespace-nowrap text-muted-foreground shadow-none transition hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none";

const TABS = [
  { value: "resumo", label: "Resumo", icon: LayoutDashboard },
  { value: "agenda", label: "Agenda", icon: CalendarDays },
  { value: "tratamentos", label: "Tratamentos", icon: Stethoscope },
  { value: "orcamentos", label: "Orçamentos", icon: FileText },
  { value: "financeiro", label: "Financeiro", icon: CircleDollarSign },
  { value: "documentos", label: "Documentos", icon: Folder },
  { value: "anotacoes", label: "Anotações", icon: StickyNote },
  { value: "historico", label: "Histórico", icon: History },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const TAB_ALIASES: Record<string, TabValue> = {
  cadastro: "resumo",
  resumo: "resumo",
  agenda: "agenda",
  tratamento: "tratamentos",
  tratamentos: "tratamentos",
  odontograma: "tratamentos",
  anamnese: "tratamentos",
  orcamentos: "orcamentos",
  financeiro: "financeiro",
  recibos: "financeiro",
  documentos: "documentos",
  fotos: "documentos",
  exames: "documentos",
  anotacoes: "anotacoes",
  historico: "historico",
};

function resolveTab(raw: string | null): TabValue {
  if (!raw) return "resumo";
  return TAB_ALIASES[raw] ?? "resumo";
}

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
  canApprove = false,
  canManageFinance = false,
}: {
  patientId: string;
  canManage: boolean;
  canManageClinical: boolean;
  canManageOdontogram: boolean;
  canApprove?: boolean;
  canManageFinance?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<PatientClientDTO | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointmentHistoryDTO[]>([]);
  const [tab, setTab] = useState<TabValue>(() => resolveTab(searchParams.get("tab")));
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    setTab(resolveTab(searchParams.get("tab")));
  }, [searchParams]);

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

  function handleTabChange(value: string) {
    const next = resolveTab(value);
    setTab(next);
    router.replace(`/app/patients/${patientId}?tab=${next}`, { scroll: false });
  }

  if (!patient) return <PageSkeleton />;

  const wa = whatsappHref(patient.whatsapp ?? patient.phone);
  const call = telHref(patient.phone);
  const currentPatientId = patient.id;
  const genderLabel = GENDER_LABELS[patient.gender];

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
        <span className="mx-1.5">›</span>
        <span className="text-foreground">{TABS.find((item) => item.value === tab)?.label}</span>
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
                {genderLabel && genderLabel !== "Não informado" ? ` · ${genderLabel}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-foreground">
                {patient.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 text-primary" />
                    {formatPhone(patient.phone)}
                    <span className="status-pill status-info">Principal</span>
                  </span>
                ) : null}
                {patient.whatsapp ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-success">
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </span>
                ) : null}
                {patient.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-primary" />
                    {patient.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {wa ? (
              <Button asChild variant="outline" className="border-success/30 text-success hover:bg-success/10">
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
            {call ? (
              <Button asChild variant="outline">
                <a href={call}>
                  <Phone className="size-4" />
                  Ligar
                </a>
              </Button>
            ) : null}
            {canManage ? (
              <Button type="button" variant="outline" onClick={() => setFormOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            ) : null}
            {canManage ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="size-9">
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

        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-primary">
              <CalendarClock className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Próxima consulta</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {nextAppointment
                  ? `${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(nextAppointment.startsAt))} · ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(nextAppointment.startsAt))}`
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${patient.hasReturnAlert ? "bg-[var(--warning-surface)] text-[var(--warning-foreground)]" : "bg-muted text-muted-foreground"}`}
            >
              <BellRing className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Alerta de retorno</p>
              <p
                className={`mt-0.5 truncate text-sm font-semibold ${patient.hasReturnAlert ? "text-[var(--warning-foreground)]" : "text-foreground"}`}
              >
                {patient.hasReturnAlert ? "Retorno pendente" : "Sem alerta"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
            onClick={() => {
              if (!patient.cpf) {
                toast.message("Este paciente não possui CPF cadastrado.");
                return;
              }
              void navigator.clipboard.writeText(patient.cpf.replace(/\D/g, ""));
              toast.success("CPF copiado");
            }}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-primary">
              <Search className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Consultar CPF</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-primary">
                {patient.cpf ? formatCpf(patient.cpf) : "Indisponível"}
              </p>
            </div>
          </button>
        </div>
      </section>

      <Tabs value={tab} onValueChange={handleTabChange} className="gap-0">
        <div className="surface-card overflow-x-auto px-2">
          <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className={TAB_TRIGGER}>
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="pt-5">
          <TabsContent value="resumo">
            <PatientOverviewTab patient={patient} appointments={appointments} />
          </TabsContent>
          <TabsContent value="agenda">
            <PatientAppointmentsTab patient={patient} appointments={appointments} canManage={canManage} />
          </TabsContent>
          <TabsContent value="tratamentos">
            <div className="space-y-6">
              <PatientTreatmentPlanTab patient={patient} canManage={canManage} />
              <PatientClinicalRecordTab patient={patient} canManage={canManageClinical} />
            </div>
          </TabsContent>
          <TabsContent value="orcamentos">
            <PatientBudgetsTab
              patient={patient}
              canManage={canManage}
              canApprove={canApprove}
              canManageFinance={canManageFinance}
            />
          </TabsContent>
          <TabsContent value="financeiro">
            <PatientFinancialTab patient={patient} />
          </TabsContent>
          <TabsContent value="documentos">
            <PatientDocumentsTab patient={patient} />
          </TabsContent>
          <TabsContent value="anotacoes">
            <PatientNotesTab patient={patient} />
          </TabsContent>
          <TabsContent value="historico">
            <PatientHistoryTab patient={patient} appointments={appointments} />
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
