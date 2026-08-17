"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  createAppointmentAction,
  createScheduleBlockAction,
  searchPatientsAction,
} from "../actions/agenda.actions";
import type {
  AppointmentClientDTO,
  ChairDTO,
  PatientLiteDTO,
  ProfessionalDTO,
  RoomDTO,
} from "../dto/agenda.dto";

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  professionals,
  rooms,
  chairs,
  initialStart,
  initialEnd,
  onCreated,
  defaultPatient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionals: ProfessionalDTO[];
  rooms: RoomDTO[];
  chairs: ChairDTO[];
  initialStart: Date;
  initialEnd: Date;
  onCreated: (appointments: AppointmentClientDTO[]) => void;
  defaultPatient?: { id: string; name: string; phone?: string | null };
}) {
  const [pending, startTransition] = useTransition();
  const [patientQuery, setPatientQuery] = useState("");
  const [patientId, setPatientId] = useState<string | undefined>();
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [matches, setMatches] = useState<PatientLiteDTO[]>([]);
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const [roomId, setRoomId] = useState<string>("");
  const [chairId, setChairId] = useState<string>("");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInput(initialStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(initialEnd));
  const [recurring, setRecurring] = useState(false);
  const [mode, setMode] = useState<"appointment" | "block">("appointment");

  useEffect(() => {
    if (!open) return;
    setStartsAt(toLocalInput(initialStart));
    setEndsAt(toLocalInput(initialEnd));
    setProfessionalId((prev) => prev || professionals[0]?.id || "");
    if (defaultPatient) {
      setMode("appointment");
      setPatientId(defaultPatient.id);
      setPatientName(defaultPatient.name);
      setPatientQuery(defaultPatient.name);
      setPatientPhone(defaultPatient.phone ?? "");
      setMatches([]);
    }
  }, [open, initialStart, initialEnd, professionals, defaultPatient]);

  useEffect(() => {
    if (patientQuery.trim().length < 2) {
      setMatches([]);
      return;
    }
    const handle = setTimeout(() => {
      void searchPatientsAction(patientQuery).then((result) => {
        if (result.success) setMatches(result.data);
      });
    }, 220);
    return () => clearTimeout(handle);
  }, [patientQuery]);

  function submit() {
    startTransition(async () => {
      if (mode === "block") {
        const result = await createScheduleBlockAction({
          type: "BLOCK",
          title: procedure || "Bloqueio",
          professionalId: professionalId || undefined,
          roomId: roomId || undefined,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Bloqueio criado");
        onOpenChange(false);
        return;
      }

      const result = await createAppointmentAction({
        patientId,
        patientName: patientId ? undefined : patientName || patientQuery,
        patientPhone: patientPhone || undefined,
        professionalId,
        roomId: roomId || undefined,
        chairId: chairId || undefined,
        procedure: procedure || undefined,
        notes: notes || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        recurrenceRule: recurring ? "WEEKLY" : undefined,
        recurrenceCount: recurring ? 4 : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onCreated(result.data);
      toast.success(result.message ?? "Consulta criada");
      onOpenChange(false);
      setPatientId(undefined);
      setPatientName("");
      setPatientQuery("");
      setProcedure("");
      setNotes("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova {mode === "appointment" ? "consulta" : "indisponibilidade"}</DialogTitle>
        </DialogHeader>

        {defaultPatient ? null : (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "appointment" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setMode("appointment")}
            >
              Consulta
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "block" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setMode("block")}
            >
              Bloqueio / almoço
            </Button>
          </div>
        )}

        <div className="grid gap-3">
          {mode === "appointment" && (
            <>
              <div className="space-y-2">
                <Label>Paciente</Label>
                {defaultPatient ? (
                  <Input value={defaultPatient.name} readOnly className="bg-muted/50" />
                ) : (
                  <>
                    <Input
                      value={patientQuery || patientName}
                      onChange={(e) => {
                        setPatientQuery(e.target.value);
                        setPatientName(e.target.value);
                        setPatientId(undefined);
                      }}
                      placeholder="Buscar ou criar paciente"
                    />
                    {matches.length > 0 && (
                      <div className="rounded-lg border border-border bg-card p-1">
                        {matches.map((match) => (
                          <button
                            key={match.id}
                            type="button"
                            className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setPatientId(match.id);
                              setPatientName(match.name);
                              setPatientQuery(match.name);
                              setPatientPhone(match.phone ?? "");
                              setMatches([]);
                            }}
                          >
                            {match.name}
                            {match.phone ? ` · ${match.phone}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((pro) => (
                  <SelectItem key={pro.id} value={pro.id}>
                    {pro.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Consultório</Label>
              <Select value={roomId || "none"} onValueChange={(v) => setRoomId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cadeira</Label>
              <Select value={chairId || "none"} onValueChange={(v) => setChairId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {chairs.map((chair) => (
                    <SelectItem key={chair.id} value={chair.id}>
                      {chair.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{mode === "appointment" ? "Procedimento" : "Título do bloqueio"}</Label>
            <Input
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder={mode === "appointment" ? "Ex.: Profilaxia" : "Ex.: Almoço"}
            />
          </div>

          {mode === "appointment" && (
            <>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
                Repetir semanalmente (4 ocorrências)
              </label>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending || !professionalId}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
