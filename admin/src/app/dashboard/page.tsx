"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { VisitPlanResponse } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISODate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
}

function fullRouteLink(plans: VisitPlanResponse[]): string | null {
  const stops = plans
    .filter((p) => p.patient_latitude && p.patient_longitude)
    .map((p) => `${p.patient_latitude},${p.patient_longitude}`)
    .join("/");
  return stops ? `https://www.google.com/maps/dir/${stops}` : null;
}

interface StoredDoctor {
  first_name: string;
  last_name: string;
  role: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: {
    label: "Хүлээгдэж байна",
    cls: "bg-amber-50 text-amber-600 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  confirmed: {
    label: "Баталгаажсан",
    cls: "bg-green-50 text-green-600 border-green-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  declined: {
    label: "Татгалзсан",
    cls: "bg-red-50 text-red-600 border-red-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = todayISODate();

  const [plans, setPlans] = useState<VisitPlanResponse[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [activeSchedules, setActiveSchedules] = useState<number | null>(null);

  const [doctor, setDoctor] = useState<StoredDoctor | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("admin_doctor");
    if (raw) {
      try { setDoctor(JSON.parse(raw)); } catch { /* malformed */ }
    }
  }, []);

  useEffect(() => {
    const doctorId = localStorage.getItem("admin_doctor_id");
    if (!doctorId) { setPlansLoading(false); return; }
    setPlansLoading(true);
    api.get<VisitPlanResponse[]>(`/api/v1/visit-plans/${today}`)
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [today]);

  useEffect(() => {
    api.get<{ items: { is_active: boolean }[] }>("/api/v1/schedules/")
      .then((res) => setActiveSchedules(res.items.filter((s) => s.is_active).length))
      .catch(() => setActiveSchedules(null));
  }, []);

  const handleSendConfirmations = async () => {
    setSending(true);
    try {
      const res = await api.post<{ sent: number; date: string }>(
        "/api/v1/notifications/send-day-before-confirmations",
        { date: today },
      );
      toast.success(
        res.sent > 0
          ? `${res.sent} өвчтөнд баталгаажуулалтын мэдэгдэл явуулсан`
          : "Telegram холбосон өвчтөн байхгүй",
      );
    } catch {
      toast.error("Мэдэгдэл явуулахад алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  const confirmed = plans.filter((p) => p.status === "confirmed").length;
  const pending = plans.filter((p) => p.status === "pending").length;
  const declined = plans.filter((p) => p.status === "declined").length;
  const routeLink = fullRouteLink(plans);

  const greeting = doctor
    ? `Сайн байна уу, Эмч ${doctor.first_name}!`
    : "Сайн байна уу!";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Өнөөдрийн гэрийн эргэлт — {today}
          </p>
        </div>
        {routeLink && (
          <a
            href={routeLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium transition-colors shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            Google Maps-д нээх
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        )}
      </div>

      {/* Main bento row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visit list — left, wider */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900 text-[15px]">
                Өнөөдрийн эргэлт
              </h2>
              {!plansLoading && plans.length > 0 && (
                <span className="text-[11px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                  {plans.length} өвчтөн
                </span>
              )}
            </div>
            <Link
              href="/dashboard/visits"
              className="text-[12px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Засах →
            </Link>
          </div>

          {plansLoading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <CalendarCheck2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500">
                Өнөөдрийн эргэлт товлогдоогүй байна
              </p>
              <Link
                href="/dashboard/visits"
                className="text-[13px] text-blue-500 hover:underline mt-1.5"
              >
                Эргэлт нэмэх →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {plans.map((plan, idx) => {
                const badge = STATUS_BADGE[plan.status] ?? STATUS_BADGE.pending;
                const hasGPS = plan.patient_latitude && plan.patient_longitude;
                return (
                  <div
                    key={plan.id}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Stop number */}
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {(plan.patient_name ?? "??").substring(0, 2).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {plan.patient_name ?? "—"}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {plan.patient_phone && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3" />
                            {plan.patient_phone}
                          </span>
                        )}
                        {plan.estimated_time && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {plan.estimated_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status badge */}
                    <span
                      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.cls} shrink-0`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    {/* Map link */}
                    {hasGPS && (
                      <a
                        href={`https://maps.google.com/?q=${plan.patient_latitude},${plan.patient_longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                        title="Газрын зурагт харах"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer — full route button */}
          {routeLink && (
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Nearest-neighbor алгоритмаар оновчлогдсон маршрут
              </p>
              <a
                href={routeLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Бүх маршрутыг харах
              </a>
            </div>
          )}
        </div>

        {/* Confirmation stats — right */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-900 text-[15px]">
            Баталгаажуулалт
          </h2>

          {plansLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              <StatPill
                icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                label="Баталгаажсан"
                value={confirmed}
                bg="bg-green-50"
                text="text-green-700"
              />
              <StatPill
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                label="Хүлээгдэж байна"
                value={pending}
                bg="bg-amber-50"
                text="text-amber-700"
              />
              <StatPill
                icon={<XCircle className="w-4 h-4 text-red-500" />}
                label="Татгалзсан"
                value={declined}
                bg="bg-red-50"
                text="text-red-700"
              />
            </div>
          )}

          <button
            onClick={handleSendConfirmations}
            disabled={sending || plans.length === 0}
            className="mt-auto flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Баталгаажуулалт явуулах
          </button>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Өнөөдрийн эргэлт"
          value={plansLoading ? "…" : plans.length.toString()}
          color="text-blue-600"
          icon={<CalendarCheck2 className="w-4 h-4 text-blue-400" />}
        />
        <StatCard
          label="Баталгаажсан"
          value={plansLoading ? "…" : confirmed.toString()}
          color="text-green-600"
          icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
        />
        <StatCard
          label="Идэвхтэй хуваарь"
          value={activeSchedules === null ? "…" : activeSchedules.toString()}
          color="text-violet-600"
          icon={<Users className="w-4 h-4 text-violet-400" />}
        />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  bg,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  text: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${bg}`}>
      {icon}
      <span className={`text-[13px] font-medium ${text} flex-1`}>{label}</span>
      <span className={`text-xl font-bold ${text}`}>{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
