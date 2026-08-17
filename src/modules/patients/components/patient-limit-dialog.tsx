"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { STARTER_PATIENT_LIMIT } from "@/modules/billing/plan-limits";

export function PatientLimitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limite do plano Gratuito</DialogTitle>
          <DialogDescription>
            O plano Gratuito inclui os recursos principais da clínica, com limite de{" "}
            {STARTER_PATIENT_LIMIT} pacientes. Para cadastrar o próximo paciente, faça upgrade
            do plano.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button asChild>
            <Link href="/app/settings?tab=planos">Ver planos e upgrade</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
