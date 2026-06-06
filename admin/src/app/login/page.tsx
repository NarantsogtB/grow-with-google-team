"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";

interface DoctorLoginResponse {
  access_token: string;
  token_type: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  role: string;
  assigned_sector: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<DoctorLoginResponse>(
        "/api/v1/doctors/login",
        {
          email,
          password,
        },
      );
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_doctor_id", data.doctor_id);
      localStorage.setItem(
        "admin_doctor",
        JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          assigned_sector: data.assigned_sector,
        }),
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
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
            FamilyDoc Admin
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            Тавтай морил
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Админ самбарт нэвтрэх
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Имэйл
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Нууц үг
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg py-2.5 transition-colors mt-2"
            >
              {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>

            <p className="text-center text-[13px] text-slate-500 mt-2">
              Бүртгэл байхгүй юу?{" "}
              <Link
                href="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Бүртгүүлэх
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[12px] text-slate-400 mt-5">
          FamilyDoc-AI Админ · Улаанбаатар, МН
        </p>
      </div>
    </div>
  );
}
