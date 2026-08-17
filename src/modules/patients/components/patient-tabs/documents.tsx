"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Download, Eye, FileUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  deletePatientAttachmentAction,
  getClinicalRecordEditorDataAction,
  listPatientAttachmentsAction,
  uploadPatientAttachmentAction,
} from "@/modules/clinical-records/actions/clinical-record.actions";
import type { ClinicalAttachmentDTO } from "@/modules/clinical-records/dto/clinical-record.dto";
import type { PatientClientDTO } from "../../dto/patient.dto";

const DOCUMENT_CATEGORIES = [
  { value: "document", label: "Documento" },
  { value: "contract", label: "Contrato" },
  { value: "budget", label: "Orçamento" },
  { value: "receipt", label: "Recibo" },
  { value: "exam", label: "Exame" },
  { value: "other", label: "Outros" },
] as const;

const EXAM_CATEGORIES = [
  { value: "radiography", label: "Radiografia" },
  { value: "panoramic", label: "Panorâmica" },
  { value: "tomography", label: "Tomografia" },
  { value: "photo", label: "Fotografia" },
  { value: "exam", label: "Exame" },
  { value: "other", label: "Outros" },
] as const;

function categoryLabel(value: string, mode: "documents" | "exams") {
  const list = mode === "exams" ? EXAM_CATEGORIES : DOCUMENT_CATEGORIES;
  return list.find((item) => item.value === value)?.label ?? value;
}

function formatBytes(size: number | null) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
}

function fileTypeLabel(contentType: string | null) {
  if (!contentType) return "—";
  if (contentType.includes("pdf")) return "PDF";
  if (contentType.startsWith("image/")) return "Imagem";
  if (contentType.includes("word") || contentType.includes("officedocument")) return "Word";
  return contentType.split("/")[1]?.toUpperCase() ?? "Arquivo";
}

function categoryTone(value: string) {
  if (value === "receipt") return "status-success";
  if (value === "exam" || value === "radiography" || value === "panoramic" || value === "tomography" || value === "photo") {
    return "status-info";
  }
  if (value === "contract" || value === "budget") return "status-warning";
  return "status-neutral";
}

function isImage(contentType: string | null) {
  return Boolean(contentType?.startsWith("image/"));
}

export function PatientDocumentsTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  return (
    <PatientFilesPanel
      patient={patient}
      canManage={canManage}
      mode="documents"
      title="Documentos"
      description="Arquivos da ficha: contratos, orçamentos, recibos e demais documentos."
    />
  );
}

export function PatientExamsTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  return (
    <PatientFilesPanel
      patient={patient}
      canManage={canManage}
      mode="exams"
      title="Exames"
      description="Radiografias, panorâmicas, tomografias e fotografias deste paciente."
    />
  );
}

