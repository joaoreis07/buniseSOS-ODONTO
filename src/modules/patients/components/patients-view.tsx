"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, UserCheck, UserMinus, Users } from "lucide-react";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { StatCard } from "@/shared/components/stat-card";
import { listPatientsAction } from "../actions/patient.actions";
import type {
  PatientClientDTO,
  PatientListSort,
  PatientStatusFilter,
} from "../dto/patient.dto";
import { PatientFilters } from "./patient-filters";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientTable } from "./patient-table";
import { PatientToolbar } from "./patient-toolbar";

export function PatientsView({
  canManage,
}: {
  canManage: boolean;
  canManageClinical: boolean;
}) {
  const router = useRouter();
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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PatientClientDTO | null>(null);
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0, returnAlert: 0 });
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
    void Promise.all([
      listPatientsAction({ status: "ALL", pageSize: 5 }),
      listPatientsAction({ status: "ACTIVE", pageSize: 5 }),
      listPatientsAction({ status: "INACTIVE", pageSize: 5 }),
      listPatientsAction({ missingReturn: true, pageSize: 5 }),
    ]).then(([all, active, inactive, ret]) => {
      setCounts({
        all: all.success ? all.data.total : 0,
        active: active.success ? active.data.total : 0,
        inactive: inactive.success ? inactive.data.total : 0,
        returnAlert: ret.success ? ret.data.total : 0,
      });
    });
  }, []);

  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    router.replace(`/app/patients/${patientId}${searchParams.get("tab") ? `?tab=${searchParams.get("tab")}` : ""}`);
  }, [router, searchParams]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5">
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de pacientes"
          value={String(counts.all)}
          hint={`${counts.active} ativos`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Ativos"
          value={String(counts.active)}
          hint="Cadastros em atendimento"
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Retornos pendentes"
          value={String(counts.returnAlert)}
          hint="Com alerta de retorno"
          icon={CalendarClock}
          tone="warning"
        />
        <StatCard
          label="Inativos"
          value={String(counts.inactive)}
          hint="Fora da agenda ativa"
          icon={UserMinus}
          tone="neutral"
        />
      </section>

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
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onOpen={(patient) => router.push(`/app/patients/${patient.id}`)}
        onEdit={
          canManage
            ? (patient) => {
                setEditing(patient);
                setFormOpen(true);
              }
            : undefined
        }
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
          setTotal((prev) => (editing ? prev : prev + 1));
          void load();
        }}
      />
    </div>
  );
}