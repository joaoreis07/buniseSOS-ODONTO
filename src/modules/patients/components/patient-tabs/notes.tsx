"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Archive, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  archivePatientNoteAction,
  createPatientNoteAction,
  deletePatientNoteAction,
  listPatientNotesAction,
  updatePatientNoteAction,
} from "../../actions/patient-note.actions";
import type { PatientNoteDTO } from "../../services/patient-note.service";
import type { PatientClientDTO } from "../../dto/patient.dto";

const TYPES: { value: PatientNoteDTO["type"]; label: string }[] = [
  { value: "CLINICAL", label: "Clínica" },
  { value: "ADMIN", label: "Administrativa" },
  { value: "ALERT", label: "Alerta" },
];

function typeLabel(type: PatientNoteDTO["type"]) {
  return TYPES.find((item) => item.value === type)?.label ?? type;
}

function typeTone(type: PatientNoteDTO["type"]) {
  if (type === "ALERT") return "status-danger";
  if (type === "ADMIN") return "status-neutral";
  return "status-info";
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function PatientNotesTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  const [notes, setNotes] = useState<PatientNoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PatientNoteDTO | null>(null);
  const [body, setBody] = useState("");
  const [type, setType] = useState<PatientNoteDTO["type"]>("CLINICAL");
  const [pending, start] = useTransition();
  const [typeFilter, setTypeFilter] = useState<"all" | PatientNoteDTO["type"]>("all");

  const load = useCallback(async () => {
    const result = await listPatientNotesAction({ patientId: patient.id, includeArchived: true });
    if (result.success) setNotes(result.data);
    else toast.error(result.error);
    setLoading(false);
  }, [patient.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => notes.filter((note) => !note.archivedAt && (typeFilter === "all" || note.type === typeFilter)),
    [notes, typeFilter],
  );
  const archived = useMemo(
    () => notes.filter((note) => note.archivedAt && (typeFilter === "all" || note.type === typeFilter)),
    [notes, typeFilter],
  );

  function openCreate() {
    setEditing(null);
    setBody("");
    setType("CLINICAL");
    setOpen(true);
  }

  function openEdit(note: PatientNoteDTO) {
    setEditing(note);
    setBody(note.body);
    setType(note.type);
    setOpen(true);
  }

  function save() {
    start(async () => {
      const result = editing
        ? await updatePatientNoteAction({ id: editing.id, body, type })
        : await createPatientNoteAction({ patientId: patient.id, body, type });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      await load();
    });
  }

  function archive(note: PatientNoteDTO) {
    start(async () => {
      const result = await archivePatientNoteAction({ id: note.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(note.archivedAt ? "Anotação restaurada" : "Anotação arquivada");
      await load();
    });
  }

  function remove(note: PatientNoteDTO) {
    start(async () => {
      const result = await deletePatientNoteAction({ id: note.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      await load();
    });
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando anotações...</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Anotações</p>
          <p className="text-sm text-muted-foreground">
            Registros próprios da equipe. Alergias, observações do cadastro e evolução clínica ficam em outras abas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {([{ value: "all", label: "Todas" }, ...TYPES] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTypeFilter(item.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  typeFilter === item.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {canManage ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              Nova anotação
            </Button>
          ) : null}
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={notes.some((note) => !note.archivedAt) ? "Nenhuma anotação neste filtro" : "Sem anotações"}
          description="Anotações clínicas, administrativas ou de alerta ficam registradas aqui, sem misturar com o cadastro."
          actionLabel={canManage && !notes.some((note) => !note.archivedAt) ? "Nova anotação" : undefined}
          onAction={canManage && !notes.some((note) => !note.archivedAt) ? openCreate : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {active.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              canManage={canManage}
              onEdit={() => openEdit(note)}
              onArchive={() => archive(note)}
              onDelete={() => remove(note)}
            />
          ))}
        </ul>
      )}

      {archived.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Histórico arquivado</h3>
          <ul className="space-y-2 opacity-80">
            {archived.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                canManage={canManage}
                onEdit={() => openEdit(note)}
                onArchive={() => archive(note)}
                onDelete={() => remove(note)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar anotação" : "Nova anotação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="note-type">Tipo</Label>
              <select
                id="note-type"
                className="h-9 w-full rounded-lg border border-input bg-input-background px-3 text-sm"
                value={type}
                onChange={(event) => setType(event.target.value as PatientNoteDTO["type"])}
              >
                {TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-body">Texto</Label>
              <Textarea
                id="note-body"
                rows={5}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={pending || !body.trim()}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NoteCard({
  note,
  canManage,
  onEdit,
  onArchive,
  onDelete,
}: {
  note: PatientNoteDTO;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="surface-card p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill ${typeTone(note.type)}`}>{typeLabel(note.type)}</span>
            <span className="text-xs text-muted-foreground">
              {formatWhen(note.createdAt)}
              {note.authorName ? ` · ${note.authorName}` : ""}
            </span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-foreground">{note.body}</p>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            {!note.archivedAt ? (
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onEdit} aria-label="Editar">
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onArchive}
              aria-label={note.archivedAt ? "Restaurar" : "Arquivar"}
            >
              <Archive className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={onDelete}
              aria-label="Excluir"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
