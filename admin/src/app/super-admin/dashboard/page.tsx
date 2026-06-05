"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DoctorResponse,
  DoctorRoleEnum,
  DoctorUpdateResponse,
  HealthcareLevelEnum,
  HospitalCreate,
  HospitalResponse,
  PaginatedResponse,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<DoctorRoleEnum, string> = {
  GENERAL: "Ерөнхий эмч",
  PEDIATRICIAN: "Хүүхдийн эмч",
  NURSE: "Сувилагч",
};

const LEVEL_LABELS: Record<HealthcareLevelEnum, string> = {
  PRIMARY: "Өрхийн эмнэлэг",
  SECONDARY: "Дүүргийн эмнэлэг",
  TERTIARY: "Хотын эмнэлэг",
};

const LEVEL_BADGE: Record<
  HealthcareLevelEnum,
  "primary" | "secondary" | "tertiary"
> = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
};

const EMPTY_HOSPITAL: HospitalCreate = {
  hospital_name: "",
  hospital_phone: "",
  address: "",
  level: "PRIMARY",
};

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

// ── Toggle switch (no label) ──────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Confirm delete dialog ─────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  title,
  description,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
            <p className="text-[12px] text-slate-500 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            Цуцлах
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Устгаж байна..." : "Устгах"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hospitals tab ─────────────────────────────────────────────────────────────