function PatientFilesPanel({
  patient,
  canManage,
  mode,
  title,
  description,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
  mode: "documents" | "exams";
  title: string;
  description: string;
}) {
  const type = mode === "exams" ? "EXAM" : "DOCUMENT";
  const categories = mode === "exams" ? EXAM_CATEGORIES : DOCUMENT_CATEGORIES;
  const [items, setItems] = useState<ClinicalAttachmentDTO[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ClinicalAttachmentDTO | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClinicalAttachmentDTO | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pending, start] = useTransition();
  const [titleValue, setTitleValue] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [professionalId, setProfessionalId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const result = await listPatientAttachmentsAction({ patientId: patient.id, type });
    if (result.success) {
      setItems(result.data);
      setError(null);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
    setLoading(false);
  }, [patient.id, type]);

  useEffect(() => {
    void load();
    void getClinicalRecordEditorDataAction({ patientId: patient.id }).then((result) => {
      if (result.success) setProfessionals(result.data.professionals);
    });
  }, [load, patient.id]);

  const visibleItems = useMemo(
    () => (categoryFilter === "all" ? items : items.filter((item) => item.category === categoryFilter)),
    [categoryFilter, items],
  );

  function resetForm() {
    setTitleValue("");
    setCategory(categories[0].value);
    setDescriptionValue("");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setProfessionalId("");
    setFile(null);
  }

  function submit() {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }
    start(async () => {
      const form = new FormData();
      form.set("patientId", patient.id);
      form.set("type", type);
      form.set("category", category);
      form.set("title", titleValue.trim() || file.name);
      if (descriptionValue.trim()) form.set("description", descriptionValue.trim());
      form.set("occurredAt", new Date(`${occurredAt}T12:00:00`).toISOString());
      if (professionalId) form.set("professionalId", professionalId);
      form.set("file", file);
      const result = await uploadPatientAttachmentAction(form);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      resetForm();
      await load();
    });
  }

  function confirmRemove() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    start(async () => {
      const result = await deletePatientAttachmentAction({ id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setPendingDelete(null);
      if (preview?.id === id) setPreview(null);
      await load();
    });
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando arquivos...</p>;

  if (error && items.length === 0) {
    return (
      <div className="surface-card p-5">
        <p className="font-medium text-destructive">Não foi possível carregar os arquivos</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button type="button" size="sm" className="mt-3" onClick={() => { setLoading(true); void load(); }}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-8 rounded-lg border border-input bg-input-background px-2 text-sm"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {canManage ? (
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-3.5" />
              {mode === "exams" ? "Adicionar exame" : "Enviar arquivo"}
            </Button>
          ) : null}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState
          icon={FileUp}
          title={
            items.length === 0
              ? mode === "exams"
                ? "Nenhum exame anexado"
                : "Nenhum documento enviado"
              : "Nenhum arquivo nesta categoria"
          }
          description={
            items.length === 0
              ? mode === "exams"
                ? "Radiografias e demais exames deste paciente aparecem aqui."
                : "Contratos, orçamentos e demais arquivos da ficha aparecem aqui."
              : "Altere o filtro para ver outros arquivos."
          }
          actionLabel={canManage && items.length === 0 ? (mode === "exams" ? "Adicionar exame" : "Enviar arquivo") : undefined}
          onAction={canManage && items.length === 0 ? () => setOpen(true) : undefined}
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Tamanho</th>
                  <th className="px-3 py-2 font-medium">Profissional</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.fileName ?? "Sem arquivo"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fileTypeLabel(item.contentType)}</td>
                    <td className="px-3 py-2">
                      <span className={`status-pill ${categoryTone(item.category)}`}>
                        {categoryLabel(item.category, mode)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(item.occurredAt ?? item.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatBytes(item.fileSize)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {item.professionalName || item.createdByName || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {item.fileKey ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Visualizar"
                              onClick={() => setPreview(item)}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Download">
                              <a href={`/api/files/${item.id}?download=1`}>
                                <Download className="size-3.5" />
                              </a>
                            </Button>
                          </>
                        ) : null}
                        {canManage ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            aria-label="Excluir"
                            onClick={() => setPendingDelete(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "exams" ? "Adicionar exame" : "Enviar documento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="file-title">Nome</Label>
              <Input
                id="file-title"
                value={titleValue}
                onChange={(event) => setTitleValue(event.target.value)}
                placeholder={file?.name ?? "Nome do arquivo"}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="file-category">Categoria</Label>
                <select
                  id="file-category"
                  className="h-9 w-full rounded-lg border border-input bg-input-background px-3 text-sm"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as typeof category)}
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file-date">Data</Label>
                <Input
                  id="file-date"
                  type="date"
                  value={occurredAt}
                  onChange={(event) => setOccurredAt(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="file-pro">Profissional responsável</Label>
              <select
                id="file-pro"
                className="h-9 w-full rounded-lg border border-input bg-input-background px-3 text-sm"
                value={professionalId}
                onChange={(event) => setProfessionalId(event.target.value)}
              >
                <option value="">Não informado</option>
                {professionals.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="file-desc">Descrição</Label>
              <Textarea
                id="file-desc"
                rows={3}
                value={descriptionValue}
                onChange={(event) => setDescriptionValue(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="file-input">Arquivo</Label>
              <Input
                id="file-input"
                type="file"
                accept="application/pdf,image/*,.doc,.docx"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">PDF, imagem ou Word · até 15 MB.</p>
              {file ? <p className="text-xs text-foreground">{file.name} · {formatBytes(file.size)}</p> : null}
              {pending ? <p className="text-xs text-primary">Enviando arquivo...</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={pending || !file}>
              {pending ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(next) => !next && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.title ?? "Arquivo"}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Categoria</dt>
                  <dd>{categoryLabel(preview.category, mode)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Responsável</dt>
                  <dd>{preview.professionalName || preview.createdByName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Data</dt>
                  <dd>{formatDate(preview.occurredAt ?? preview.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Arquivo</dt>
                  <dd>{preview.fileName ?? "—"}</dd>
                </div>
              </dl>
              {preview.description ? <p className="text-sm text-muted-foreground">{preview.description}</p> : null}
              {isImage(preview.contentType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${preview.id}`}
                  alt={preview.title}
                  className="max-h-[60vh] w-full rounded-lg border border-border object-contain bg-muted/30"
                />
              ) : (
                <iframe
                  title={preview.title}
                  src={`/api/files/${preview.id}`}
                  className="h-[60vh] w-full rounded-lg border border-border bg-background"
                />
              )}
            </div>
          ) : null}
          <DialogFooter>
            {preview?.fileKey ? (
              <Button asChild variant="outline">
                <a href={`/api/files/${preview.id}?download=1`}>Baixar</a>
              </Button>
            ) : null}
            <Button type="button" onClick={() => setPreview(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.title}” será removido da ficha. A exclusão é lógica e o arquivo deixa de aparecer para a clínica.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} disabled={pending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
