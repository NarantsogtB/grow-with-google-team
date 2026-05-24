"use client";

interface StatsCardProps {
  totalPatients: number;
}

export function StatsCard({ totalPatients }: StatsCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 sm:p-10 rounded-[32px] border-2 border-white/50 flex flex-col justify-center flex-1 min-h-[220px]">
      <p className="text-[#94a3b8] text-[12px] font-bold uppercase tracking-wider mb-1">
        2026.05.10 · БЯМБА
      </p>
      
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl sm:text-[90px] font-black leading-none tracking-tighter text-[#1e293b]">
            {totalPatients}
          </span>
          <span className="text-xl font-bold text-[#1e293b]">айл</span>
        </div>
        <p className="sm:ml-6 text-[#64748b] text-sm sm:text-base font-medium leading-relaxed">
          5 баталсан · 2 хүлээгдэж · 1 урьдчилсан яаралтай
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full mt-auto">
        
        {/* Зүүн тал: Хоёр товчлуур */}
        <div className="flex items-center gap-3">
          <button className="bg-[#1e5d48] hover:bg-[#164737] text-white px-6 py-3.5 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md transition-all">
            🗺 Маршрут оновчлох
          </button>
          <button className="bg-white hover:bg-slate-50 text-[#1e293b] px-6 py-3.5 rounded-xl font-bold text-[14px] flex items-center gap-1 border border-slate-200 shadow-sm transition-all">
            <span className="text-lg leading-none">+</span> Шинэ үзлэг
          </button>
        </div>

        {/* Баруун тал: Сүүлд оновчилсон цаг */}
        <span className="text-[12px] text-[#94a3b8] font-medium pb-1">
          сүүлд оновчилсон 08:42
        </span>

      </div>
    </div>
  );
}