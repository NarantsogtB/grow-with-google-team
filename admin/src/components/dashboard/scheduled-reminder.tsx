"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

interface ScheduledJob {
  id: string;
  label: string;
  fire_at: string; // ISO UTC
}

type JobType = "bulk" | "day_before";

const QUICK_MINUTES = [1, 5, 15, 30];

function todayISO(): string {
  // local "today" in Ulaanbaatar (UTC+8) regardless of viewer's TZ
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
}

function tomorrowISO(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
}

function hhmmInUBToUTCISO(hhmm: string): string {
  // hhmm like "14:35" — interpret as TODAY in Asia/Ulaanbaatar, convert to ISO UTC
  const [h, m] = hhmm.split(":").map(Number);
  const todayUB = todayISO(); // "YYYY-MM-DD" in UB
  // UB is +08:00, so 14:35 UB = (14:35 - 08:00) UTC for the SAME date if the
  // result is still positive — otherwise it would cross to previous day. For
  // simplicity we just build the +08:00 ISO string and let JS Date normalise.
  const isoWithOffset = `${todayUB}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`;
  return new Date(isoWithOffset).toISOString();
}

function nowPlusMinutesUTCISO(min: number): string {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

function formatUB(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Ulaanbaatar",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduledReminderCard() {
  const [type, setType] = useState<JobType>("bulk");
  const [time, setTime] = useState<string>(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    const ub = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ulaanbaatar",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return ub.replace(/\s/g, "");
  });
  const [forDate, setForDate] = useState<string>(tomorrowISO());
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);

  const refresh = useCallback(async () => {
    try {
      const list = await api.get<ScheduledJob[]>("/api/v1/notifications/scheduled");
      setJobs(list);
    } catch {
      // Empty silently — the list just hides
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const schedule = async (fireAtIso: string) => {
    setSubmitting(true);
    try {
      if (type === "bulk") {
        await api.post<ScheduledJob>(
          "/api/v1/notifications/scheduled/bulk-reminder",
          { fire_at: fireAtIso },
        );
      } else {
        await api.post<ScheduledJob>(
          "/api/v1/notifications/scheduled/day-before",
          { fire_at: fireAtIso, for_date: forDate },
        );
      }
      toast.success(`✅ ${formatUB(fireAtIso)} цагт явна`);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Тохируулахад алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await api.delete(`/api/v1/notifications/scheduled/${id}`);
      toast.success("Цуцлав");
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Цуцлахад алдаа гарлаа");
    }
  };

  const pickedAtLabel = useMemo(() => {
    try {
      return formatUB(hhmmInUBToUTCISO(time));
    } catch {
      return "—";
    }
  }, [time]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-600" />
        <h2 className="font-semibold text-slate-900 text-[15px]">
          Цагаар тохируулсан сануулга
        </h2>
        <span className="text-[10px] text-slate-400 ml-auto">
          (бодит цаг тулсан үед нэг удаа явна)
        </span>
      </div>

      {/* Type picker */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("bulk")}
          className={`rounded-lg py-2 text-[12px] font-medium transition-colors border ${
            type === "bulk"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Бөөн сануулга
        </button>
        <button
          type="button"
          onClick={() => setType("day_before")}
          className={`rounded-lg py-2 text-[12px] font-medium transition-colors border ${
            type === "day_before"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Маргаашийн баталгаажуулалт
        </button>
      </div>

      {type === "day_before" && (
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Зорчих өдөр
          </label>
          <input
            type="date"
            value={forDate}
            onChange={(e) => setForDate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      )}

      {/* Time picker */}
      <div>
        <label className="block text-[11px] font-medium text-slate-600 mb-1">
          Илгээх цаг (Ulaanbaatar)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => schedule(hhmmInUBToUTCISO(time))}
            disabled={submitting}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-medium rounded-lg px-3 py-2 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {pickedAtLabel}
          </button>
        </div>
      </div>

      {/* Quick minute buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400">Хурдан тохируулга:</span>
        {QUICK_MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => schedule(nowPlusMinutesUTCISO(m))}
            disabled={submitting}
            className="text-[12px] text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-lg px-2.5 py-1 font-medium transition-colors"
          >
            +{m} мин
          </button>
        ))}
      </div>

      {/* Pending jobs */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Хүлээгдэж буй ({jobs.length})
        </p>
        {jobs.length === 0 ? (
          <p className="text-[12px] text-slate-400 italic">
            Одоогоор тохируулсан жоб алга байна.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-slate-700 truncate">
                    {j.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{formatUB(j.fire_at)} UB</p>
                </div>
                <button
                  type="button"
                  onClick={() => cancel(j.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Цуцлах"
                  title="Цуцлах"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
