"use client";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { AgendaViewMode } from "../dto/agenda.dto";
import { addDays } from "../utils/agenda.utils";

export function AgendaToolbar({
  view,
  onViewChange,
  anchor,
  onAnchorChange,
  search,
  onSearchChange,
  includeCanceled,
  onIncludeCanceledChange,
  showWeekends,
  onShowWeekendsChange,
  onCreate,
  title,
}: {
  view: AgendaViewMode;
  onViewChange: (view: AgendaViewMode) => void;
  anchor: Date;
  onAnchorChange: (date: Date) => void;
  search: string;
  onSearchChange: (value: string) => void;
  includeCanceled: boolean;
  onIncludeCanceledChange: (value: boolean) => void;
  showWeekends: boolean;
  onShowWeekendsChange: (value: boolean) => void;
  onCreate: () => void;
  title: string;
}) {
  function shift(amount: number) {
    if (view === "day" || view === "timeline") onAnchorChange(addDays(anchor, amount));
    else if (view === "month") onAnchorChange(addDays(anchor, amount * 30));
    else onAnchorChange(addDays(anchor, amount * 7));
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => onAnchorChange(new Date())}
        >
          Hoje
        </Button>
        <div className="flex items-center rounded-xl border border-border bg-card">
          <Button type="button" variant="ghost" size="icon" className="size-9" onClick={() => shift(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-9" onClick={() => shift(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="text-base font-semibold capitalize tracking-[-0.02em]">{title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar paciente ou procedimento"
            className="rounded-xl pl-9"
          />
        </div>
        <Select value={view} onValueChange={(v) => onViewChange(v as AgendaViewMode)}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Dia</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="timeline">Timeline</SelectItem>
            <SelectItem value="list">Lista</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={showWeekends ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => onShowWeekendsChange(!showWeekends)}
        >
          Fins de semana
        </Button>
        <Button
          type="button"
          variant={includeCanceled ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => onIncludeCanceledChange(!includeCanceled)}
        >
          Desmarcações
        </Button>
        <Button type="button" onClick={onCreate} className="rounded-xl">
          <Plus className="mr-1 size-4" />
          Nova consulta
        </Button>
      </div>
    </div>
  );
}
