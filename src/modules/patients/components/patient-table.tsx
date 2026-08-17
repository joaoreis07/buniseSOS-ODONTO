"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { PatientClientDTO } from "../dto/patient.dto";
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Users } from "lucide-react";
import { formatCpf, formatPhone } from "../utils/patient.utils";
import { PatientAvatar } from "./patient-avatar";
import { PatientStatusBadge } from "./patient-status-badge";

function pageNumbers(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const items = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...items].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (const value of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && value - previous > 1) result.push("ellipsis");
    result.push(value);
  }
  return result;
}

export function PatientTable({
  items,
  onOpen,
  onCreate,
  onEdit,
  canManage,
  page,
  total,
  totalPages,
  onPageChange,
}: {
  items: PatientClientDTO[];
  onOpen: (patient: PatientClientDTO) => void;
  onCreate: () => void;
  onEdit?: (patient: PatientClientDTO) => void;
  canManage: boolean;
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const columns = useMemo<ColumnDef<PatientClientDTO>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Paciente",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PatientAvatar name={row.original.fullName} photoUrl={row.original.photoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{row.original.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.cpf ? `CPF ${formatCpf(row.original.cpf)}` : "CPF —"}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "birthDate",
        header: "Nascimento",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.birthDate
              ? new Intl.DateTimeFormat("pt-BR").format(new Date(row.original.birthDate))
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefone",
        cell: ({ row }) => (
          <span className="text-sm">{formatPhone(row.original.phone) || "—"}</span>
        ),
      },
      {
        accessorKey: "lastAppointmentAt",
        header: "Última consulta",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastAppointmentAt
              ? new Intl.DateTimeFormat("pt-BR").format(new Date(row.original.lastAppointmentAt))
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <PatientStatusBadge isActive={row.original.isActive} status={row.original.status} />
            {row.original.upcomingAppointmentsCount > 0 ? (
              <p className="text-[11px] text-primary">
                {row.original.upcomingAppointmentsCount} consulta(s) futura(s)
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5" onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onOpen(row.original)}
              aria-label="Abrir paciente"
            >
              <Eye className="size-3.5" />
            </Button>
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onEdit(row.original)}
                aria-label="Editar paciente"
              >
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Mais ações"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onOpen(row.original)}>
                  <Eye className="size-3.5" />
                  Abrir ficha
                </DropdownMenuItem>
                {onEdit ? (
                  <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                    <Pencil className="size-3.5" />
                    Editar
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEdit, onOpen],
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum paciente encontrado"
        description="Ajuste os filtros ou cadastre o primeiro paciente da clínica."
        actionLabel={canManage ? "Novo paciente" : undefined}
        onAction={canManage ? onCreate : undefined}
      />
    );
  }

  const firstRow = (page - 1) * 20 + 1;
  const lastRow = Math.min(firstRow + items.length - 1, total);
  const pages = pageNumbers(page, totalPages);

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="surface-subtle hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-9 px-4 text-[11px] font-semibold uppercase tracking-[0.06em]">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => onOpen(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Mostrando {firstRow} a {lastRow} de {total} pacientes
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`e-${index}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                size="icon"
                variant={item === page ? "default" : "outline"}
                className="size-7 text-xs"
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
