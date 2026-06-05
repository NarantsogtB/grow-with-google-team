"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

const SUPER_PASSWORD =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD ?? "super123";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPER_PASSWORD) {
      localStorage.setItem("super_admin_auth", "1");
      router.push("/super-admin/dashboard");
    } else {
      setError("Нууц үг буруу байна");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <Lock className="w-4.5 h-4.5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-none">
                Super Admin
              </h1>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Эмнэлэг удирдах хэсэг
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Нууц үг
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                autoFocus
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
              />
              {error && (
                <p className="text-[12px] text-red-500 mt-1.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
            >
              Нэвтрэх
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-slate-400 mt-5">
          FamilyDoc-AI Super Admin · Системийн удирдлага
        </p>
      </div>
    </div>
  );
}
