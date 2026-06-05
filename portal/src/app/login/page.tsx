"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { useAuth } from "@/contexts/auth-context";
import type { PatientLoginResponse } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await api.post<PatientLoginResponse>(
        "/api/v1/patients/login",
        {
          phone_number: values.phone_number,
          password: values.password,
        },
      );
      login(data.access_token, {
        patient_id: data.patient_id,
        full_name: data.full_name,
        address_text: data.address_text,
      });
      toast.success("Амжилттай нэвтэрлээ");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Нэвтрэхэд алдаа гарлаа",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Нэвтрэх</h1>
          <p className="text-sm text-slate-500 mb-6">
            Утасны дугаар болон нууц үгээ оруулна уу
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Утасны дугаар
              </label>
              <input
                type="tel"
                placeholder="99112233"
                {...register("phone_number")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {errors.phone_number && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.phone_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Нууц үг
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {errors.password && (
                <p className="text-[12px] text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg py-2.5 transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>

            <p className="text-center text-[13px] text-slate-500 mt-2">
              Бүртгэл байхгүй юу?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                Бүртгүүлэх
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
