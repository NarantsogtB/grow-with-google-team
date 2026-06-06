"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Building2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  HospitalResponse,
  HospitalCreate,
  PaginatedResponse,
  HealthcareLevelEnum,
} from "@/types";

const LEVEL_LABELS: Record<HealthcareLevelEnum, string> = {
  PRIMARY: "Primary",
  SECONDARY: "Secondary",
  TERTIARY: "Tertiary",
};

const LEVEL_BADGE: Record<HealthcareLevelEnum, "primary" | "secondary" | "tertiary"> = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
};

const EMPTY_FORM: HospitalCreate = {
  hospital_name: "",
  hospital_phone: "",
  address: "",
  level: "PRIMARY",
};

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HospitalResponse | null>(null);
  const [form, setForm] = useState<HospitalCreate>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchHospitals = async () => {
    try {
      const data = await api.get<PaginatedResponse<HospitalResponse>>("/api/v1/hospitals/");
      setHospitals(data.items);
    } catch {
      // backend offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
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
        toast.success("Hospital updated");
      } else {
        await api.post<HospitalResponse>("/api/v1/hospitals/", form);
        toast.success("Hospital created");
      }
      setDialogOpen(false);
      fetchHospitals();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof HospitalCreate, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospitals</h1>
          <p className="text-sm text-slate-500 mt-0.5">{hospitals.length} registered facilities</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Hospital
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Name", "Phone", "Address", "Level", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-4 h-4 rounded shrink-0" />
                      <Skeleton className="h-3.5 w-36" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="w-7 h-7 rounded-md" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-6 text-center">
            <Building2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-600">Бүртгэлтэй эмнэлэг алга</p>
            <p className="text-xs mt-2 text-slate-500 max-w-sm">
              Дээрх <b>Эмнэлэг нэмэх</b> товчоор шинэ эмнэлэг үүсгэнэ үү. Үүний дараа эмч нар тэр эмнэлэгт харьяалагдаж бүртгүүлэх боломжтой болно.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Name", "Phone", "Address", "Level", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{h.hospital_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{h.hospital_phone}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                    <span className="truncate block text-[12px]">{h.address}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={LEVEL_BADGE[h.level]} label={LEVEL_LABELS[h.level]} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={h.is_active ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(h)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900">
                {editing ? "Edit Hospital" : "Add Hospital"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Hospital Name *</label>
                <input
                  required
                  value={form.hospital_name}
                  onChange={(e) => field("hospital_name", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Phone *</label>
                <input
                  required
                  value={form.hospital_phone}
                  onChange={(e) => field("hospital_phone", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Address *</label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => field("address", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Level *</label>
                <select
                  value={form.level}
                  onChange={(e) => field("level", e.target.value as HealthcareLevelEnum)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="TERTIARY">Tertiary</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
