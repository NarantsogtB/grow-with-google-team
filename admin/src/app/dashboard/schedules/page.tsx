"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  MapPin,
  Phone,
  Navigation,
  Trash2,
  UserPlus,
  X,
  CalendarDays,
  Clock,
  Users,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ScheduleResponse,
  ScheduleCreate,
  DoctorResponse,
  PatientResponse,
  PaginatedResponse,
  DayOfWeekEnum,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: { key: DayOfWeekEnum; label: string; short: string }[] = [
  { key: "monday", label: "Даваа", short: "ДА" },
  { key: "tuesday", label: "Мягмар", short: "МЯ" },
  { key: "wednesday", label: "Лхагва", short: "ЛХ" },
  { key: "thursday", label: "Пүрэв", short: "ПҮ" },
  { key: "friday", label: "Баасан", short: "БА" },
];

type VisitPlan = Record<DayOfWeekEnum, string[]>;

const EMPTY_PLAN: VisitPlan = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

const EMPTY_SCHEDULE: Omit<ScheduleCreate, "doctor_id"> = {
  day_of_week: "monday",
  start_time: "09:00",
  end_time: "17:00",
  max_patients: 5,
  is_active: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function planKey(doctorId: string) {
  return `visit_plan_${doctorId}`;
}

function loadPlan(doctorId: string): VisitPlan {
  if (typeof window === "undefined") return { ...EMPTY_PLAN };
  try {
    const raw = localStorage.getItem(planKey(doctorId));
    if (!raw) return { ...EMPTY_PLAN };
    return { ...EMPTY_PLAN, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PLAN };
  }
}

function savePlan(doctorId: string, plan: VisitPlan) {
  localStorage.setItem(planKey(doctorId), JSON.stringify(plan));
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PatientCard({
  patient,
  onRemove,
}: {
  patient: PatientResponse;
  onRemove: () => void;
}) {
  const hasGPS = patient.latitude !== null && patient.longitude !== null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 group relative hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-2">
        {/* Avatar */}
        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[9px] font-bold shrink-0 mt-0.5">
          {initials(patient.full_name)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">
            {patient.full_name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-500">{patient.phone_number}</p>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-400 truncate leading-tight">
              {patient.address_text}
            </p>
          </div>
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {patient.sector && (
              <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                Сектор {patient.sector}
              </span>
            )}
            {hasGPS && (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full font-medium">
                <Navigation className="w-2 h-2" />
                GPS
              </span>
            )}
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50"
          title="Хасах"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SchedulesPage() {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [sectorPatients, setSectorPatients] = useState<PatientResponse[]>([]);
  const [visitPlan, setVisitPlan] = useState<VisitPlan>({ ...EMPTY_PLAN });
  const [pickerDay, setPickerDay] = useState<DayOfWeekEnum | null>(null);
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [slotForm, setSlotForm] =
    useState<Omit<ScheduleCreate, "doctor_id">>(EMPTY_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [mobileDay, setMobileDay] = useState<DayOfWeekEnum>("monday");

  // Load doctors on mount
  useEffect(() => {
    api
      .get<PaginatedResponse<DoctorResponse>>("/api/v1/doctors/?size=100")
      .then((d) => {
        setDoctors(d.items);
        if (d.items[0]) setSelectedDoctorId(d.items[0].id);
      })
      .catch(() => {})
      .finally(() => setDoctorsLoading(false));
  }, []);

  // When doctor changes: reload schedules, patients, plan
  useEffect(() => {
    if (!selectedDoctorId) return;
    const doctor = doctors.find((d) => d.id === selectedDoctorId);
    setDataLoading(true);

    let resolved = 0;
    const done = () => { resolved++; if (resolved === 2) setDataLoading(false); };

    // Load schedules
    api
      .get<ScheduleResponse[]>(`/api/v1/schedules/doctor/${selectedDoctorId}`)
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(done);

    // Load sector patients
    if (doctor?.assigned_sector) {
      api
        .get<PaginatedResponse<PatientResponse>>(
          `/api/v1/patients/?sector=${doctor.assigned_sector}&size=100`,
        )
        .then((r) => setSectorPatients(r.items))
        .catch(() => setSectorPatients([]))
        .finally(done);
    } else {
      setSectorPatients([]);
      done();
    }

    // Load visit plan from localStorage
    setVisitPlan(loadPlan(selectedDoctorId));
  }, [selectedDoctorId, doctors]);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // ── Plan mutations ─────────────────────────────────────────────────────────

  const assignPatient = useCallback(
    (day: DayOfWeekEnum, patientId: string) => {
      setVisitPlan((prev) => {
        const updated = { ...prev, [day]: [...prev[day], patientId] };
        savePlan(selectedDoctorId, updated);
        return updated;
      });
      setPickerDay(null);
    },
    [selectedDoctorId],
  );

  const removePatient = useCallback(
    (day: DayOfWeekEnum, patientId: string) => {
      setVisitPlan((prev) => {
        const updated = {
          ...prev,
          [day]: prev[day].filter((id) => id !== patientId),
        };
        savePlan(selectedDoctorId, updated);
        return updated;
      });
    },
    [selectedDoctorId],
  );

  // ── Schedule slot CRUD ─────────────────────────────────────────────────────

  const reloadSchedules = () => {
    if (!selectedDoctorId) return;
    api
      .get<ScheduleResponse[]>(`/api/v1/schedules/doctor/${selectedDoctorId}`)
      .then(setSchedules)
      .catch(() => {});
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post<ScheduleResponse>("/api/v1/schedules/", {
        ...slotForm,
        doctor_id: selectedDoctorId,
        start_time: slotForm.start_time + ":00",
        end_time: slotForm.end_time + ":00",
      });
      toast.success("Хуваарийн цаг хадгалагдлаа");
      setAddSlotOpen(false);
      reloadSchedules();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Хадгалахад алдаа гарлаа",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await api.delete(`/api/v1/schedules/${id}`);
      setSchedules((s) => s.filter((x) => x.id !== id));
      toast.success("Хуваарийн цаг устгагдлаа");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Устгахад алдаа гарлаа",
      );
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const allAssigned = new Set(Object.values(visitPlan).flat());

  const pickerPatients =
    pickerDay !== null
      ? sectorPatients.filter(
          (p) => !visitPlan[pickerDay].includes(p.id) && !allAssigned.has(p.id),
        )
      : [];

  const totalVisits = Object.values(visitPlan).reduce(
    (acc, ids) => acc + ids.length,
    0,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            7 хоногийн эргэлтийн хуваарь
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {selectedDoctor
              ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} · Сектор ${selectedDoctor.assigned_sector} · ${totalVisits} эргэлт товлогдсон`
              : "Эмчийг сонгоно уу"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Doctor selector */}
          {doctorsLoading ? (
            <Skeleton className="h-9 w-56 rounded-lg" />
          ) : (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {doctors.length === 0 && <option value="">Эмч олдсонгүй</option>}
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name} {d.last_name} (сектор {d.assigned_sector})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setSlotForm(EMPTY_SCHEDULE);
              setAddSlotOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg px-3.5 py-2 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            Цаг нэмэх
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {dataLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-6 w-8" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Хуваарийн цаг</p>
                <p className="text-xl font-bold text-slate-800">{schedules.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Бүртгэлтэй оршин суугч</p>
                <p className="text-xl font-bold text-slate-800">{sectorPatients.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <Navigation className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Энэ 7 хоног товлогдсон</p>
                <p className="text-xl font-bold text-slate-800">{totalVisits}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Mobile day view ── */}
      <div className="md:hidden space-y-3">
        {/* Day selector tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {DAYS.map(({ key, label }) => {
            const count = visitPlan[key].length;
            return (
              <button
                key={key}
                onClick={() => setMobileDay(key)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                  mobileDay === key
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none ${
                      mobileDay === key
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day content */}
        {(() => {
          const mobileDaySlot = schedules.find(
            (s) => s.day_of_week === mobileDay,
          );
          const mobileAssignedIds = visitPlan[mobileDay];
          const mobileAssignedPatients = mobileAssignedIds
            .map((id) => sectorPatients.find((p) => p.id === id))
            .filter(Boolean) as PatientResponse[];
          const mobileIsFull =
            mobileDaySlot &&
            mobileAssignedPatients.length >= mobileDaySlot.max_patients;

          return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Slot info */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                {mobileDaySlot ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-blue-700">
                        {mobileDaySlot.start_time.slice(0, 5)} –{" "}
                        {mobileDaySlot.end_time.slice(0, 5)}
                      </p>
                      <p className="text-[11px] text-blue-500">
                        {mobileAssignedPatients.length}/
                        {mobileDaySlot.max_patients} оршин суугч
                      </p>
                    </div>
                    <StatusBadge
                      variant={mobileDaySlot.is_active ? "active" : "inactive"}
                    />
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400">
                    Хуваарийн цаг байхгүй
                  </p>
                )}
              </div>

              {/* Patient cards */}
              <div className="p-3 space-y-2">
                {mobileAssignedPatients.length === 0 && (
                  <p className="text-center text-[12px] text-slate-300 py-6">
                    {DAYS.find((d) => d.key === mobileDay)?.label} өдрийн эргэлт
                    байхгүй
                  </p>
                )}
                {mobileAssignedPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onRemove={() => removePatient(mobileDay, patient.id)}
                  />
                ))}

                <button
                  onClick={() => setPickerDay(mobileDay)}
                  disabled={
                    !mobileDaySlot ||
                    !!mobileIsFull ||
                    sectorPatients.length === 0
                  }
                  className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-400 hover:text-blue-600 rounded-lg py-2.5 text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Оршин суугч нэмэх
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Weekly grid (desktop) ── */}
      <div className="hidden md:block">
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-opacity ${dataLoading ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Day header row */}
          <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50">
            {DAYS.map(({ key, label, short }) => {
              const daySchedules = schedules.filter(
                (s) => s.day_of_week === key,
              );
              const slot = daySchedules[0];
              return (
                <div
                  key={key}
                  className="px-3 py-3 border-r border-slate-100 last:border-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {short}
                      </p>
                    </div>
                    {slot && (
                      <StatusBadge
                        variant={slot.is_active ? "active" : "inactive"}
                        className="text-[9px] px-1.5 py-px"
                      />
                    )}
                  </div>
                  {slot ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5 mt-1 group/slot relative">
                      <p className="text-[11px] font-semibold text-blue-700">
                        {slot.start_time.slice(0, 5)} –{" "}
                        {slot.end_time.slice(0, 5)}
                      </p>
                      <p className="text-[10px] text-blue-500">
                        Хамгийн ихдээ {slot.max_patients} эргэлт
                      </p>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover/slot:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-600"
                        title="Цаг устгах"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 border border-dashed border-slate-200 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[10px] text-slate-300">Цаггүй</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Patient assignment rows */}
          <div className="grid grid-cols-5 min-h-[320px]">
            {DAYS.map(({ key, label }) => {
              const assignedIds = visitPlan[key];
              const assignedPatients = assignedIds
                .map((id) => sectorPatients.find((p) => p.id === id))
                .filter(Boolean) as PatientResponse[];
              const daySlot = schedules.find((s) => s.day_of_week === key);
              const isFull =
                daySlot && assignedPatients.length >= daySlot.max_patients;

              return (
                <div
                  key={key}
                  className="border-r border-slate-100 last:border-0 p-2.5 flex flex-col gap-2"
                >
                  {assignedPatients.length === 0 && (
                    <div className="flex-1 flex items-center justify-center min-h-[80px]">
                      <p className="text-[11px] text-slate-300 text-center">
                        {label} өдрийн
                        <br />
                        эргэлт байхгүй
                      </p>
                    </div>
                  )}

                  {assignedPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onRemove={() => removePatient(key, patient.id)}
                    />
                  ))}

                  {/* Add patient button */}
                  <button
                    onClick={() => setPickerDay(key)}
                    disabled={!daySlot || isFull || sectorPatients.length === 0}
                    className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-400 hover:text-blue-600 rounded-lg py-2 text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
                    title={
                      !daySlot
                        ? "Эхлээд цаг нэмнэ үү"
                        : isFull
                          ? "Хоосон байхгүй"
                          : "Эргэлт нэмэх"
                    }
                  >
                    <UserPlus className="w-3 h-3" />
                    Нэмэх
                    {daySlot && (
                      <span className="text-[10px] text-slate-300">
                        {assignedPatients.length}/{daySlot.max_patients}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Хуваарь{" "}
              <span className="font-medium text-slate-600">localStorage</span>-д
              хадгалагдана
              {selectedDoctor && (
                <span className="ml-2 text-blue-600 font-medium">
                  · Сектор {selectedDoctor.assigned_sector}
                </span>
              )}
            </p>
            {totalVisits > 0 && (
              <button
                onClick={() => {
                  if (!selectedDoctorId) return;
                  savePlan(selectedDoctorId, { ...EMPTY_PLAN });
                  setVisitPlan({ ...EMPTY_PLAN });
                  toast.success("Хуваарь арилгагдлаа");
                }}
                className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
              >
                Хуваарь цэвэрлэх
              </button>
            )}
          </div>
        </div>
      </div>
      {/* end desktop weekly grid wrapper */}

      {/* ── Patient picker dialog ── */}
      {pickerDay !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">
                  Эргэлт нэмэх — {DAYS.find((d) => d.key === pickerDay)?.label}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Сектор {selectedDoctor?.assigned_sector} ·{" "}
                  {pickerPatients.length} эргэлт боломжтой
                </p>
              </div>
              <button
                onClick={() => setPickerDay(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {pickerPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Users className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    Нэмэх гэрийн эргэлт байхгүй
                  </p>
                  <p className="text-xs mt-1 text-center">
                    Бүх эргэлт товлогдсон байна
                    <br />
                    эсвэл энэ сектор дахь эргэлт байхгүй
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pickerPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => assignPatient(pickerDay, patient.id)}
                      className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl p-3 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-[11px] font-bold shrink-0 transition-colors">
                          {initials(patient.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {patient.full_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <p className="text-[12px] text-slate-500">
                              {patient.phone_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <p className="text-[11px] text-slate-400 truncate">
                              {patient.address_text}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {patient.sector && (
                              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                Сектор {patient.sector}
                              </span>
                            )}
                            {patient.latitude !== null && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                                <Navigation className="w-2.5 h-2.5" />
                                GPS
                              </span>
                            )}
                            {patient.telegram_chat_id && (
                              <span className="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-medium">
                                Telegram
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-400 transition-all mt-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setPickerDay(null)}
                className="w-full border border-slate-200 hover:bg-white text-slate-600 text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Болих
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add schedule slot dialog ── */}
      {addSlotOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900">
                Хуваарийн цаг нэмэх
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {selectedDoctor
                  ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
                  : ""}
              </p>
            </div>

            <form onSubmit={handleSaveSlot} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Гараг *
                </label>
                <select
                  value={slotForm.day_of_week}
                  onChange={(e) =>
                    setSlotForm((f) => ({
                      ...f,
                      day_of_week: e.target.value as DayOfWeekEnum,
                    }))
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {DAYS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Эхлэх цаг *
                  </label>
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) =>
                      setSlotForm((f) => ({ ...f, start_time: e.target.value }))
                    }
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Дуусах цаг *
                  </label>
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) =>
                      setSlotForm((f) => ({ ...f, end_time: e.target.value }))
                    }
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Хамгийн их эргэлт
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={slotForm.max_patients}
                  onChange={(e) =>
                    setSlotForm((f) => ({
                      ...f,
                      max_patients: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slotForm.is_active}
                  onChange={(e) =>
                    setSlotForm((f) => ({
                      ...f,
                      is_active: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-[13px] font-medium text-slate-700">
                  Идэвхтэй
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddSlotOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg py-2.5 transition-colors"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedDoctorId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
                >
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
