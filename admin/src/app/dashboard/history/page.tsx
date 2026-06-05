"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ClipboardList, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConsultationResponse, PaginatedResponse } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function excerpt(text: string | null, max = 80): string {
  if (!text) return "—";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ── SOAP section ──────────────────────────────────────────────────────────────

const SOAP_SECTIONS = [
  { key: "soap_s" as const, tag: "S", label: "Субъектив", bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
  { key: "soap_o" as const, tag: "O", label: "Объектив",   bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-800"  },
  { key: "soap_a" as const, tag: "A", label: "Үнэлгээ",    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  { key: "soap_p" as const, tag: "P", label: "Төлөвлөгөө", bg: "bg-violet-50",border: "border-violet-200",text: "text-violet-800"},
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const doctorId = localStorage.getItem("admin_doctor_id");
    const url = doctorId
      ? `/api/v1/consultations/?doctor_id=${doctorId}&size=50`
      : `/api/v1/consultations/?size=50`;

    api
      .get<PaginatedResponse<ConsultationResponse>>(url)
      .then((res) => {
        setConsultations(res.items);
        setTotal(res.total);
      })
      .catch(() => setConsultations([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Үзлэгийн түүх</h1>
          {total !== null && (
            <span className="text-[11px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
              {total} үзлэг
            </span>
          )}
        </div>
        <Link
          href="/dashboard/consultation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Шинэ үзлэг
        </Link>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <Skeleton className="h-3.5 w-28 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            ))}
          </div>
        ) : consultations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-500">
              Үзлэг бүртгэгдээгүй байна
            </p>
            <Link
              href="/dashboard/consultation"
              className="text-[13px] text-blue-500 hover:underline mt-1.5"
            >
              Шинэ үзлэг эхлэх →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {consultations.map((c) => {
              const isOpen = expandedId === c.id;
              return (
                <div key={c.id}>
                  {/* Row */}
                  <button
                    onClick={() => toggle(c.id)}
                    className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Date */}
                    <span className="text-[11px] text-slate-400 font-mono shrink-0 mt-0.5 w-32">
                      {formatDateTime(c.created_at)}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {c.patient_name ?? "Нэргүй өвчтөн"}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                        {excerpt(c.soap_s)}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Expanded SOAP */}
                  {isOpen && (
                    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border-t border-slate-100">
                      {SOAP_SECTIONS.map(({ key, tag, label, bg, border, text }) => (
                        <div
                          key={key}
                          className={`rounded-xl border p-3.5 ${bg} ${border}`}
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${text}`}>
                            {tag} — {label}
                          </p>
                          <p className={`text-[12px] leading-relaxed whitespace-pre-wrap ${text} opacity-80`}>
                            {c[key] ?? "—"}
                          </p>
                        </div>
                      ))}
                      {c.transcription && (
                        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Бичлэгийн текст
                          </p>
                          <p className="text-[12px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                            {c.transcription}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
