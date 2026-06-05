"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  Route,
  Ruler,
  Clock,
  Users,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DoctorResponse,
  PatientResponse,
  PaginatedResponse,
  DayOfWeekEnum,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: { key: DayOfWeekEnum; label: string }[] = [
  { key: "monday", label: "Даваа" },
  { key: "tuesday", label: "Мягмар" },
  { key: "wednesday", label: "Лхагва" },
  { key: "thursday", label: "Пүрэв" },
  { key: "friday", label: "Баасан" },
];

const EMPTY_PLAN: Record<DayOfWeekEnum, string[]> = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

// ── Haversine TSP (mirrors server/app/tools/route_tools.py) ──────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function optimizeRoute(patients: PatientResponse[]): PatientResponse[] {
  const withGPS = patients.filter(
    (p) => p.latitude !== null && p.longitude !== null,
  );
  const noGPS = patients.filter(
    (p) => p.latitude === null || p.longitude === null,
  );
  if (withGPS.length <= 1) return [...withGPS, ...noGPS];

  const route: PatientResponse[] = [withGPS[0]];
  const unvisited = [...withGPS.slice(1)];

  while (unvisited.length > 0) {
    const cur = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineKm(
        cur.latitude!,
        cur.longitude!,
        unvisited[i].latitude!,
        unvisited[i].longitude!,
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    route.push(unvisited[nearestIdx]);
    unvisited.splice(nearestIdx, 1);
  }

  return [...route, ...noGPS];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPlan(doctorId: string): Record<DayOfWeekEnum, string[]> {
  if (typeof window === "undefined") return { ...EMPTY_PLAN };
  try {
    const raw = localStorage.getItem(`visit_plan_${doctorId}`);
    if (!raw) return { ...EMPTY_PLAN };
    return { ...EMPTY_PLAN, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PLAN };
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function mapsLink(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

function fullRouteLink(patients: PatientResponse[]) {
  const stops = patients
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => `${p.latitude},${p.longitude}`)
    .join("/");
  return stops ? `https://www.google.com/maps/dir/${stops}` : null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoutePage() {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [sectorPatients, setSectorPatients] = useState<PatientResponse[]>([]);
  const [activeDay, setActiveDay] = useState<DayOfWeekEnum>("monday");
  const [visitPlan, setVisitPlan] =
    useState<Record<DayOfWeekEnum, string[]>>(EMPTY_PLAN);

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

  useEffect(() => {
    if (!selectedDoctorId) return;
    const doctor = doctors.find((d) => d.id === selectedDoctorId);
    setVisitPlan(loadPlan(selectedDoctorId));

    if (doctor?.assigned_sector) {
      setPatientsLoading(true);
      api
        .get<PaginatedResponse<PatientResponse>>(
          `/api/v1/patients/?sector=${doctor.assigned_sector}&size=100`,
        )
        .then((r) => setSectorPatients(r.items))
        .catch(() => setSectorPatients([]))
        .finally(() => setPatientsLoading(false));
    } else {
      setSectorPatients([]);
    }
  }, [selectedDoctorId, doctors]);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Build optimized route for the active day
  const dayPatients = useMemo(() => {
    const ids = visitPlan[activeDay] ?? [];
    const mapped = ids
      .map((id) => sectorPatients.find((p) => p.id === id))
      .filter(Boolean) as PatientResponse[];
    return optimizeRoute(mapped);
  }, [visitPlan, activeDay, sectorPatients]);

  // Per-leg distances
  const legDistances = useMemo(() => {
    const dists: (number | null)[] = [];
    for (let i = 0; i < dayPatients.length - 1; i++) {
      const a = dayPatients[i];
      const b = dayPatients[i + 1];
      if (
        a.latitude !== null &&
        a.longitude !== null &&
        b.latitude !== null &&
        b.longitude !== null
      ) {
        dists.push(
          haversineKm(a.latitude, a.longitude, b.latitude, b.longitude),
        );
      } else {
        dists.push(null);
      }
    }
    return dists;
  }, [dayPatients]);

  const totalKm = useMemo(
    () =>
      legDistances
        .filter((d): d is number => d !== null)
        .reduce((s, d) => s + d, 0),
    [legDistances],
  );

  // Estimated minutes: ~8 km/h walking/driving slowly in ger districts
  const estMinutes = Math.round((totalKm / 8) * 60);

  const routeLink = fullRouteLink(dayPatients);
  const hasAnyPatients = dayPatients.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Route className="w-4.5 h-4.5 text-slate-500" />
            <h1 className="text-xl font-bold text-slate-900">Өдрийн маршрут</h1>
          </div>
          <p className="text-[13px] text-slate-500">
            {selectedDoctor
              ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} · Сектор ${selectedDoctor.assigned_sector}`
              : "Эмчийг сонгоно уу"}
          </p>
        </div>

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
      </div>

      {/* ── Day tabs ── */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit min-w-max">
          {DAYS.map(({ key, label }) => {
            const count = (visitPlan[key] ?? []).length;
            return (
              <button
                key={key}
                onClick={() => setActiveDay(key)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                  activeDay === key
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none ${
                      activeDay === key
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
      </div>
      {/* end overflow wrapper */}

      {/* ── Stats row ── */}
      {hasAnyPatients && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                Оршин суугч
              </p>
              <p className="text-xl font-bold text-slate-800">
                {dayPatients.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Ruler className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                Нийт зай
              </p>
              <p className="text-xl font-bold text-slate-800">
                {totalKm > 0 ? `~${totalKm.toFixed(1)} км` : "—"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                Хөдөлгөөний цаг
              </p>
              <p className="text-xl font-bold text-slate-800">
                {totalKm > 0 ? `~${estMinutes} мин` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Route list ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {patientsLoading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasAnyPatients ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <MapPin className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-500">
              Эргэлт товлогдоогүй байна
            </p>
            <p className="text-xs mt-1 text-center text-slate-400 max-w-xs">
              {DAYS.find((d) => d.key === activeDay)?.label} өдөрт эргэлт
              байхгүй.
              <br />
              <Link
                href="/dashboard/schedules"
                className="text-blue-500 hover:underline"
              >
                Хуваарь хуудсаас
              </Link>{" "}
              нэмнэ үү.
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                Оновчлогдсон эргэлтийн дараалал
              </p>
              {routeLink && (
                <a
                  href={routeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Бүх маршрутыг газрын зурагт харах
                </a>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {dayPatients.map((patient, idx) => {
                const hasGPS =
                  patient.latitude !== null && patient.longitude !== null;
                const legDist = legDistances[idx] ?? null;

                return (
                  <div key={patient.id}>
                    {/* Patient row */}
                    <div className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      {/* Stop number */}
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 text-[11px] font-bold shrink-0">
                        {initials(patient.full_name)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-slate-800">
                          {patient.full_name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[12px] text-slate-500">
                            {patient.phone_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[12px] text-slate-400 truncate">
                            {patient.address_text}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {patient.sector && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                              Сектор {patient.sector}
                            </span>
                          )}
                          {hasGPS ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full font-medium">
                              <Navigation className="w-2 h-2" />
                              GPS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium">
                              <AlertCircle className="w-2 h-2" />
                              GPS байхгүй
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Map link */}
                      {hasGPS && (
                        <a
                          href={mapsLink(patient.latitude!, patient.longitude!)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700 border border-blue-100 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-all shrink-0 bg-blue-50/50 hover:bg-blue-50"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Газрын зураг
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      )}
                    </div>

                    {/* Leg distance connector */}
                    {idx < dayPatients.length - 1 && (
                      <div className="flex items-center gap-3 px-5 py-1.5 bg-slate-50/60">
                        <div className="w-7 flex justify-center">
                          <div className="w-px h-4 bg-slate-300" />
                        </div>
                        <div className="flex items-center gap-1.5 ml-9">
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          {legDist !== null ? (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {legDist.toFixed(2)} км
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-300">
                              GPS байхгүй — зай тооцоологдохгүй
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
              <p className="text-[11px] text-slate-400">
                Nearest-neighbor алгоритмаар оновчлогдсон · Хуваарь{" "}
                <span className="font-medium text-slate-600">localStorage</span>
                -аас уншигдав
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
