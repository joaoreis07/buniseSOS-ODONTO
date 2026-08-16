"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ToothSurface } from "@prisma/client";
import { ExternalLink, Smile } from "lucide-react";
import { getOdontogramAction } from "@/modules/odontogram/actions/odontogram.actions";
import { OdontogramCanvas } from "@/modules/odontogram/components/odontogram-canvas";
import type { OdontogramDTO } from "@/modules/odontogram/dto/odontogram.dto";
import { buildDisplayTeeth, type ToothSelection } from "@/modules/odontogram/utils/tooth-surfaces";

export function PatientOdontogramPreview({
  patientId,
  framed = true,
  variant = "embedded",
}: {
  patientId: string;
  framed?: boolean;
  variant?: "embedded" | "composer";
}) {
  const [odontogram, setOdontogram] = useState<OdontogramDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ToothSelection[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void getOdontogramAction({ patientId }).then((result) => {
      if (!mounted) return;
      if (result.success) {
        setOdontogram(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const displayTeeth = useMemo(
    () => (odontogram ? buildDisplayTeeth(odontogram.teeth, []) : []),
    [odontogram],
  );

  function selectFace(toothNumber: number, surface: ToothSurface, additive: boolean) {
    setSelected((current) => {
      const existing = current.find((item) => item.toothNumber === toothNumber);

      if (!additive) {
        if (
          current.length === 1 &&
          existing &&
          existing.surfaces.length === 1 &&
          existing.surfaces[0] === surface
        ) {
          return [];
        }
        return [{ toothNumber, surfaces: [surface] }];
      }

      if (!existing) {
        return [...current, { toothNumber, surfaces: [surface] }];
      }

      const withoutWhole = existing.surfaces.filter((item): item is ToothSurface => item !== "WHOLE");
      const hasFace = withoutWhole.includes(surface);
      if (hasFace) {
        const nextSurfaces = withoutWhole.filter((item) => item !== surface);
        if (nextSurfaces.length === 0) {
          return current.filter((item) => item.toothNumber !== toothNumber);
        }
        return current.map((item) =>
          item.toothNumber === toothNumber ? { toothNumber, surfaces: nextSurfaces } : item,
        );
      }

      return current.map((item) =>
        item.toothNumber === toothNumber
          ? { toothNumber, surfaces: [...withoutWhole, surface] }
          : item,
      );
    });
  }

  function selectWhole(toothNumber: number, additive: boolean) {
    setSelected((current) => {
      const existing = current.find((item) => item.toothNumber === toothNumber);

      if (!additive) {
        if (
          current.length === 1 &&
          existing &&
          existing.surfaces.length === 1 &&
          existing.surfaces[0] === "WHOLE"
        ) {
          return [];
        }
        return [{ toothNumber, surfaces: ["WHOLE"] }];
      }

      if (existing) {
        return current.filter((item) => item.toothNumber !== toothNumber);
      }
      return [...current, { toothNumber, surfaces: ["WHOLE"] }];
    });
  }

  return (
    <div className={framed ? "surface-card p-4" : ""}>
      <div className="mb-3 flex items-center gap-2">
        <Smile className="size-4 text-primary" />
        <p className="font-medium">Odontograma</p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando odontograma...</p>
      ) : error || !odontogram ? (
        <p className="text-sm text-muted-foreground">
          {error ?? "Não foi possível carregar o odontograma deste paciente."}
        </p>
      ) : (
        <OdontogramCanvas
          teeth={displayTeeth}
          dentition="PERMANENT"
          selected={selected}
          variant={variant}
          onSelectFace={selectFace}
          onSelectWhole={selectWhole}
        />
      )}
      <Link
        href={`/app/odontogram?patientId=${patientId}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Visualizar odontograma completo
        <ExternalLink className="size-3.5" />
      </Link>
    </div>
  );
}
