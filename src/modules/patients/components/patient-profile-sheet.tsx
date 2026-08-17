"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { PatientClientDTO } from "../dto/patient.dto";
import { deletePatientAction } from "../actions/patient.actions";
import { PatientAvatar } from "./patient-avatar";
import { PatientStatusBadge } from "./patient-status-badge";
import { PatientBudgetsTab } from "./patient-tabs/budgets";
import { PatientDocumentsTab } from "./patient-tabs/documents";
import { PatientFinancialTab } from "./patient-tabs/financial";
import { PatientOdontogramTab } from "./patient-tabs/odontogram-placeholder";
import { PatientTreatmentPlanTab } from "./patient-tabs/treatment-plan";
import { PatientClinicalRecordTab } from "./patient-tabs/clinical-record";
import { PatientAnamnesisTab } from "./patient-tabs/anamnesis";
import { PatientOverviewTab } from "./patient-tabs/overview";
import { formatCpf, formatPhone } from "../utils/patient.utils";

export function PatientProfileSheet({
  patient,
  open,
  onOpenChange,
  canManage,
  canManageClinical = false,
  onEdit,
  onDeleted,
  initialTab = "overview",
}: {
  patient: PatientClientDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  canManageClinical?: boolean;
  onEdit: (patient: PatientClientDTO) => void;
  onDeleted: (id: string) => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [deleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [initialTab, open, patient?.id]);

  function handleDelete() {
    if (!patient) return;
    startDeleteTransition(async () => {
      const result = await deletePatientAction({ id: patient.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Paciente removido");
      onOpenChange(false);
      onDeleted(patient.id);
    });
  }

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-3xl">
        <SheetHeader className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <PatientAvatar
              name={patient.fullName}
              photoUrl={patient.photoUrl}
              className="size-14"
            />
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-xl tracking-[-0.03em]">
                {patient.fullName}
              </SheetTitle>
              <SheetDescription>
                {patient.age != null ? `${patient.age} anos` : "Idade —"}
                {formatPhone(patient.phone) ? ` · ${formatPhone(patient.phone)}` : ""}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PatientStatusBadge isActive={patient.isActive} status={patient.status} />
                {patient.whatsapp ? (
                  <span className="text-xs text-muted-foreground">
                    WhatsApp {formatPhone(patient.whatsapp)}
                  </span>
                ) : null}
                {patient.cpf ? (
                  <span className="text-xs text-muted-foreground">CPF {formatCpf(patient.cpf)}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => onEdit(patient)}
              >
                <Pencil className="mr-1 size-3.5" />
                Editar
              </Button>
            )}
            {canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {patient.fullName} será removido da listagem. O histórico será preservado e
                      poderá ser recuperado por um administrador.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      {deleting ? "Excluindo..." : "Excluir paciente"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canManage && (
              <Button asChild size="sm" className="rounded-lg">
                <Link href={`/app/agenda?patientId=${patient.id}`}>
                  <CalendarPlus className="mr-1 size-3.5" />
                  Nova consulta
                </Link>
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="mt-4 flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-lg">
              Visão geral
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="rounded-lg">
              Anamnese
            </TabsTrigger>
            <TabsTrigger value="clinical" className="rounded-lg">
              Prontuário
            </TabsTrigger>
            <TabsTrigger value="odontogram" className="rounded-lg">
              Odontograma
            </TabsTrigger>
            <TabsTrigger value="treatment" className="rounded-lg">
              Tratamentos
            </TabsTrigger>
            <TabsTrigger value="budgets" className="rounded-lg">
              Orçamentos
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-lg">
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-lg">
              Documentos
            </TabsTrigger>
          </TabsList>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-6">
            <TabsContent value="overview" className="mt-0">
              <PatientOverviewTab patient={patient} />
            </TabsContent>
            <TabsContent value="anamnesis" className="mt-0">
              <PatientAnamnesisTab patient={patient} canManage={canManageClinical} />
            </TabsContent>
            <TabsContent value="clinical" className="mt-0">
              <PatientClinicalRecordTab patient={patient} canManage={canManageClinical} />
            </TabsContent>
            <TabsContent value="odontogram" className="mt-0">
              <PatientOdontogramTab patient={patient} canManage={canManage} />
            </TabsContent>
            <TabsContent value="treatment" className="mt-0">
              <PatientTreatmentPlanTab patient={patient} canManage={canManage} />
            </TabsContent>
            <TabsContent value="budgets" className="mt-0">
              <PatientBudgetsTab patient={patient} canManage={canManage} />
            </TabsContent>
            <TabsContent value="finance" className="mt-0">
              <PatientFinancialTab patient={patient} />
            </TabsContent>
            <TabsContent value="docs" className="mt-0">
              <PatientDocumentsTab patient={patient} canManage={canManage} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
