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
  createdThisMonth,
  onCreatedThisMonthChange,
  birthdayThisMonth,
  onBirthdayThisMonthChange,
  sort,
  onSortChange,
  cities,
  insurances,
  onClear,
  canClear,
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
  createdThisMonth: boolean;
  onCreatedThisMonthChange: (value: boolean) => void;
  birthdayThisMonth: boolean;
  onBirthdayThisMonthChange: (value: boolean) => void;
  sort: PatientListSort;
  onSortChange: (value: PatientListSort) => void;
  cities: string[];
  insurances: string[];
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => onStatusChange(v as PatientStatusFilter)}>
        <SelectTrigger size="sm" className="w-[132px]">
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
        <SelectTrigger size="sm" className="w-[150px]">
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
        <SelectTrigger size="sm" className="w-[160px]">
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

      <Button
        type="button"
        size="sm"
        variant={hasUpcoming ? "default" : "outline"}
        onClick={() => onHasUpcomingChange(!hasUpcoming)}
      >
        Com consultas futuras
      </Button>
      <Button
        type="button"
        size="sm"
        variant={missingReturn ? "default" : "outline"}
        onClick={() => onMissingReturnChange(!missingReturn)}
      >
        Sem retorno
      </Button>
      <Button
        type="button"
        size="sm"
        variant={createdThisMonth ? "default" : "outline"}
        onClick={() => onCreatedThisMonthChange(!createdThisMonth)}
      >
        Novos este mês
      </Button>
      <Button
        type="button"
        size="sm"
        variant={birthdayThisMonth ? "default" : "outline"}
        onClick={() => onBirthdayThisMonthChange(!birthdayThisMonth)}
      >
        Aniversariantes
      </Button>

      <Select value={sort} onValueChange={(v) => onSortChange(v as PatientListSort)}>
        <SelectTrigger size="sm" className="ml-auto w-[148px]">
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

      {canClear ? (
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Limpar
        </Button>
      ) : null}
    </div>
  );
}
