'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address_text: '',
    password: '',
    telegram_chat_id: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/patients/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          address_text: formData.address_text,
          password: formData.password,
          telegram_chat_id: formData.telegram_chat_id || null,
          latitude: null,
          longitude: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Бүртгэл амжилтгүй боллоо');
      }

      router.push('/login');
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
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1a5342]/10 text-[#1a5342] font-bold text-xl mb-2">
            +
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Шинэ бүртгэл үүсгэх</h2>
          <p className="text-sm text-gray-500 mt-1">Family Medical системд тавтай морилно уу</p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50/80 border border-red-100 p-3 rounded-xl">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Бүтэн нэр</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Утасны дугаар</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Гэрийн хаяг</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={formData.address_text}
              onChange={(e) => setFormData({ ...formData, address_text: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Telegram Chat ID (Заавал биш)</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={formData.telegram_chat_id}
              onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 ml-1">Нууц үг</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:border-[#1a5342] focus:bg-white focus:outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1a5342] p-3 text-white font-medium rounded-xl hover:bg-[#134e4a] transition-colors shadow-sm mt-2 text-sm"
          >
            Бүртгүүлэх
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Өмнө нь бүртгүүлсэн үү?{' '}
          <span onClick={() => router.push('/login')} className="text-[#1a5342] font-semibold cursor-pointer hover:underline">
            Нэвтрэх
          </span>
        </p>
      </div>
    </div>
  );
}