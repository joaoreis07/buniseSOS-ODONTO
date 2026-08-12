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
import { STATUS_META, addDays, eachDayOfInterval, endOfMonth, startOfMonth } from "../utils/agenda.utils";
import { completeReturnAlertAction } from "../actions/agenda.actions";
import { toast } from "sonner";

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
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    const gridStart = addDays(start, -start.getDay());
    const gridEnd = addDays(end, 6 - end.getDay());
    return eachDayOfInterval(gridStart, gridEnd);
  }, [monthCursor]);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-64">
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium capitalize">
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthCursor)}
          </p>
          <div className="flex gap-1">
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
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const selected = day.toDateString() === anchor.toDateString();
            const outside = day.getMonth() !== monthCursor.getMonth();
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onAnchorChange(day)}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg text-[11px] transition",
                  selected && "bg-brand-600 font-semibold text-white",
                  !selected && "hover:bg-muted",
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
        {professionals.map((pro) => (
          <label key={pro.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/50">
            <Checkbox
              checked={selectedProfessionalIds.includes(pro.id)}
              onCheckedChange={() => onToggleProfessional(pro.id)}
            />
            <span className="size-2.5 rounded-full" style={{ backgroundColor: pro.color }} />
            <span className="truncate text-sm">{pro.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Salas">
        {rooms.length === 0 && <EmptyHint text="Nenhuma sala cadastrada" />}
        {rooms.map((room) => (
          <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/50">
            <Checkbox
              checked={selectedRoomIds.includes(room.id)}
              onCheckedChange={() => onToggleRoom(room.id)}
            />
            <span className="truncate text-sm">{room.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Cadeiras">
        {chairs.length === 0 && <EmptyHint text="Nenhuma cadeira cadastrada" />}
        {chairs.map((chair) => (
          <label key={chair.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/50">
            <Checkbox
              checked={selectedChairIds.includes(chair.id)}
              onCheckedChange={() => onToggleChair(chair.id)}
            />
            <span className="truncate text-sm">{chair.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Legenda">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-2 px-1 py-1 text-sm">
            <span className={cn("size-2 rounded-full", meta.dot)} />
            {meta.label}
          </div>
        ))}
      </FilterGroup>

      <FilterGroup title="Lista de espera">
        {waitingList.length === 0 && <EmptyHint text="Vazia" />}
        {waitingList.map((item) => (
          <div key={item.id} className="rounded-lg border border-border/70 px-2 py-2">
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
          <div key={item.id} className="flex items-start gap-2 rounded-lg border border-border/70 px-2 py-2">
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
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-1 py-1 text-xs text-muted-foreground">{text}</p>;
}
