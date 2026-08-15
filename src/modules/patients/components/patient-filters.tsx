"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { PatientListSort, PatientStatusFilter } from "../dto/patient.dto";

export function PatientFilters({
  status,
  onStatusChange,
  city,
  onCityChange,
  insurance,
  onInsuranceChange,
  hasUpcoming,
  onHasUpcomingChange,
  missingReturn,
  onMissingReturnChange,
  sort,
  onSortChange,
  cities,
  insurances,
}: {
  status: PatientStatusFilter;
  onStatusChange: (value: PatientStatusFilter) => void;
  city: string;
  onCityChange: (value: string) => void;
  insurance: string;
  onInsuranceChange: (value: string) => void;
  hasUpcoming: boolean;
  onHasUpcomingChange: (value: boolean) => void;
  missingReturn: boolean;
  onMissingReturnChange: (value: boolean) => void;
  sort: PatientListSort;
  onSortChange: (value: PatientListSort) => void;
  cities: string[];
  insurances: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => onStatusChange(v as PatientStatusFilter)}>
        <SelectTrigger className="w-[140px] rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="ACTIVE">Ativos</SelectItem>
          <SelectItem value="INACTIVE">Inativos</SelectItem>
          <SelectItem value="BLOCKED">Bloqueados</SelectItem>
        </SelectContent>
      </Select>

      <Select value={city || "all"} onValueChange={(v) => onCityChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[160px] rounded-xl">
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas cidades</SelectItem>
          {cities.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={insurance || "all"}
        onValueChange={(v) => onInsuranceChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[160px] rounded-xl">
          <SelectValue placeholder="Convênio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos convênios</SelectItem>
          <SelectItem value="__none__">Particular / sem convênio</SelectItem>
          {insurances.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as PatientListSort)}>
        <SelectTrigger className="w-[160px] rounded-xl">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Nome A–Z</SelectItem>
          <SelectItem value="name_desc">Nome Z–A</SelectItem>
          <SelectItem value="created_desc">Mais recentes</SelectItem>
          <SelectItem value="created_asc">Mais antigos</SelectItem>
          <SelectItem value="city_asc">Cidade</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={hasUpcoming ? "secondary" : "outline"}
        className="rounded-xl"
        onClick={() => onHasUpcomingChange(!hasUpcoming)}
      >
        Com consultas futuras
      </Button>
      <Button
        type="button"
        variant={missingReturn ? "secondary" : "outline"}
        className="rounded-xl"
        onClick={() => onMissingReturnChange(!missingReturn)}
      >
        Sem retorno
      </Button>
    </div>
  );
}
