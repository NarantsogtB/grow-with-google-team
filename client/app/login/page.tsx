'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { loginSuccess } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/patients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Нэвтрэхэд алдаа гарлаа');
      }

      // ХУУЧИН localStorage.setItem-үүдийг устгаад, 
      // манай шинэ loginSuccess-ийг дуудаж байна!
      // Энэ нь стейтийг тэр дороо шинэчилж, хуудсыг автоматаар шилжүүлнэ.
      loginSuccess(data.access_token, data.full_name, data.address_text);

    } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Алдаа гарлаа");
        }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef4f0] p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-white/60">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a5342] text-white font-bold text-lg mb-3 shadow-sm">
            DVA
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Системд нэвтрэх</h2>
          <p className="text-sm text-gray-500 mt-1">Үргэлжлүүлэхийн тулд нэвтэрнэ үү</p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50/80 border border-red-100 p-3 rounded-xl">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Утасны дугаар</label>
            <input
              type="text"
              required
              placeholder="Дугаараа оруулна уу"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Нууц үг</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1a5342] p-3 text-white font-medium rounded-xl hover:bg-[#134e4a] transition-colors shadow-sm mt-2 text-sm cursor-pointer"
          >
            Нэвтрэх
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Бүртгэл байхгүй юу?{' '}
          <span onClick={() => router.push('/register')} className="text-[#1a5342] font-semibold cursor-pointer hover:underline">
            Бүртгүүлэх
          </span>
        </p>
      </div>
    </div>
  );
}