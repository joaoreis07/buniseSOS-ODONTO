"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Cake, UserMinus, UserPlus, Users } from "lucide-react";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import { StatCard } from "@/shared/components/stat-card";
import {
  getPatientListKpisAction,
  getPatientQuotaAction,
  listPatientsAction,
} from "../actions/patient.actions";
import type { PatientListKpisDTO, PatientQuotaDTO } from "../services/patient.service";
import { PatientLimitDialog } from "./patient-limit-dialog";
import type {
  PatientClientDTO,
  PatientListSort,
  PatientStatusFilter,
} from "../dto/patient.dto";
import { PatientFilters } from "./patient-filters";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientTable } from "./patient-table";
import { PatientToolbar } from "./patient-toolbar";

const DEFAULT_STATUS: PatientStatusFilter = "ACTIVE";

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
  const [status, setStatus] = useState<PatientStatusFilter>(DEFAULT_STATUS);
  const [city, setCity] = useState("");
  const [insurance, setInsurance] = useState("");
  const [hasUpcoming, setHasUpcoming] = useState(false);
  const [missingReturn, setMissingReturn] = useState(false);
  const [createdThisMonth, setCreatedThisMonth] = useState(false);
  const [birthdayThisMonth, setBirthdayThisMonth] = useState(false);
  const [sort, setSort] = useState<PatientListSort>("name_asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [editing, setEditing] = useState<PatientClientDTO | null>(null);
  const [kpis, setKpis] = useState<PatientListKpisDTO>({
    all: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
    newLastMonth: 0,
    birthdaysThisMonth: 0,
    returnAlert: 0,
  });
  const [quota, setQuota] = useState<PatientQuotaDTO | null>(null);
  const [, startTransition] = useTransition();

  const extraFilterCount = [
    status !== DEFAULT_STATUS,
    Boolean(city),
    Boolean(insurance),
    hasUpcoming,
    missingReturn,
    createdThisMonth,
    birthdayThisMonth,
    sort !== "name_asc",
  ].filter(Boolean).length;

  const load = useCallback(async () => {
    const result = await listPatientsAction({
      search: search.trim() || undefined,
      status,
      city: city || undefined,
      insurance: insurance || undefined,
      hasUpcoming: hasUpcoming || undefined,
      missingReturn: missingReturn || undefined,
      createdThisMonth: createdThisMonth || undefined,
      birthdayThisMonth: birthdayThisMonth || undefined,
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
    void getPatientQuotaAction().then((quotaResult) => {
      if (quotaResult.success) setQuota(quotaResult.data);
    });
  }, [
    search,
    status,
    city,
    insurance,
    hasUpcoming,
    missingReturn,
    createdThisMonth,
    birthdayThisMonth,
    page,
    sort,
  ]);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    void getPatientListKpisAction().then((result) => {
      if (result.success) setKpis(result.data);
    });
  }, []);

  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    router.replace(`/app/patients/${patientId}${searchParams.get("tab") ? `?tab=${searchParams.get("tab")}` : ""}`);
  }, [router, searchParams]);

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setStatus(DEFAULT_STATUS);
    setCity("");
    setInsurance("");
    setHasUpcoming(false);
    setMissingReturn(false);
    setCreatedThisMonth(false);
    setBirthdayThisMonth(false);
    setSort("name_asc");
    setPage(1);
  }

  const newMonthDelta =
    kpis.newLastMonth > 0
      ? Math.round(((kpis.newThisMonth - kpis.newLastMonth) / kpis.newLastMonth) * 100)
      : null;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <PatientToolbar
        search={search}
        onSearchChange={(value) => {
          resetPage();
          setSearch(value);
        }}
        onCreate={() => {
          if (quota?.reached) {
            setLimitOpen(true);
            return;
          }
          setEditing(null);
          setFormOpen(true);
        }}
        canManage={canManage}
        total={total}
        quota={quota}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        extraFilterCount={extraFilterCount}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de pacientes"
          value={String(kpis.all)}
          hint={<span className="text-success">Ativos: {kpis.active}</span>}
          icon={Users}
          tone="primary"
          size="compact"
        />
        <StatCard
          label="Novos este mês"
          value={String(kpis.newThisMonth)}
          hint={
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => {
                setFiltersOpen(true);
                setStatus("ALL");
                setBirthdayThisMonth(false);
                setCreatedThisMonth(true);
                setSort("created_desc");
                setPage(1);
              }}
            >
              {newMonthDelta == null
                ? "Ver novos deste mês →"
                : `${newMonthDelta >= 0 ? "↑" : "↓"} ${Math.abs(newMonthDelta)}% vs mês passado`}
            </button>
          }
          icon={UserPlus}
          tone="info"
          size="compact"
        />
        <StatCard
          label="Aniversariantes do mês"
          value={String(kpis.birthdaysThisMonth)}
          hint={
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setFiltersOpen(true);
                setStatus("ALL");
                setCreatedThisMonth(false);
                setBirthdayThisMonth(true);
                setPage(1);
              }}
            >
              Ver aniversariantes →
            </button>
          }
          icon={Cake}
          tone="warning"
          size="compact"
        />
        <StatCard
          label="Inativos"
          value={String(kpis.inactive)}
          hint={
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setFiltersOpen(true);
                setBirthdayThisMonth(false);
                setCreatedThisMonth(false);
                setStatus("INACTIVE");
                setPage(1);
              }}
            >
              Ver pacientes inativos →
            </button>
          }
          icon={UserMinus}
          tone="neutral"
          size="compact"
        />
      </section>

      {filtersOpen ? (
        <PatientFilters
          status={status}
          onStatusChange={(value) => {
            resetPage();
            setStatus(value);
          }}
          city={city}
          onCityChange={(value) => {
            resetPage();
            setCity(value);
          }}
          insurance={insurance}
          onInsuranceChange={(value) => {
            resetPage();
            setInsurance(value);
          }}
          hasUpcoming={hasUpcoming}
          onHasUpcomingChange={(value) => {
            resetPage();
            setHasUpcoming(value);
          }}
          missingReturn={missingReturn}
          onMissingReturnChange={(value) => {
            resetPage();
            setMissingReturn(value);
          }}
          createdThisMonth={createdThisMonth}
          onCreatedThisMonthChange={(value) => {
            resetPage();
            setCreatedThisMonth(value);
            if (value) setBirthdayThisMonth(false);
          }}
          birthdayThisMonth={birthdayThisMonth}
          onBirthdayThisMonthChange={(value) => {
            resetPage();
            setBirthdayThisMonth(value);
            if (value) {
              setCreatedThisMonth(false);
              setStatus("ALL");
            }
          }}
          sort={sort}
          onSortChange={(value) => {
            resetPage();
            setSort(value);
          }}
          cities={cities}
          insurances={insurances}
          onClear={clearFilters}
          canClear={extraFilterCount > 0}
        />
      ) : null}

      {search.trim() || extraFilterCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {total} resultado{total === 1 ? "" : "s"}
          {search.trim() ? ` para “${search.trim()}”` : ""}
        </p>
      ) : null}

      <PatientTable
        items={items}
        canManage={canManage}
        page={page}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onCreate={() => {
          if (quota?.reached) {
            setLimitOpen(true);
            return;
          }
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
        onLimitReached={() => setLimitOpen(true)}
        onSaved={(patient) => {
          setItems((prev) => {
            const exists = prev.some((item) => item.id === patient.id);
            if (exists) return prev.map((item) => (item.id === patient.id ? patient : item));
            return [patient, ...prev];
          });
          setTotal((prev) => (editing ? prev : prev + 1));
          void load();
          void getPatientListKpisAction().then((result) => {
            if (result.success) setKpis(result.data);
          });
        }}
      />
      <PatientLimitDialog open={limitOpen} onOpenChange={setLimitOpen} />
    </div>
  );
}
