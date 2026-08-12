"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { getPatientAction, listPatientsAction } from "../actions/patient.actions";
import type {
  PatientClientDTO,
  PatientListSort,
  PatientStatusFilter,
} from "../dto/patient.dto";
import { PatientFilters } from "./patient-filters";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientProfileSheet } from "./patient-profile-sheet";
import { PatientTable } from "./patient-table";
import { PatientToolbar } from "./patient-toolbar";

export function PatientsView({ canManage }: { canManage: boolean }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PatientClientDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cities, setCities] = useState<string[]>([]);
  const [insurances, setInsurances] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PatientStatusFilter>("ACTIVE");
  const [city, setCity] = useState("");
  const [insurance, setInsurance] = useState("");
  const [hasUpcoming, setHasUpcoming] = useState(false);
  const [missingReturn, setMissingReturn] = useState(false);
  const [sort, setSort] = useState<PatientListSort>("name_asc");
  const [selected, setSelected] = useState<PatientClientDTO | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PatientClientDTO | null>(null);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    const result = await listPatientsAction({
      search: search.trim() || undefined,
      status,
      city: city || undefined,
      insurance: insurance || undefined,
      hasUpcoming: hasUpcoming || undefined,
      missingReturn: missingReturn || undefined,
      page,
      pageSize: 20,
      sort,
    });
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setItems(result.data.items);
    setTotal(result.data.total);
    setTotalPages(result.data.totalPages);
    setCities(result.data.cities);
    setInsurances(result.data.insurances);
    setLoading(false);
  }, [search, status, city, insurance, hasUpcoming, missingReturn, page, sort]);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    void getPatientAction(patientId).then((result) => {
      if (!result.success) return;
      setSelected(result.data);
      setProfileOpen(true);
    });
  }, [searchParams]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <PatientToolbar
        search={search}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        canManage={canManage}
        total={total}
      />

      <PatientFilters
        status={status}
        onStatusChange={(value) => {
          setPage(1);
          setStatus(value);
        }}
        city={city}
        onCityChange={(value) => {
          setPage(1);
          setCity(value);
        }}
        insurance={insurance}
        onInsuranceChange={(value) => {
          setPage(1);
          setInsurance(value);
        }}
        hasUpcoming={hasUpcoming}
        onHasUpcomingChange={(value) => {
          setPage(1);
          setHasUpcoming(value);
        }}
        missingReturn={missingReturn}
        onMissingReturnChange={(value) => {
          setPage(1);
          setMissingReturn(value);
        }}
        sort={sort}
        onSortChange={(value) => {
          setPage(1);
          setSort(value);
        }}
        cities={cities}
        insurances={insurances}
      />

      <PatientTable
        items={items}
        canManage={canManage}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onOpen={(patient) => {
          setSelected(patient);
          setProfileOpen(true);
        }}
      />

      <PatientProfileSheet
        patient={selected}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        canManage={canManage}
        initialTab={searchParams.get("tab") === "prontuario" ? "clinical" : "overview"}
        onEdit={(patient) => {
          setEditing(patient);
          setFormOpen(true);
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((patient) => patient.id !== id));
          setSelected(null);
          setTotal((prev) => Math.max(0, prev - 1));
          void load();
        }}
      />

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editing}
        onSaved={(patient) => {
          setItems((prev) => {
            const exists = prev.some((item) => item.id === patient.id);
            if (exists) return prev.map((item) => (item.id === patient.id ? patient : item));
            return [patient, ...prev];
          });
          setSelected(patient);
          setTotal((prev) => (editing ? prev : prev + 1));
          void load();
        }}
      />
    </div>
  );
}