function HospitalsTab() {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HospitalResponse | null>(null);
  const [form, setForm] = useState<HospitalCreate>(EMPTY_HOSPITAL);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHospitals = async () => {
    try {
      const data = await api.get<PaginatedResponse<HospitalResponse>>(
        "/api/v1/hospitals/?size=100",
      );
      setHospitals(data.items);
    } catch {
      // backend offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_HOSPITAL);
    setDialogOpen(true);
  };

  const openEdit = (h: HospitalResponse) => {
    setEditing(h);
    setForm({
      hospital_name: h.hospital_name,
      hospital_phone: h.hospital_phone,
      address: h.address,
      level: h.level,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/v1/hospitals/${editing.id}`, form);
        toast.success("Эмнэлэгийн мэдээлэл шинэчлэгдлээ");
      } else {
        await api.post<HospitalResponse>("/api/v1/hospitals/", form);
        toast.success("Эмнэлэг амжилттай бүртгэгдлээ");
      }
      setDialogOpen(false);
      fetchHospitals();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Хадгалахад алдаа гарлаа",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/hospitals/${id}`);
      setHospitals((prev) => prev.filter((h) => h.id !== id));
      toast.success("Эмнэлэг устгагдлаа");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Устгахад алдаа гарлаа",
      );
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const field = (key: keyof HospitalCreate, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const confirmHospital = hospitals.find((h) => h.id === confirmDeleteId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">
          {loading ? "Ачааллаж байна..." : `${hospitals.length} эмнэлэг бүртгэлтэй`}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          Эмнэлэг нэмэх
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["PRIMARY", "SECONDARY", "TERTIARY"] as HealthcareLevelEnum[]).map(
          (level) => (
            <div
              key={level}
              className="bg-white rounded-xl border border-slate-200 px-4 py-3"
            >
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                {LEVEL_LABELS[level]}
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {loading ? "—" : hospitals.filter((h) => h.level === level).length}
              </p>
            </div>
          ),
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Нэр", "Утас", "Хаяг", "Төрөл", "Статус", "Үйлдэл"].map(
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
              {[...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                      <Skeleton className="h-3.5 w-36" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3"><div className="flex gap-1.5"><Skeleton className="w-7 h-7 rounded-md" /><Skeleton className="w-7 h-7 rounded-md" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Эмнэлэг байхгүй байна</p>
            <p className="text-xs mt-1">Эмнэлэг нэмэх товчийг дарна уу</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {hospitals.map((h) => (
                <div key={h.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                        {h.hospital_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(h)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(h.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      variant={LEVEL_BADGE[h.level]}
                      label={LEVEL_LABELS[h.level]}
                    />
                    <StatusBadge
                      variant={h.is_active ? "active" : "inactive"}
                      label={h.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                    />
                  </div>
                  <p className="text-[12px] text-slate-500">
                    <Phone className="w-3 h-3 inline mr-1 text-slate-400" />
                    {h.hospital_phone}
                  </p>
                  <p className="text-[12px] text-slate-400 truncate">
                    📍 {h.address}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Нэр", "Утас", "Хаяг", "Төрөл", "Статус", "Үйлдэл"].map(
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
                  {hospitals.map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {h.hospital_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {h.hospital_phone}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                        <span className="truncate block text-[12px]">
                          {h.address}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          variant={LEVEL_BADGE[h.level]}
                          label={LEVEL_LABELS[h.level]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          variant={h.is_active ? "active" : "inactive"}
                          label={h.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(h)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Засах"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(h.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900">
                {editing ? "Эмнэлэг засах" : "Эмнэлэг нэмэх"}
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {editing
                  ? "Эмнэлэгийн мэдээллийг шинэчлэх"
                  : "Шинэ эмнэлэгийн мэдээллийг оруулна уу"}
              </p>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Эмнэлэгийн нэр *
                </label>
                <input
                  required
                  value={form.hospital_name}
                  onChange={(e) => field("hospital_name", e.target.value)}
                  placeholder="Баянгол дүүрэг 1-р өрхийн эмнэлэг"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Утасны дугаар *
                </label>
                <input
                  required
                  value={form.hospital_phone}
                  onChange={(e) => field("hospital_phone", e.target.value)}
                  placeholder="99001122"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Хаяг *
                </label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => field("address", e.target.value)}
                  placeholder="Баянгол дүүрэг, 14-р хороо..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                  Эмнэлэгийн төрөл *
                </label>
                <select
                  value={form.level}
                  onChange={(e) =>
                    field("level", e.target.value as HealthcareLevelEnum)
                  }
                  className={inputClass}
                >
                  <option value="PRIMARY">Өрхийн эмнэлэг (PRIMARY)</option>
                  <option value="SECONDARY">
                    Дүүргийн эмнэлэг (SECONDARY)
                  </option>
                  <option value="TERTIARY">Хотын эмнэлэг (TERTIARY)</option>
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
                  {saving ? "Хадгалж байна..." : editing ? "Хадгалах" : "Бүртгэх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <ConfirmDeleteDialog
          title="Эмнэлэг устгах уу?"
          description={`"${confirmHospital?.hospital_name}" эмнэлэгийг бүрмөсөн устгах гэж байна. Энэ үйлдлийг буцаах боломжгүй.`}
          loading={deletingId === confirmDeleteId}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

// ── Doctors tab ───────────────────────────────────────────────────────────────

function DoctorsTab() {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PaginatedResponse<DoctorResponse>>("/api/v1/doctors/?size=100")
      .then((d) => setDoctors(d.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (doctor: DoctorResponse) => {
    setTogglingId(doctor.id);
    try {
      const res = await api.put<DoctorUpdateResponse>(
        `/api/v1/doctors/${doctor.id}`,
        { is_active: !doctor.is_active },
      );
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? res.data : d)),
      );
      toast.success(
        res.data.is_active ? "Эмч идэвхжлээ" : "Эмч идэвхгүй боллоо",
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Алдаа гарлаа");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/doctors/${id}`);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      toast.success("Эмч устгагдлаа");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Устгахад алдаа гарлаа",
      );
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const active = doctors.filter((d) => d.is_active).length;
  const inactive = doctors.filter((d) => !d.is_active).length;
  const confirmDoctor = doctors.find((d) => d.id === confirmDeleteId);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Нийт", value: doctors.length, color: "text-slate-800" },
          { label: "Идэвхтэй", value: active, color: "text-blue-600" },
          { label: "Идэвхгүй", value: inactive, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3"
          >
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Нэр", "Үүрэг", "Утас", "Сектор", "Идэвхтэй", ""].map(
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
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                      <Skeleton className="h-3.5 w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-9 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="w-7 h-7 rounded-md" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UserCog className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Эмч байхгүй байна</p>
            <p className="text-xs mt-1">Эмч нар /signup хуудсаар бүртгүүлнэ</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {doctors.map((d) => (
                <div key={d.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                      {d.first_name[0]}
                      {d.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800">
                        Эмч {d.first_name} {d.last_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ROLE_LABELS[d.role]} · Сектор {d.assigned_sector}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {d.phone}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Toggle
                      checked={d.is_active}
                      onChange={() => handleToggle(d)}
                      disabled={togglingId === d.id}
                    />
                    <button
                      onClick={() => setConfirmDeleteId(d.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Нэр", "Үүрэг", "Утас", "Сектор", "Идэвхтэй", ""].map(
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
                        <Toggle
                          checked={d.is_active}
                          onChange={() => handleToggle(d)}
                          disabled={togglingId === d.id}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmDeleteId(d.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Устгах"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDeleteId && (
        <ConfirmDeleteDialog
          title="Эмч устгах уу?"
          description={`Эмч ${confirmDoctor?.first_name} ${confirmDoctor?.last_name}-г бүрмөсөн устгах гэж байна. Энэ үйлдлийг буцаах боломжгүй.`}
          loading={deletingId === confirmDeleteId}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const [tab, setTab] = useState<"hospitals" | "doctors">("hospitals");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4.5 h-4.5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(
          [
            ["hospitals", "Эмнэлэг"],
            ["doctors", "Эмч"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${
              tab === key
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "hospitals" ? <HospitalsTab /> : <DoctorsTab />}
    </div>
  );
}
