"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  MessageCircle,
  Building2,
  Pencil,
  CalendarX,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  profileUpdateSchema,
  type ProfileUpdateFormValues,
} from "@/schemas/profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PatientResponse } from "@/types";

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-[14px] text-slate-800 font-medium truncate">
          {value || <span className="text-slate-400 font-normal italic">Оруулаагүй</span>}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { session, updatePatient } = useAuth();
  const [profile, setProfile] = useState<PatientResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
  });

  // Load profile on mount
  useEffect(() => {
    api
      .get<PatientResponse>("/api/v1/patients/me")
      .then((data) => {
        setProfile(data);
        updatePatient(data);
      })
      .catch(() => toast.error("Профайл ачааллахад алдаа гарлаа"))
      .finally(() => setProfileLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = () => {
    reset({
      full_name: profile?.full_name ?? "",
      address_text: profile?.address_text ?? "",
    });
    setEditOpen(true);
  };

  const onSave = async (values: ProfileUpdateFormValues) => {
    try {
      const updated = await api.put<PatientResponse>("/api/v1/patients/me", {
        full_name: values.full_name || undefined,
        address_text: values.address_text || undefined,
      });
      setProfile(updated);
      updatePatient(updated);
      setEditOpen(false);
      toast.success("Мэдээлэл амжилттай хадгалагдлаа");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Хадгалахад алдаа гарлаа",
      );
    }
  };

  const displayName = profile?.full_name ?? session?.full_name ?? "...";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold text-slate-900">Миний бүртгэл</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Өрхийн эмнэлэгт бүртгэлтэй хэрэглэгчийн мэдээлэл
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Profile card ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header stripe */}
            <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-500" />

            {/* Avatar + action */}
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-5">
                <div className="w-16 h-16 bg-white rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-blue-600 font-bold text-xl ring-2 ring-blue-100">
                  {initials}
                </div>
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Засах
                </button>
              </div>

              {profileLoading ? (
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-2.5 w-20" />
                        <Skeleton className="h-4 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <h2 className="text-[17px] font-bold text-slate-900 mb-0.5">
                    {profile?.full_name}
                  </h2>
                  <p className="text-[13px] text-slate-500 mb-4">
                    Бүртгэлийн огноо:{" "}
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("mn-MN")
                      : "—"}
                  </p>

                  <div className="divide-y divide-slate-100">
                    <ProfileField
                      icon={Phone}
                      label="Утасны дугаар"
                      value={profile?.phone_number}
                    />
                    <ProfileField
                      icon={MapPin}
                      label="Хаяг"
                      value={profile?.address_text}
                    />
                    <ProfileField
                      icon={Building2}
                      label="Харьяа өрхийн эмнэлэг"
                      value={session?.hospital_name ?? "—"}
                    />
                    <div className="flex items-start gap-3 py-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                          Telegram
                        </p>
                        {profile?.telegram_chat_id ? (
                          <p className="text-[14px] text-emerald-600 font-medium">✅ Холбогдсон</p>
                        ) : (
                          <div className="text-[12px] text-slate-500 space-y-0.5">
                            <p>Холбогдоогүй. Bot-д дараах командыг явуулна уу:</p>
                            <code className="block bg-slate-100 rounded px-2 py-0.5 text-slate-700 font-mono text-[11px]">
                              /link {profile?.phone_number ?? "<утасны дугаар>"}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick info card ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[13px] font-semibold text-slate-700">
                Статус
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Идэвхтэй
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mt-2">
              Таны мэдээлэл эмчид харагдаж байна
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span className="text-[13px] font-semibold text-blue-800">
                Мэдэгдэл
              </span>
            </div>
            <p className="text-[12px] text-blue-700 leading-relaxed">
              Эмч таны хаяг руу ирэхийн өмнө Telegram-аар урьдчилсан мэдэгдэл
              илгээх болно.
            </p>
          </div>
        </div>
      </div>

      {/* ── Visit history ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[15px] font-bold text-slate-900">Үзлэгийн түүх</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <CalendarX className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-[14px] font-medium text-slate-600">
              Үзлэгийн түүх байхгүй байна
            </p>
            <p className="text-[13px] text-slate-400 mt-1">
              Эмч таны хаяг руу айлчлалт хийснийхээ дараа энд харагдана
            </p>
          </div>
        </div>
      </div>

      {/* ── Edit profile dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Мэдээлэл засах</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4 mt-2">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Овог, нэр
              </label>
              <input
                type="text"
                {...register("full_name")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {errors.full_name && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Хаяг
              </label>
              <textarea
                rows={3}
                {...register("address_text")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
              {errors.address_text && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.address_text.message}
                </p>
              )}
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {isSubmitting ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
