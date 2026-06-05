"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DoctorResponse,
  DoctorRoleEnum,
  DoctorUpdate,
  DoctorUpdateResponse,
  GenderEnum,
  HospitalResponse,
  PaginatedResponse,
} from "@/types";

const ROLE_LABELS: Record<DoctorRoleEnum, string> = {
  GENERAL: "Ерөнхий эмч",
  PEDIATRICIAN: "Хүүхдийн эмч",
  NURSE: "Сувилагч",
};

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

export default function SettingsPage() {
  const [profile, setProfile] = useState<DoctorResponse | null>(null);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DoctorUpdate>({});

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_doctor_id")
        : null;
    if (!id) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.get<DoctorResponse>(`/api/v1/doctors/${id}`),
      api.get<PaginatedResponse<HospitalResponse>>(
        "/api/v1/hospitals/?size=100",
      ),
    ])
      .then(([d, h]) => {
        setProfile(d);
        setHospitals(h.items);
        setForm({
          first_name: d.first_name,
          last_name: d.last_name,
          phone: d.phone,
          email: d.email,
          gender: d.gender,
          telegram_id: d.telegram_id ?? "",
          role: d.role,
          assigned_sector: d.assigned_sector ?? "",
          hospital_id: d.hospital_id ?? null,
        });
      })
      .catch(() => toast.error("Профайл ачааллахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = localStorage.getItem("admin_doctor_id");
    if (!id) return;
    setSaving(true);
    try {
      const res = await api.put<DoctorUpdateResponse>(`/api/v1/doctors/${id}`, {
        ...form,
        telegram_id: form.telegram_id || null,
        hospital_id: form.hospital_id || null,
      });
      setProfile(res.data);
      const stored = localStorage.getItem("admin_doctor");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          "admin_doctor",
          JSON.stringify({
            ...parsed,
            first_name: res.data.first_name,
            last_name: res.data.last_name,
          }),
        );
      }
      toast.success("Профайл амжилттай шинэчлэгдлээ");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Хадгалахад алдаа гарлаа",
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "??";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Миний профайл</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Өөрийн мэдээллийг засах
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : !profile ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Профайл олдсонгүй</p>
          <p className="text-xs mt-1">Нэвтэрч орсон эсэхийг шалгана уу</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Profile header card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900">
                Эмч {profile.first_name} {profile.last_name}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {ROLE_LABELS[profile.role] ?? profile.role} · Сектор{" "}
                {profile.assigned_sector}
              </p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Үндсэн мэдээлэл
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Нэр *
                </label>
                <input
                  required
                  value={form.first_name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Овог *
                </label>
                <input
                  required
                  value={form.last_name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    Утас *
                  </span>
                </label>
                <input
                  required
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    Имэйл *
                  </span>
                </label>
                <input
                  required
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Хүйс
                </label>
                <select
                  value={form.gender ?? "MALE"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gender: e.target.value as GenderEnum,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="MALE">Эрэгтэй</option>
                  <option value="FEMALE">Эмэгтэй</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3" />
                    Telegram ID
                  </span>
                </label>
                <input
                  value={form.telegram_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telegram_id: e.target.value }))
                  }
                  placeholder="Заавал биш"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Үүрэг
                </label>
                <select
                  value={form.role ?? "GENERAL"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as DoctorRoleEnum,
                    }))
                  }
                  className={inputClass}
                >
                  {(
                    Object.entries(ROLE_LABELS) as [DoctorRoleEnum, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Сектор
                </label>
                <input
                  value={form.assigned_sector ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assigned_sector: e.target.value }))
                  }
                  placeholder="1-р сектор"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  Эмнэлэг
                </span>
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
                <option value="">— сонгохгүй —</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hospital_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Read-only admin fields */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Зөвхөн super-admin засна
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 w-fit">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                Статус
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  profile.is_active
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {profile.is_active ? "Идэвхтэй" : "Идэвхгүй"}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm rounded-xl py-3 transition-colors"
          >
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </form>
      )}
    </div>
  );
}
