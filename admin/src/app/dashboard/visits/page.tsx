"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck2,
  Clock,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatientResponse, PaginatedResponse, VisitPlanResponse, VisitPlanCreate } from "@/types";

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Хүлээгдэж байна", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  confirmed: { label: "Баталгаажсан",    cls: "bg-green-50 text-green-600 border-green-200" },
  declined:  { label: "Татгалзсан",      cls: "bg-red-50 text-red-600 border-red-200" },
};

export default function VisitsPage() {
  const [visitDate, setVisitDate] = useState(tomorrow());
  const [plans, setPlans] = useState<VisitPlanResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingTime, setAddingTime] = useState("09:00");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDoctorId = (): string | null => {
    try { return localStorage.getItem("admin_doctor_id"); } catch { return null; }
  };

  const fetchPlans = async (date: string) => {
    setLoading(true);
    try {
      const data = await api.get<VisitPlanResponse[]>(`/api/v1/visit-plans/${date}`);
      setPlans(data);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(visitDate); }, [visitDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const d = await api.get<PaginatedResponse<PatientResponse>>(
          `/api/v1/patients/?q=${encodeURIComponent(value)}&size=8`,
        );
        setSearchResults(d.items);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleAddPatient = async (patient: PatientResponse) => {
    setShowDropdown(false);
    setSearchQuery("");
    const doctorId = getDoctorId();
    if (!doctorId) {
      toast.error("Эмчийн мэдээлэл олдсонгүй. Дахин нэвтэрнэ үү.");
      return;
    }
    if (plans.some((p) => p.patient_id === patient.id)) {
      toast.error("Энэ өвчтөн аль хэдийн нэмэгдсэн байна.");
      return;
    }
    const body: VisitPlanCreate = {
      date: visitDate,
      doctor_id: doctorId,
      patient_id: patient.id,
      visit_order: plans.length + 1,
      estimated_time: addingTime || null,
    };
    try {
      const created = await api.post<VisitPlanResponse>("/api/v1/visit-plans/", body);
      setPlans((prev) => [...prev, created]);
      toast.success(`${patient.full_name} нэмэгдлээ`);
    } catch {
      toast.error("Нэмэхэд алдаа гарлаа");
    }
  };

  const handleRemove = async (plan: VisitPlanResponse) => {
    try {
      await api.delete(`/api/v1/visit-plans/${plan.id}`);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch {
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  const handleSendConfirmations = async () => {
    setSending(true);
    try {
      const res = await api.post<{ sent: number; date: string }>(
        "/api/v1/notifications/send-day-before-confirmations",
        { date: visitDate },
      );
      toast.success(
        res.sent > 0
          ? `${res.sent} өвчтөнд сануулга явуулсан`
          : "Telegram холбосон өвчтөн байхгүй байна",
      );
    } catch {
      toast.error("Сануулга явуулахад алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  const pendingCount = plans.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Гэрийн эргэлт</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Өдрийн эргэлтийн жагсаалт, урьдчилан баталгаажуулалт
          </p>
        </div>
        <button
          onClick={handleSendConfirmations}
          disabled={sending || plans.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium disabled:opacity-50 transition-colors shrink-0"
        >
          {sending ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Сануулга явуулах
        </button>
      </div>

      {/* Date + patient search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="w-4 h-4 text-slate-400 shrink-0" />
          <label className="text-[13px] font-medium text-slate-600 shrink-0">Огноо</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-start gap-2" ref={dropdownRef}>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Өвчтөн хайж нэмэх..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-2.5 w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            )}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddPatient(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {p.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{p.full_name}</p>
                      <p className="text-[11px] text-slate-500">{p.phone_number}</p>
                    </div>
                    {p.telegram_chat_id && (
                      <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 shrink-0">
                        Telegram
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="time"
              value={addingTime}
              onChange={(e) => setAddingTime(e.target.value)}
              className="text-[13px] border border-slate-200 rounded-lg px-2 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Plan list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarCheck2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Өвчтөн нэмэгдээгүй байна</p>
            <p className="text-xs mt-1">Дээрх хайлтаас өвчтөн нэмнэ үү</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {plans.map((plan, idx) => {
              const badge = STATUS_BADGE[plan.status] ?? STATUS_BADGE.pending;
              return (
                <div
                  key={plan.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[12px] font-bold text-slate-400 w-5 shrink-0 text-center">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {(plan.patient_name ?? "??").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">
                      {plan.patient_name ?? "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {plan.patient_phone && (
                        <span className="text-[11px] text-slate-500">{plan.patient_phone}</span>
                      )}
                      {plan.estimated_time && (
                        <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {plan.estimated_time.substring(0, 5)}
                        </span>
                      )}
                      {plan.has_telegram && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-1.5 py-0 leading-4">
                          TG
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.cls} shrink-0`}>
                    {badge.label}
                  </span>
                  {plan.status !== "declined" && (
                    <button
                      onClick={() => handleRemove(plan)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-[12px] text-slate-500">
              Нийт {plans.length} өвчтөн ·{" "}
              {plans.filter((p) => p.status === "confirmed").length} баталгаажсан ·{" "}
              {plans.filter((p) => p.status === "declined").length} татгалзсан ·{" "}
              {pendingCount} хүлээгдэж байна
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
