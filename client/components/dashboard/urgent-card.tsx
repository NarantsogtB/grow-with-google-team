"use client";

export function UrgentCard() {
  return (
    <div className="bg-[#fdf2f2]/90 backdrop-blur-md p-6 rounded-[32px] border-2 border-red-200/60 shadow-sm flex flex-col justify-between min-h-[280px] w-full">
      <div>
        <p className="text-[#ef4444] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping"></span> · ЯАРАЛТАЙ
        </p>
        <h3 className="font-black text-xl text-[#1e293b]">Д. Мөнхбат, 67</h3>
        <p className="text-[12px] text-[#64748b] font-medium leading-relaxed mt-2">
          Цусны даралт 165/100 · толгой эргэх. Triage score 8/10.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button className="bg-[#b91c1c] hover:bg-[#991b1b] text-white py-3 rounded-xl font-bold text-[13px] shadow-sm transition-all">
          Эхэнд оруулах
        </button>
        <button className="bg-white hover:bg-slate-50 text-[#1e293b] py-3 rounded-xl font-bold text-[13px] border border-slate-200 shadow-sm transition-all">
          Утсаар холбогдох
        </button>
      </div>
    </div>
  );
}