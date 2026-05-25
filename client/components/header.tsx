"use client";

export function Header() {
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
        <div className="flex items-center gap-3">
          <div className="text-[12px]">
            <p className="font-bold text-[#1e293b]">Б. Энхтуяа</p>
            <p className="text-[#94a3b8] text-[10px]">ӨЭМТ #4 · Хан-Уул</p>
          </div>
          <div className="bg-[#e2e8f0] text-[#475569] w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border border-white">
            БЭ
          </div>
        </div>
      </div>
    </div>
  );
}