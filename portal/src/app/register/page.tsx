"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  ChevronDown,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { useAuth } from "@/contexts/auth-context";
import type {
  HospitalResponse,
  PaginatedResponse,
  PatientLoginResponse,
  DoctorResponse,
} from "@/types";

const LEVEL_LABEL: Record<string, string> = {
  PRIMARY: "Өрхийн эмнэлэг",
  SECONDARY: "Дүүргийн эмнэлэг",
  TERTIARY: "Хотын эмнэлэг",
};

type GeoStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const selectedHospitalId = watch("hospital_id");

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    api
      .get<PaginatedResponse<HospitalResponse>>("/api/v1/hospitals/?size=100")
      .then((res) => setHospitals(res.items.filter((h) => h.is_active)))
      .catch(() => toast.error("Эмнэлэгийн жагсаалт ачааллахад алдаа гарлаа"))
      .finally(() => setHospitalsLoading(false));
  }, []);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      // Resolve sector from selected hospital's doctors
      let sector: string | undefined;
      try {
        const doctorsRes = await api.get<PaginatedResponse<DoctorResponse>>(
          "/api/v1/doctors/?size=100",
        );
        const doctor = doctorsRes.items.find(
          (d) => d.hospital_id === values.hospital_id && d.is_active,
        );
        sector = doctor?.assigned_sector;
      } catch {
        // sector is optional — proceed without it
      }

      const selectedHospital = hospitals.find(
        (h) => h.id === values.hospital_id,
      );

      // Register patient (include captured GPS coordinates if granted)
      await api.post("/api/v1/patients/", {
        full_name: values.full_name,
        phone_number: values.phone_number,
        password: values.password,
        address_text: values.address_text,
        sector,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      // Auto-login after registration
      const loginData = await api.post<PatientLoginResponse>(
        "/api/v1/patients/login",
        {
          phone_number: values.phone_number,
          password: values.password,
        },
      );

      login(loginData.access_token, {
        patient_id: loginData.patient_id,
        full_name: loginData.full_name,
        address_text: loginData.address_text,
        hospital_name: selectedHospital?.hospital_name,
      });

      toast.success("Амжилттай бүртгэгдлээ");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Бүртгэхэд алдаа гарлаа",
      );
    }
  };

  const inputClass =
    "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2v14M2 9h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            FamilyDoc
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Бүртгүүлэх</h1>
          <p className="text-sm text-slate-500 mb-6">
            Мэдээллээ бүрэн бөглөж, харьяа эмнэлэгээ сонгоно уу
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Овог, нэр
              </label>
              <input
                type="text"
                placeholder="Дорж Цэнд"
                {...register("full_name")}
                className={inputClass}
              />
              {errors.full_name && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Утасны дугаар
              </label>
              <input
                type="tel"
                placeholder="99112233"
                {...register("phone_number")}
                className={inputClass}
              />
              {errors.phone_number && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.phone_number.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Хаяг
              </label>
              <input
                type="text"
                placeholder="Баянгол дүүрэг, 14-р хороо..."
                {...register("address_text")}
                className={inputClass}
              />
              {errors.address_text && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.address_text.message}
                </p>
              )}
            </div>

            {/* Geolocation status — required for route optimization */}
            <GeoStatusPanel
              status={geoStatus}
              coords={coords}
              onRetry={requestLocation}
            />

            {/* Hospital */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Харьяа өрхийн эмнэлэг
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedHospitalId ?? ""}
                  onChange={(e) =>
                    setValue("hospital_id", e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  disabled={hospitalsLoading}
                  className="w-full appearance-none border border-slate-200 rounded-lg pl-9 pr-9 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white disabled:opacity-50"
                >
                  <option value="">
                    {hospitalsLoading ? "Ачааллаж байна..." : "Эмнэлэг сонгох"}
                  </option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hospital_name} — {LEVEL_LABEL[h.level] ?? h.level}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.hospital_id && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.hospital_id.message}
                </p>
              )}
            </div>

            {/* Telegram (optional — bot-link flow) */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-[12px] text-blue-700 space-y-1">
              <p className="font-medium">Telegram мэдэгдэл идэвхжүүлэх (заавал биш)</p>
              <p>Бүртгэлийн дараа{" "}
                <a href="https://t.me/familydoc_reminder_bot" target="_blank" rel="noreferrer" className="font-medium underline">@familydoc_reminder_bot</a>
                -д утасны дугаараа явуулна уу:</p>
              <code className="block bg-whi
              te rounded px-2 py-1 text-blue-800 font-mono">
                /link &lt;утасны дугаар&gt;
              </code>
              <p className="text-blue-500">Жишээ: /link 99112233</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Нууц үг
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={inputClass}
              />
              {errors.password && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Нууц үг давтах
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirm_password")}
                className={inputClass}
              />
              {errors.confirm_password && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg py-2.5 transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Бүртгэж байна..." : "Бүртгүүлэх"}
            </button>

            <p className="text-center text-[13px] text-slate-500 mt-2">
              Бүртгэл байна уу?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Нэвтрэх
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[12px] text-slate-400 mt-5">
          FamilyDoc · Улаанбаатар, MN
        </p>
      </div>
    </div>
  );
}

function GeoStatusPanel({
  status,
  coords,
  onRetry,
}: {
  status: GeoStatus;
  coords: { lat: number; lng: number } | null;
  onRetry: () => void;
}) {
  if (status === "granted" && coords) {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[12px] text-emerald-700 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">Гэрийн байршил баталгаажсан</p>
          <p className="text-emerald-600 font-mono text-[11px] mt-0.5">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
          <p className="text-emerald-600/70 mt-1">
            Эмчийн гэрийн зорчилтын маршрутад автоматаар орох болно.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-emerald-700 hover:text-emerald-900 p-1"
          aria-label="Шинэчлэх"
          title="Дахин тогтоох"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[12px] text-blue-700 flex items-center gap-2.5">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <p>Гэрийн байршлыг тогтоож байна...</p>
      </div>
    );
  }

  // denied / unavailable / idle
  const isUnsupported = status === "unavailable";
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-700 flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">
          {isUnsupported
            ? "Браузер геолокаци дэмжихгүй байна"
            : "Байршлын зөвшөөрөл өгөөгүй байна"}
        </p>
        <p className="text-amber-600/80 mt-0.5">
          {isUnsupported
            ? "Өөр браузер ашиглах эсвэл админд хандана уу."
            : "Эмчийн маршрутад орохын тулд байршил баталгаажуулах шаардлагатай. Браузерт зөвшөөрөл олгоод дахин оролдоно уу."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isUnsupported}
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-800 hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MapPin className="w-3.5 h-3.5" />
          Байршил дахин тогтоох
        </button>
      </div>
    </div>
  );
}
