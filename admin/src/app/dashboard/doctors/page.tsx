"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, UserCog, Phone } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DoctorResponse,
  DoctorCreate,
  DoctorUpdate,
  HospitalResponse,
  PaginatedResponse,
  GenderEnum,
  DoctorRoleEnum,
} from "@/types";

const ROLE_LABELS: Record<DoctorRoleEnum, string> = {
  GENERAL: "Ерөнхий эмч",
  PEDIATRICIAN: "Хүүхдийн эмч",
  NURSE: "Сувилагч",
};

const EMPTY_FORM: DoctorCreate = {
  first_name: "",
  last_name: "",
  gender: "MALE",
  phone: "",
  email: "",
  role: "GENERAL",
  assigned_sector: "",
  password: "",
  telegram_id: null,
  hospital_id: null,
};

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorResponse | null>(null);
  const [form, setForm] = useState<DoctorCreate>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchDoctors = async () => {
    try {
      const data =
        await api.get<PaginatedResponse<DoctorResponse>>("/api/v1/doctors/");
      setDoctors(data.items);
    } catch {
      // backend offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    api
      .get<PaginatedResponse<HospitalResponse>>("/api/v1/hospitals/")
      .then((d) => setHospitals(d.items))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };
  const openEdit = (d: DoctorResponse) => {
    setEditing(d);
    setForm({
      first_name: d.first_name,
      last_name: d.last_name,
      gender: d.gender,
      phone: d.phone,
      email: d.email,
      role: d.role,
      assigned_sector: d.assigned_sector,
      password: "",
      telegram_id: d.telegram_id,
      hospital_id: d.hospital_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/v1/doctors/${editing.id}`, form as DoctorUpdate);
        toast.success("Эмч амжилттай шинэчлэгдлээ");
      } else {
        await api.post<DoctorResponse>("/api/v1/doctors/", form);
        toast.success("Эмч амжилттай бүртгэгдлээ");
      }
      setDialogOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Хадгалахад алдаа гарлаа",
      );
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof DoctorCreate, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <UserCog className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm font-medium">Эмч байхгүй байна</p>
      <p className="text-xs mt-1">Эмч нэмэх эсвэл сервер эхлүүлэх</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Эмч нар</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {doctors.length} бүртгэлтэй эмч
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Эмч нэмэх
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <>
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Нэр", "Үүрэг", "Утас", "Сектор", "Статус", "Үйлдэл"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                          <Skeleton className="h-3.5 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-3.5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="w-7 h-7 rounded-md" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && doctors.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {emptyState}
        </div>
      )}

      {!loading && doctors.length > 0 && (
        <>
          {/* ── Mobile card list ── */}
          <div className="md:hidden space-y-3">
            {doctors.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                      {d.first_name[0]}
                      {d.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-800">
                        Эмч {d.first_name} {d.last_name}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {ROLE_LABELS[d.role]} · Сектор {d.assigned_sector}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(d)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {d.phone}
                  </div>
                  <StatusBadge variant={d.is_active ? "active" : "inactive"} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Нэр", "Үүрэг", "Утас", "Сектор", "Статус", "Үйлдэл"].map(
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
                  {doctors.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {d.first_name[0]}
                            {d.last_name[0]}
                          </div>
                          <span className="font-medium text-slate-800">
                            Эмч {d.first_name} {d.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {ROLE_LABELS[d.role]}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{d.phone}</td>
                      <td className="px-4 py-3 text-slate-600">
                        Сектор {d.assigned_sector}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          variant={d.is_active ? "active" : "inactive"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(d)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm md:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900">
                {editing ? "Эмч засах" : "Эмч нэмэх"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Нэр *
                  </label>
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => field("first_name", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Овог *
                  </label>
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => field("last_name", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Хүйс *
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      field("gender", e.target.value as GenderEnum)
                    }
                    className={inputClass}
                  >
                    <option value="MALE">Эрэгтэй</option>
                    <option value="FEMALE">Эмэгтэй</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Үүрэг *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      field("role", e.target.value as DoctorRoleEnum)
                    }
                    className={inputClass}
                  >
                    <option value="GENERAL">Ерөнхий эмч</option>
                    <option value="PEDIATRICIAN">Хүүхдийн эмч</option>
                    <option value="NURSE">Сувилагч</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Имэйл *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => field("email", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Утас *
                  </label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Сектор *
                  </label>
                  <input
                    required
                    maxLength={2}
                    value={form.assigned_sector}
                    onChange={(e) => field("assigned_sector", e.target.value)}
                    placeholder="жишээ нь 14"
                    className={inputClass}
                  />
                </div>
              </div>

              {!editing && (
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                    Нууц үг *
                  </label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => field("password", e.target.value)}
                    placeholder="Хамгийн багадаа 8 тэмдэгт"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Telegram ID
                </label>
                <input
                  value={form.telegram_id ?? ""}
                  onChange={(e) => field("telegram_id", e.target.value)}
                  placeholder="Заавал биш"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Эмнэлэг
                </label>
                <select
                  value={form.hospital_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hospital_id: e.target.value || null,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">— Байхгүй —</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hospital_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg py-2.5 transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
                >
                  {saving
                    ? "Хадгалж байна..."
                    : editing
                      ? "Хадгалах"
                      : "Бүртгэх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
