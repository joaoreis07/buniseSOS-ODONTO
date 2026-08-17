"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  createPatientAction,
  lookupCepAction,
  updatePatientAction,
} from "../actions/patient.actions";
import type { PatientClientDTO } from "../dto/patient.dto";
import { BLOOD_LABELS, formatCep, formatCpf, formatPhone } from "../utils/patient.utils";

type FormState = {
  fullName: string;
  preferredName: string;
  birthDate: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
  cpf: string;
  rg: string;
  email: string;
  phone: string;
  whatsapp: string;
  maritalStatus: "" | "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "OTHER";
  profession: string;
  address: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  responsibleName: string;
  responsiblePhone: string;
  insurance: string;
  insuranceNumber: string;
  bloodType: "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG" | "UNKNOWN";
  allergies: string;
  medicalNotes: string;
  observations: string;
  photoUrl: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  fullName: "",
  preferredName: "",
  birthDate: "",
  gender: "UNSPECIFIED",
  cpf: "",
  rg: "",
  email: "",
  phone: "",
  whatsapp: "",
  maritalStatus: "",
  profession: "",
  address: "",
  number: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
  responsibleName: "",
  responsiblePhone: "",
  insurance: "",
  insuranceNumber: "",
  bloodType: "UNKNOWN",
  allergies: "",
  medicalNotes: "",
  observations: "",
  photoUrl: "",
  isActive: true,
};

