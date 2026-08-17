"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/components/ui/utils";
import type { ProcedureCatalogItemDTO } from "../dto/odontogram.dto";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ProcedureCatalogPicker({
  procedures,
  valueCode,
  onSelect,
}: {
  procedures: ProcedureCatalogItemDTO[];
  valueCode: string;
  onSelect: (item: ProcedureCatalogItemDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => procedures.find((item) => item.code === valueCode) ?? null,
    [procedures, valueCode],
  );

  if (procedures.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
        Nenhum procedimento cadastrado.
      </p>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar procedimento do catálogo"
          className="h-auto w-full justify-between px-3 py-2 text-left font-normal"
        >
          {selected ? (
            <span className="min-w-0">
              <span className="block truncate">{selected.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {selected.code} · {money.format(Number(selected.defaultPrice))}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Selecione um procedimento</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar procedimento..." />
          <CommandList>
            <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
            <CommandGroup>
              {procedures.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.name} ${item.code}`}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", valueCode === item.code ? "opacity-100" : "opacity-0")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.code} · {money.format(Number(item.defaultPrice))}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
