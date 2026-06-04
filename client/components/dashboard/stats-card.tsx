"use client";

interface StatsCardProps {
  totalPatients: number;
  onNewConsultation: () => void;
  onOptimizeRoute: () => void;
  isRouteOptimized: boolean;
  lastOptimizedTime: string | null;
}

export function StatsCard({ totalPatients, onNewConsultation, onOptimizeRoute, isRouteOptimized, lastOptimizedTime }: StatsCardProps) {
  return (
    <div className="flex min-h-[220px] flex-1 flex-col justify-center rounded-[32px] border-2 border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-10">
      <p className="mb-1 text-[12px] font-bold uppercase tracking-wider text-[#94a3b8]">
        2026.05.10 · БЯМБА
      </p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-baseline">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-black leading-none tracking-tighter text-[#1e293b] sm:text-[90px]">
            {totalPatients}
          </span>
          <span className="text-xl font-bold text-[#1e293b]">айл</span>
        </div>
        <p className="text-sm font-medium leading-relaxed text-[#64748b] sm:ml-6 sm:text-base">
          5 баталсан · 2 хүлээгдэж · 1 урьдчилсан яаралтай
        </p>
      </div>

      <div className="mt-auto flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <button
            onClick={onOptimizeRoute}
            className={`flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-bold text-white shadow-md transition-all ${
              isRouteOptimized
                ? "bg-[#0d9488] hover:bg-[#0f766e]"
                : "bg-[#1e5d48] hover:bg-[#164737]"
            }`}
          >
            🗺 {isRouteOptimized ? "Маршрут оновчилсон ✓" : "Маршрут оновчлох"}
          </button>
          <button
            type="button"
            onClick={onNewConsultation}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[14px] font-bold text-[#1e293b] shadow-sm transition-all hover:bg-slate-50"
          >
            <span className="text-lg leading-none">+</span> Шинэ үзлэг
          </button>
        </div>

        <span className="pb-1 text-[12px] font-medium text-[#94a3b8]">
          сүүлд оновчилсон {lastOptimizedTime ?? "08:42"}
        </span>
      </div>
    </div>
  );
}