function toForm(patient?: PatientClientDTO | null): FormState {
  if (!patient) return emptyForm;
  return {
    fullName: patient.fullName,
    preferredName: patient.preferredName ?? "",
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : "",
    gender: patient.gender,
    cpf: formatCpf(patient.cpf),
    rg: patient.rg ?? "",
    email: patient.email ?? "",
    phone: formatPhone(patient.phone),
    whatsapp: formatPhone(patient.whatsapp),
    maritalStatus: patient.maritalStatus ?? "",
    profession: patient.profession ?? "",
    address: patient.address ?? "",
    number: patient.number ?? "",
    district: patient.district ?? "",
    city: patient.city ?? "",
    state: patient.state ?? "",
    zipCode: formatCep(patient.zipCode),
    responsibleName: patient.responsibleName ?? "",
    responsiblePhone: formatPhone(patient.responsiblePhone),
    insurance: patient.insurance ?? "",
    insuranceNumber: patient.insuranceNumber ?? "",
    bloodType: patient.bloodType,
    allergies: patient.allergies ?? "",
    medicalNotes: patient.medicalNotes ?? "",
    observations: patient.observations ?? "",
    photoUrl: patient.photoUrl ?? "",
    isActive: patient.isActive,
  };
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSaved,
  onLimitReached,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: PatientClientDTO | null;
  onSaved: (patient: PatientClientDTO) => void;
  onLimitReached?: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(patient);

  useEffect(() => {
    if (open) setForm(toForm(patient));
  }, [open, patient]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCepBlur() {
    const digits = form.zipCode.replace(/\D/g, "");
    if (digits.length !== 8) return;
    startTransition(async () => {
      const result = await lookupCepAction(digits);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setForm((prev) => ({
        ...prev,
        zipCode: result.data.zipCode,
        address: result.data.address || prev.address,
        district: result.data.district || prev.district,
        city: result.data.city || prev.city,
        state: result.data.state || prev.state,
      }));
    });
  }

  function submit() {
    startTransition(async () => {
      const payload = { ...form };
      const result = editing
        ? await updatePatientAction({ id: patient!.id, ...payload })
        : await createPatientAction(payload);
      if (!result.success) {
        toast.error(result.error);
        if (!editing && result.code === "PATIENT_LIMIT_REACHED") {
          onOpenChange(false);
          onLimitReached?.();
        }
        return;
      }
      toast.success(result.message ?? "Salvo");
      onSaved(result.data);
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar paciente" : "Novo paciente"}</SheetTitle>
          <SheetDescription>
            Cadastro completo com validação e busca de CEP.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <Section title="Dados pessoais">
            <Field label="Nome completo">
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Apelido">
                <Input
                  value={form.preferredName}
                  onChange={(e) => set("preferredName", e.target.value)}
                />
              </Field>
              <Field label="Nascimento">
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sexo">
                <Select
                  value={form.gender}
                  onValueChange={(v) => set("gender", v as FormState["gender"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Feminino</SelectItem>
                    <SelectItem value="MALE">Masculino</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                    <SelectItem value="UNSPECIFIED">Não informado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado civil">
                <Select
                  value={form.maritalStatus || "none"}
                  onValueChange={(v) =>
                    set("maritalStatus", v === "none" ? "" : (v as FormState["maritalStatus"]))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="SINGLE">Solteiro(a)</SelectItem>
                    <SelectItem value="MARRIED">Casado(a)</SelectItem>
                    <SelectItem value="DIVORCED">Divorciado(a)</SelectItem>
                    <SelectItem value="WIDOWED">Viúvo(a)</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF">
                <Input
                  value={form.cpf}
                  onChange={(e) => set("cpf", formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </Field>
              <Field label="RG">
                <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} />
              </Field>
            </div>
            <Field label="Profissão">
              <Input value={form.profession} onChange={(e) => set("profession", e.target.value)} />
            </Field>
          </Section>

          <Section title="Contato">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone">
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", formatPhone(e.target.value))}
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", formatPhone(e.target.value))}
                />
              </Field>
            </div>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </Section>

          <Section title="Endereço">
            <Field label="CEP">
              <Input
                value={form.zipCode}
                onChange={(e) => set("zipCode", formatCep(e.target.value))}
                onBlur={onCepBlur}
                placeholder="00000-000"
              />
            </Field>
            <Field label="Endereço">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Número">
                <Input value={form.number} onChange={(e) => set("number", e.target.value)} />
              </Field>
              <Field label="Bairro">
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
              </Field>
              <Field label="UF">
                <Input
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => set("state", e.target.value.toUpperCase())}
                />
              </Field>
            </div>
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </Section>

          <Section title="Responsável & convênio">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável">
                <Input
                  value={form.responsibleName}
                  onChange={(e) => set("responsibleName", e.target.value)}
                />
              </Field>
              <Field label="Telefone do responsável">
                <Input
                  value={form.responsiblePhone}
                  onChange={(e) => set("responsiblePhone", formatPhone(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Convênio">
                <Input value={form.insurance} onChange={(e) => set("insurance", e.target.value)} />
              </Field>
              <Field label="Nº do plano">
                <Input
                  value={form.insuranceNumber}
                  onChange={(e) => set("insuranceNumber", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Dados clínicos">
            <Field label="Tipo sanguíneo">
              <Select
                value={form.bloodType}
                onValueChange={(v) => set("bloodType", v as FormState["bloodType"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "UNKNOWN",
                      "A_POS",
                      "A_NEG",
                      "B_POS",
                      "B_NEG",
                      "AB_POS",
                      "AB_NEG",
                      "O_POS",
                      "O_NEG",
                    ] as const
                  ).map((item) => (
                    <SelectItem key={item} value={item}>
                      {BLOOD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Alergias">
              <Textarea
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="Notas médicas">
              <Textarea
                value={form.medicalNotes}
                onChange={(e) => set("medicalNotes", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="Observações">
              <Textarea
                value={form.observations}
                onChange={(e) => set("observations", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="URL da foto">
              <Input
                value={form.photoUrl}
                onChange={(e) => set("photoUrl", e.target.value)}
                placeholder="https://... (upload local em breve)"
              />
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Paciente ativo</p>
                <p className="text-xs text-muted-foreground">Inativos ficam ocultos nos filtros padrão</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
            </div>
          </Section>
        </div>

        <SheetFooter className="mt-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending || !form.fullName.trim()}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
