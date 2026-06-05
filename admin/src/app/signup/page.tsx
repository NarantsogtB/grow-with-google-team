"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import type { DoctorCreate, DoctorResponse, GenderEnum } from "@/types";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<GenderEnum>("MALE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sector, setSector] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна");
      return;
    }
    if (sector.length !== 2) {
      setError("Хэсгийг 2 оронтой бичнэ үү (жишээ: 01, 14)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload: DoctorCreate = {
        first_name: firstName,
        last_name: lastName,
        gender,
        phone,
        email,
        role: "GENERAL",
        assigned_sector: sector,
        password,
      };
      await api.post<DoctorResponse>("/api/v1/doctors/", payload);
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Бүртгэлд алдаа гарлаа");
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
            Бүртгэл үүсгэх
          </h1>
          <p className="text-sm text-slate-500 mb-6">Эмчийн бүртгэл үүсгэх</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Нэр
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Мөнхбат"
                  required
                  minLength={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Овог
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Дорж"
                  required
                  minLength={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Хүйс
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`rounded-lg py-2 text-sm font-medium transition-colors border ${
                    gender === "MALE"
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Эрэгтэй
                </button>
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`rounded-lg py-2 text-sm font-medium transition-colors border ${
                    gender === "FEMALE"
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Эмэгтэй
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Утас
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="99001100"
                  required
                  minLength={8}
                  maxLength={15}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Хэсэг
                </label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="14"
                  required
                  maxLength={2}
                  pattern="[0-9]{2}"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

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
                minLength={8}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Нууц үг давтах
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError("");
                }}
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
              {loading ? "Бүртгэж байна..." : "Бүртгэл үүсгэх"}
            </button>

            <p className="text-center text-[13px] text-slate-500 mt-2">
              Бүртгэлтэй юу?{" "}
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
          FamilyDoc-AI Админ · Улаанбаатар, МН
        </p>
      </div>
    </div>
  );
}
