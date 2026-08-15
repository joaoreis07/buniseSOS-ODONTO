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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { PatientClientDTO } from "../dto/patient.dto";
import { formatPhone } from "../utils/patient.utils";
import { PatientAvatar } from "./patient-avatar";
import { PatientStatusBadge } from "./patient-status-badge";
import { Users } from "lucide-react";

export function PatientTable({
  items,
  onOpen,
  onCreate,
  canManage,
  page,
  totalPages,
  onPageChange,
}: {
  items: PatientClientDTO[];
  onOpen: (patient: PatientClientDTO) => void;
  onCreate: () => void;
  canManage: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const columns = useMemo<ColumnDef<PatientClientDTO>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Paciente",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PatientAvatar name={row.original.fullName} photoUrl={row.original.photoUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{row.original.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.preferredName
                  ? `“${row.original.preferredName}” · `
                  : ""}
                {row.original.age != null ? `${row.original.age} anos` : "Idade —"}
              </p>
            </div>
          </div>
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
          <span className="text-sm">
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
          <div className="space-y-1">
            <PatientStatusBadge isActive={row.original.isActive} status={row.original.status} />
            {row.original.upcomingAppointmentsCount > 0 && (
              <p className="text-[11px] text-brand-700">
                {row.original.upcomingAppointmentsCount} consulta(s) futura(s)
              </p>
            )}
          </div>
        ),
      },
    ],
    [],
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

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase tracking-wider">
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
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
