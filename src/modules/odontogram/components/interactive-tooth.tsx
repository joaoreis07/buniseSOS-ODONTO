"use client";

import type { ToothSurface } from "@prisma/client";
import type { OdontogramToothDTO } from "../dto/odontogram.dto";
import {
  canvasSurfacesForTooth,
  faceClinicalFill,
  faceClinicalHint,
  mesialOnLeft,
  SURFACE_LABELS,
  type ToothSelection,
  vestibularOnTop,
} from "../utils/tooth-surfaces";

type FaceRegion = {
  surface: ToothSurface;
  points: string;
  labelX: number;
  labelY: number;
  shortLabel: string;
};

function buildFaceRegions(toothNumber: number): FaceRegion[] {
  const mesialLeft = mesialOnLeft(toothNumber);
  const vestTop = vestibularOnTop(toothNumber);
  const anterior = canvasSurfacesForTooth(toothNumber).includes("INCISAL");
  const centerSurface: ToothSurface = anterior ? "INCISAL" : "OCCLUSAL";

  const mesial: FaceRegion = {
    surface: "MESIAL",
    points: mesialLeft ? "2,14 2,36 17,28 17,22" : "33,14 33,36 18,28 18,22",
    labelX: mesialLeft ? 8 : 42,
    labelY: 25,
    shortLabel: "M",
  };
  const distal: FaceRegion = {
    surface: "DISTAL",
    points: mesialLeft ? "33,14 33,36 18,28 18,22" : "2,14 2,36 17,28 17,22",
    labelX: mesialLeft ? 42 : 8,
    labelY: 25,
    shortLabel: "D",
  };
  const occlusal: FaceRegion = {
    surface: centerSurface,
    points: "17,18 33,18 33,32 17,32",
    labelX: 25,
    labelY: 25,
    shortLabel: anterior ? "I" : "O",
  };
  const vestibular: FaceRegion = vestTop
    ? { surface: "VESTIBULAR", points: "17,4 33,4 33,18 17,18", labelX: 25, labelY: 11, shortLabel: "V" }
    : { surface: "VESTIBULAR", points: "17,32 33,32 33,46 17,46", labelX: 25, labelY: 39, shortLabel: "V" };
  const lingual: FaceRegion = vestTop
    ? { surface: "LINGUAL", points: "17,32 33,32 33,46 17,46", labelX: 25, labelY: 39, shortLabel: "L" }
    : { surface: "LINGUAL", points: "17,4 33,4 33,18 17,18", labelX: 25, labelY: 11, shortLabel: "L" };

  return [mesial, distal, occlusal, vestibular, lingual];
}

function faceIsSelected(selectedSurfaces: ToothSurface[], regionSurface: ToothSurface): boolean {
  if (selectedSurfaces.includes("WHOLE")) return true;
  return selectedSurfaces.includes(regionSurface);
}

export function InteractiveTooth({
  tooth,
  selected,
  compact = false,
  onSelectFace,
  onSelectWhole,
}: {
  tooth: OdontogramToothDTO;
  selected: ToothSelection[];
  compact?: boolean;
  onSelectFace: (toothNumber: number, surface: ToothSurface, additive: boolean) => void;
  onSelectWhole: (toothNumber: number, additive: boolean) => void;
}) {
  const toothSelected = selected.some((item) => item.toothNumber === tooth.number);
  const selectedSurfaces =
    selected.find((item) => item.toothNumber === tooth.number)?.surfaces ?? [];
  const wholeSelected = selectedSurfaces.includes("WHOLE");
  const regions = buildFaceRegions(tooth.number);
  const hasPlanned = tooth.conditions.some((item) => item.phase === "PLANNED");

  return (
    <div
      className={`group/tooth relative flex min-w-0 flex-col items-center ${
        compact ? "" : "aspect-[4/5]"
      } ${toothSelected ? "scale-[1.03]" : ""}`}
    >
      <div
        className={`relative rounded-lg border bg-card p-0.5 transition-all ${
          toothSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
        }`}
      >
        <svg
          viewBox="0 0 50 50"
          className={compact ? "h-14 w-12 sm:h-16 sm:w-14" : "h-11 w-10 sm:h-14 sm:w-12"}
          role="img"
          aria-label={`Dente ${tooth.number} com faces clicáveis`}
        >
          <rect
            x="1"
            y="1"
            width="48"
            height="48"
            rx="10"
            fill="currentColor"
            fillOpacity="0.06"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1"
            className="text-muted-foreground"
          />

          {regions.map((region) => {
            const isSelected = faceIsSelected(selectedSurfaces, region.surface);
            const hint = faceClinicalHint(tooth, region.surface);
            const fill = faceClinicalFill(hint, isSelected);

            return (
              <g key={region.surface}>
                <polygon
                  points={region.points}
                  fill={fill}
                  stroke="currentColor"
                  strokeOpacity={isSelected ? 0.55 : 0.2}
                  strokeWidth={isSelected ? 1.5 : 0.75}
                  className="pointer-events-none text-foreground"
                />
                <polygon
                  points={region.points}
                  fill="transparent"
                  className="cursor-pointer hover:fill-brand-500/15 focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label={`Dente ${tooth.number} — Face ${SURFACE_LABELS[region.surface]}`}
                  aria-pressed={isSelected}
                  onClick={(event) =>
                    onSelectFace(
                      tooth.number,
                      region.surface,
                      event.shiftKey || event.metaKey || event.ctrlKey,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectFace(tooth.number, region.surface, event.shiftKey || event.metaKey || event.ctrlKey);
                    }
                  }}
                >
                  <title>{`Face ${SURFACE_LABELS[region.surface]}`}</title>
                </polygon>
                <text
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-muted-foreground text-[7px] font-semibold"
                  aria-hidden="true"
                >
                  {region.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {hasPlanned && (
          <span
            className="absolute right-1 top-1 size-1.5 rounded-full bg-warning"
            aria-hidden="true"
          />
        )}
      </div>

      <button
        type="button"
        aria-label={`Dente ${tooth.number} — ${SURFACE_LABELS.WHOLE}`}
        aria-pressed={wholeSelected}
        title={SURFACE_LABELS.WHOLE}
        className={`mt-0.5 rounded-md px-1 font-bold text-muted-foreground transition-colors hover:bg-primary/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          compact ? "text-xs" : "text-[10px] sm:text-xs"
        } ${wholeSelected ? "bg-primary/20 text-primary ring-1 ring-primary/40" : ""}`}
        onClick={(event) =>
          onSelectWhole(tooth.number, event.shiftKey || event.metaKey || event.ctrlKey)
        }
      >
        {tooth.number}
      </button>
    </div>
  );
}
