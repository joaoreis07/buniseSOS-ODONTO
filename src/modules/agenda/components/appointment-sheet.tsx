"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Play,
  Smile,
  Square,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { updateAppointmentAction } from "../actions/agenda.actions";
import type { AppointmentClientDTO } from "../dto/agenda.dto";
import { STATUS_META, formatTime } from "../utils/agenda.utils";
import { cn } from "@/shared/lib/utils";

export function AppointmentSheet({
  appointment,
  open,
  onOpenChange,
  onUpdated,
  canManage,
  canViewFinance = false,
}: {
  appointment: AppointmentClientDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (appointment: AppointmentClientDTO) => void;
  canManage: boolean;
  canViewFinance?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!appointment) return null;

  const status = STATUS_META[appointment.status];

  function setStatus(next: AppointmentClientDTO["status"], cancelReason?: string) {
    startTransition(async () => {
      const result = await updateAppointmentAction({
        id: appointment!.id,
        status: next,
        cancelReason,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onUpdated(result.data);
      toast.success(result.message ?? "Atualizado");
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 size-3 rounded-full"
              style={{ backgroundColor: appointment.professionalColor }}
            />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl tracking-[-0.03em]">
                {appointment.patientName}
              </SheetTitle>
              <SheetDescription>
                {formatTime(appointment.startsAt)} – {formatTime(appointment.endsAt)}
                {appointment.procedure ? ` · ${appointment.procedure}` : ""}
              </SheetDescription>
            </div>
          </div>
          <span className={cn("status-pill w-fit", status.tone)}>{status.label}</span>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <section className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <Row label="Profissional" value={appointment.professionalName} />
            <Row label="Consultório" value={appointment.roomName ?? "—"} />
            <Row label="Cadeira" value={appointment.chairName ?? "—"} />
            <Row label="Telefone" value={appointment.patientPhone ?? "—"} />
            {appointment.notes && <Row label="Obs." value={appointment.notes} />}
          </section>

          {canManage && (
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Ações rápidas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Action
                  icon={CheckCircle2}
                  label="Confirmar"
                  disabled={pending || appointment.status === "CONFIRMED"}
                  onClick={() => setStatus("CONFIRMED")}
                />
                <Action
                  icon={Play}
                  label="Iniciar"
                  disabled={pending || appointment.status === "IN_PROGRESS"}
                  onClick={() => setStatus("IN_PROGRESS")}
                />
                <Action
                  icon={Square}
                  label="Finalizar"
                  disabled={pending || appointment.status === "COMPLETED"}
                  onClick={() => setStatus("COMPLETED")}
                />
                <Action
                  icon={XCircle}
                  label="Cancelar"
                  disabled={pending || appointment.status === "CANCELED"}
                  onClick={() => setStatus("CANCELED", "Cancelado pela clínica")}
                />
                <Action
                  icon={CalendarClock}
                  label="Reagendar"
                  disabled={pending}
                  onClick={() =>
                    toast.message("Arraste o card na grade ou altere o horário no formulário.")
                  }
                />
              </div>
            </section>
          )}

          <Separator />

          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Abrir módulos
            </p>
            <div className="grid gap-2">
              <ModuleLink
                href={`/app/patients/${appointment.patientId}`}
                icon={UserRound}
                label="Abrir paciente"
                hint="Ficha"
              />
              <ModuleLink
                href={`/app/clinical-records?patientId=${appointment.patientId}&appointmentId=${appointment.id}&newEvolution=1`}
                icon={FileText}
                label="Registrar evolução"
                hint="Prontuário"
              />
              <ModuleLink
                href={`/app/odontogram?patientId=${appointment.patientId}`}
                icon={Smile}
                label="Abrir odontograma"
                hint="Clínico"
              />
              <ModuleLink
                href={`/app/budgets?patientId=${appointment.patientId}`}
                icon={FileText}
                label="Abrir orçamento"
                hint="Proposta"
              />
              {canViewFinance ? (
                <ModuleLink
                  href={`/app/finance?patientId=${appointment.patientId}`}
                  icon={Wallet}
                  label="Abrir financeiro"
                  hint="Receber"
                />
              ) : null}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-auto justify-start gap-2 rounded-lg px-3 py-2"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

function ModuleLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted/60"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>
    </Link>
  );
}
