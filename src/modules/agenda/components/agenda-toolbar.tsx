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
import { cn } from "@/shared/lib/utils";
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
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onAnchorChange(new Date())}>
          Hoje
        </Button>
        <div className="flex items-center rounded-lg border border-border bg-card">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Período anterior"
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Próximo período"
            onClick={() => shift(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="text-sm font-semibold tracking-[-0.02em] text-foreground first-letter:uppercase">
          {title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 xl:max-w-xs xl:flex-none">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar paciente ou procedimento"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={view} onValueChange={(v) => onViewChange(v as AgendaViewMode)}>
          <SelectTrigger className="h-8 w-[118px]">
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
          variant="outline"
          className={cn(showWeekends && "border-primary/40 bg-brand-50 text-primary")}
          onClick={() => onShowWeekendsChange(!showWeekends)}
        >
          Fins de semana
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(includeCanceled && "border-primary/40 bg-brand-50 text-primary")}
          onClick={() => onIncludeCanceledChange(!includeCanceled)}
        >
          Desmarcações
        </Button>
        <Button type="button" size="sm" onClick={onCreate}>
          <Plus className="size-4" />
          Nova consulta
        </Button>
      </div>
    </div>
  );
}
