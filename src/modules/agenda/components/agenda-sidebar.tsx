"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type {
  ChairDTO,
  ProfessionalDTO,
  ReturnAlertClientDTO,
  RoomDTO,
  WaitingListClientDTO,
} from "../dto/agenda.dto";
import {
  STATUS_META,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "../utils/agenda.utils";
import { completeReturnAlertAction } from "../actions/agenda.actions";
import { toast } from "sonner";

const WEEKDAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function AgendaSidebar({
  anchor,
  onAnchorChange,
  professionals,
  rooms,
  chairs,
  selectedProfessionalIds,
  selectedRoomIds,
  selectedChairIds,
  onToggleProfessional,
  onToggleRoom,
  onToggleChair,
  waitingList,
  returnAlerts,
  onReturnCompleted,
}: {
  anchor: Date;
  onAnchorChange: (date: Date) => void;
  professionals: ProfessionalDTO[];
  rooms: RoomDTO[];
  chairs: ChairDTO[];
  selectedProfessionalIds: string[];
  selectedRoomIds: string[];
  selectedChairIds: string[];
  onToggleProfessional: (id: string) => void;
  onToggleRoom: (id: string) => void;
  onToggleChair: (id: string) => void;
  waitingList: WaitingListClientDTO[];
  returnAlerts: ReturnAlertClientDTO[];
  onReturnCompleted: (id: string) => void;
}) {
  const [monthCursor, setMonthCursor] = useState(startOfMonth(anchor));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor));
    const end = endOfWeek(endOfMonth(monthCursor));
    return eachDayOfInterval(start, end);
  }, [monthCursor]);

  const allProfessionalsSelected =
    professionals.length > 0 && professionals.every((pro) => selectedProfessionalIds.includes(pro.id));

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-56 lg:overflow-y-auto lg:pr-0.5">
      <div className="surface-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground first-letter:uppercase">
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthCursor)}
          </p>
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => setMonthCursor(addDays(monthCursor, -30))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => setMonthCursor(addDays(monthCursor, 30))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
          {WEEKDAY_LETTERS.map((letter, index) => (
            <span key={`${letter}-${index}`} className="py-0.5">
              {letter}
            </span>
          ))}
        </div>
        <div className="mt-0.5 grid grid-cols-7">
          {days.map((day) => {
            const selected = day.toDateString() === anchor.toDateString();
            const outside = day.getMonth() !== monthCursor.getMonth();
            const today = day.toDateString() === new Date().toDateString();
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onAnchorChange(day)}
                className={cn(
                  "mx-auto grid size-7 place-items-center rounded-full text-[11px] transition",
                  selected && "bg-primary font-semibold text-white",
                  !selected && today && "font-semibold text-primary",
                  !selected && !today && "text-foreground hover:bg-muted",
                  outside && !selected && "text-muted-foreground/50",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <FilterGroup title="Profissionais">
        {professionals.length > 1 ? (
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
            <Checkbox
              checked={allProfessionalsSelected}
              onCheckedChange={() => {
                if (allProfessionalsSelected) {
                  professionals.forEach((pro) => {
                    if (selectedProfessionalIds.includes(pro.id)) onToggleProfessional(pro.id);
                  });
                  return;
                }
                professionals.forEach((pro) => {
                  if (!selectedProfessionalIds.includes(pro.id)) onToggleProfessional(pro.id);
                });
              }}
            />
            <span className="text-sm text-muted-foreground">Todos os profissionais</span>
          </label>
        ) : null}
        {professionals.map((pro) => (
          <label
            key={pro.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
          >
            <Checkbox
              checked={selectedProfessionalIds.includes(pro.id)}
              onCheckedChange={() => onToggleProfessional(pro.id)}
            />
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: pro.color }} />
            <span className="truncate text-sm">{pro.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Consultórios">
        {rooms.length === 0 && <EmptyHint text="Nenhum consultório cadastrado" />}
        {rooms.map((room) => (
          <label
            key={room.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
          >
            <Checkbox
              checked={selectedRoomIds.includes(room.id)}
              onCheckedChange={() => onToggleRoom(room.id)}
            />
            {room.color ? (
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: room.color }} />
            ) : null}
            <span className="truncate text-sm">{room.name}</span>
          </label>
        ))}
      </FilterGroup>

      {chairs.length > 0 ? (
        <FilterGroup title="Cadeiras">
          {chairs.map((chair) => (
            <label
              key={chair.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedChairIds.includes(chair.id)}
                onCheckedChange={() => onToggleChair(chair.id)}
              />
              <span className="truncate text-sm">{chair.name}</span>
            </label>
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Status">
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <span key={key} className={cn("status-pill", meta.tone)}>
              {meta.label}
            </span>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Lista de espera">
        {waitingList.length === 0 && <EmptyHint text="Vazia" />}
        {waitingList.map((item) => (
          <div key={item.id} className="rounded-md px-1 py-1.5">
            <p className="truncate text-sm font-medium">{item.patientName}</p>
            <p className="text-[11px] text-muted-foreground">
              {item.professionalName ?? "Qualquer profissional"}
            </p>
          </div>
        ))}
      </FilterGroup>

      <FilterGroup title="Próximos retornos">
        {returnAlerts.length === 0 && <EmptyHint text="Nenhum retorno pendente" />}
        {returnAlerts.map((item) => (
          <div key={item.id} className="flex items-start gap-2 rounded-md px-1 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.patientName}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR").format(new Date(item.dueDate))}
                {item.reason ? ` · ${item.reason}` : ""}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={async () => {
                const result = await completeReturnAlertAction(item.id);
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                onReturnCompleted(item.id);
                toast.success("Retorno concluído");
              }}
            >
              <Check className="size-3.5" />
            </Button>
          </div>
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-1 py-0.5 text-xs text-muted-foreground">{text}</p>;
}
