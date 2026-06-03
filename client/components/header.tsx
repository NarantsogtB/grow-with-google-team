"use client";

import { useAuth } from "../app/auth-context";

export function Header() {
  const { userName, userAddress, logout } = useAuth();

  return (
    <div className="w-full flex justify-between items-center bg-white/40 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-white/30 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-[#1e5d48] text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base">
          D
        </div>
        <h1 className="font-bold text-[15px] text-[#1e293b]">
          DVA <span className="text-[#94a3b8] font-normal">· Эргэлтийн туслах</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-4 text-right">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[12px] font-medium text-[#64748b]">Real-time холбогдсон</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[12px]">
              {/*  Жинхэнэ нэврэх нэрийг харуулах хэсэг */}
              <div className="font-semibold text-gray-800">{userName || 'Хэрэглэгч'}</div>
              <p className="text-[#94a3b8] text-[10px] max-w-[150px] truncate" title={userAddress || ''}>
                {userAddress || 'Хаяг бүртгэгдээгүй'}
              </p>
            </div>
            {/* Нэрнийх нь сүүлчийн үгнээс эхний 2 үсгийг авч харуулах аватар */}
            <div className="bg-[#1e5d48]/10 text-[#1e5d48] w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border border-white shadow-sm">
              {userName ? userName.split(' ').pop()?.substring(0, 2) : 'U'}
            </div>
          </div>

          {/* Системээс гарах товчлуур */}
          <button 
            onClick={logout}
            className="rounded-xl bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors border border-red-200/50"
          >
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}