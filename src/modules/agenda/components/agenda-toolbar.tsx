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
    <div className="surface-card flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onAnchorChange(new Date())}>
          Hoje
        </Button>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Período anterior"
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Próximo período"
            onClick={() => shift(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-foreground first-letter:uppercase">
          {title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar paciente ou procedimento"
            className="pl-9"
          />
        </div>
        <Select value={view} onValueChange={(v) => onViewChange(v as AgendaViewMode)}>
          <SelectTrigger className="w-[130px]">
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
          size="sm"
          variant={showWeekends ? "default" : "outline"}
          onClick={() => onShowWeekendsChange(!showWeekends)}
        >
          Fins de semana
        </Button>
        <Button
          type="button"
          size="sm"
          variant={includeCanceled ? "default" : "outline"}
          onClick={() => onIncludeCanceledChange(!includeCanceled)}
        >
          Desmarcações
        </Button>
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          Nova consulta
        </Button>
      </div>
    </div>
  );
}
