"use client";

import { useEffect, useState } from "react";
import { Users, MapPin, Phone, Calendar, Send, CheckCircle, Link, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PatientResponse, PaginatedResponse } from "@/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [linkPatient, setLinkPatient] = useState<PatientResponse | null>(null);
  const [chatIdInput, setChatIdInput] = useState("");
  const [linking, setLinking] = useState(false);
  const PAGE_SIZE = 10;

  const fetchPatients = async (p: number) => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<PatientResponse>>(
        `/api/v1/patients/?page=${p}&size=${PAGE_SIZE}`,
      );
      setPatients(data.items);
      setTotal(data.total);
    } catch {
      // backend offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(page);
  }, [page]);

  const handleSendReminder = async (patientId: string) => {
    setSendingId(patientId);
    try {
      await api.post("/api/v1/notifications/send-reminder", { patient_id: patientId });
      setSentIds((prev) => new Set(prev).add(patientId));
      toast.success("Мэдэгдэл амжилттай илгээлээ");
    } catch {
      toast.error("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSendingId(null);
    }
  };

  const handleBulkSend = async () => {
    setBulkSending(true);
    try {
      const res = await api.post<{ sent: number; failed: number; total: number }>(
        "/api/v1/notifications/send-bulk-reminder",
        {},
      );
      if (res.total === 0) {
        toast.info(
          "Telegram холбогдсон өвчтөн байхгүй байна. Өвчтөн bot-д /link дугаар команд явуулах ёстой.",
        );
      } else {
        toast.success(
          `${res.sent} өвчтөнд мэдэгдэл илгээлээ${res.failed ? ` (${res.failed} алдаатай)` : ""}`,
        );
      }
    } catch {
      toast.error("Багц илгээхэд алдаа гарлаа");
    } finally {
      setBulkSending(false);
    }
  };

  const openLinkDialog = (p: PatientResponse) => {
    setLinkPatient(p);
    setChatIdInput(p.telegram_chat_id ?? "");
  };

  const handleLinkSave = async () => {
    if (!linkPatient) return;
    setLinking(true);
    try {
      const updated = await api.put<PatientResponse>(
        `/api/v1/patients/${linkPatient.id}`,
        { telegram_chat_id: chatIdInput.trim() || null },
      );
      setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setLinkPatient(null);
      toast.success("Telegram мэдээлэл хадгалагдлаа");
    } catch {
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      setLinking(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pagination = totalPages > 1 && (
    <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
      <span className="text-[12px] text-slate-500">
        Хуудас {page} / {totalPages} · нийт {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          Өмнөх
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          Дараа
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Оршин суугч</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} бүртгэлтэй оршин суугч
          </p>
        </div>
        <button
          onClick={handleBulkSend}
          disabled={bulkSending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium disabled:opacity-50 transition-colors shrink-0"
        >
          {bulkSending ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Бүгдэд сануулга
        </button>
      </div>

      {loading && (
        <>
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-48" />
              </div>
            ))}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Нэр", "Утас", "Хаяг", "Telegram", "Бүртгэгдсэн"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                          <Skeleton className="h-3.5 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-3.5 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-3.5 w-20" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && patients.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-6 text-center">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-600">
              Танай хэсэгт бүртгэлтэй өвчтөн алга байна
            </p>
            <p className="text-xs mt-2 text-slate-500 max-w-sm">
              Өвчтнүүд patient portal-аар (
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">/register</code>
              ) өөрсдөө бүртгүүлэх, эсвэл super-admin самбараас гараар нэмэх боломжтой.
            </p>
          </div>
        </div>
      )}

      {!loading && patients.length > 0 && (
        <>
          {/* ── Mobile card list ── */}
          <div className="md:hidden space-y-3">
            {patients.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[12px] font-bold shrink-0">
                    {p.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-[14px] font-semibold text-slate-800">
                    {p.full_name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {p.phone_number}
                </div>
                <div className="flex items-start gap-1.5 text-[12px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                  <span className="line-clamp-2">{p.address_text}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  {p.telegram_chat_id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSendReminder(p.id)}
                        disabled={sendingId === p.id || sentIds.has(p.id)}
                        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        {sentIds.has(p.id) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {sentIds.has(p.id) ? "Илгээсэн" : sendingId === p.id ? "..." : "Сануулга"}
                      </button>
                      <button
                        onClick={() => openLinkDialog(p)}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Telegram ID засах"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openLinkDialog(p)}
                      className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Link className="w-3 h-3" />
                      Telegram холбох
                    </button>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(p.created_at).toLocaleDateString("mn-MN")}
                  </div>
                </div>
              </div>
            ))}
            {pagination}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Нэр", "Утас", "Хаяг", "Telegram", "Бүртгэгдсэн"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {p.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">
                            {p.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.phone_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 md:max-w-[200px]">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate text-[12px]">
                            {p.address_text}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.telegram_chat_id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSendReminder(p.id)}
                              disabled={sendingId === p.id || sentIds.has(p.id)}
                              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                              {sentIds.has(p.id) ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              {sentIds.has(p.id) ? "Илгээсэн" : sendingId === p.id ? "..." : "Сануулга"}
                            </button>
                            <button
                              onClick={() => openLinkDialog(p)}
                              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Telegram ID засах"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openLinkDialog(p)}
                            className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Link className="w-3 h-3" />
                            Холбох
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[12px]">
                        {new Date(p.created_at).toLocaleDateString("mn-MN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination}
          </div>
        </>
      )}

      {/* ── Link Telegram dialog ── */}
      <Dialog open={!!linkPatient} onOpenChange={(open) => !open && setLinkPatient(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Telegram холбох</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <p className="text-[13px] text-slate-600">
              <span className="font-medium">{linkPatient?.full_name}</span>-ын Telegram Chat ID оруулна уу.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-[12px] text-slate-600 space-y-1">
              <p className="font-medium text-slate-700">Chat ID олох арга:</p>
              <p>1. Өвчтөн <span className="font-mono bg-white px-1 rounded border border-slate-200">@userinfobot</span>-д мессеж явуулна</p>
              <p>2. Bot буцааж явуулсан <span className="font-mono">Id:</span> тоог хуулна</p>
              <p className="text-slate-400">Эсвэл өвчтөн bot-д <span className="font-mono bg-white px-1 rounded border border-slate-200">/link {linkPatient?.phone_number}</span> явуулснаар автоматаар холбогдоно</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                Telegram Chat ID (тоо)
              </label>
              <input
                type="text"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                placeholder="Жишээ: 123456789"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setLinkPatient(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Цуцлах
            </button>
            <button
              onClick={handleLinkSave}
              disabled={linking}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              {linking && <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {linking ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
