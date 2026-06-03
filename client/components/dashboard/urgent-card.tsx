"use client";

import { useState } from "react";

interface UrgentPatient {
  id: string;
  name: string;
  age: number;
  description: string;
  phone?: string;
}

interface UrgentCardProps {
  urgentPatients: UrgentPatient[];
  onMoveToTop: (id: string) => void;
}

export function UrgentCard({
  urgentPatients = [],
  onMoveToTop,
}: UrgentCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (urgentPatients.length === 0) {
    return (
      <div className="bg-[#fdf2f2]/90 backdrop-blur-md p-6 rounded-[32px] border-2 border-red-200/60 shadow-sm flex items-center justify-center min-h-[280px] w-full">
        <p className="text-slate-400 text-sm font-medium">Яаралтай дуудлага байхгүй</p>
      </div>
    );
  }

  const currentPatient = urgentPatients[currentIndex];
  const phone = currentPatient.phone || "99112235";

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? urgentPatients.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === urgentPatients.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-[#fdf2f2]/90 backdrop-blur-md p-6 rounded-[32px] border-2 border-red-200/60 shadow-sm flex flex-col justify-between min-h-[280px] w-full relative group">
      
      {urgentPatients.length > 1 && (
        <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
          <button 
            onClick={handlePrev}
            className="w-7 h-7 rounded-lg bg-white border border-red-200/60 flex items-center justify-center text-red-600 hover:bg-red-50 text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            &larr;
          </button>
          <span className="text-[11px] font-bold text-red-500 bg-red-100/50 px-2 py-0.5 rounded-md min-w-[35px] text-center">
            {currentIndex + 1} / {urgentPatients.length}
          </span>
          <button 
            onClick={handleNext}
            className="w-7 h-7 rounded-lg bg-white border border-red-200/60 flex items-center justify-center text-red-600 hover:bg-red-50 text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            &rarr;
          </button>
        </div>
      )}

      <div className="pr-24">
        <p className="text-[#ef4444] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping"></span> · ЯАРАЛТАЙ
        </p>
        <h3 className="font-black text-xl text-[#1e293b] truncate">
          {currentPatient.name}, {currentPatient.age}
        </h3>
        <p className="text-[12px] text-[#64748b] font-medium leading-relaxed mt-2 line-clamp-4 min-h-[72px]">
          {currentPatient.description}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button 
          onClick={() => onMoveToTop(currentPatient.id)}
          className="bg-[#b91c1c] hover:bg-[#991b1b] text-white py-3 rounded-xl font-bold text-[13px] shadow-sm transition-all cursor-pointer"
        >
          Эхэнд оруулах
        </button>
        
        <a 
          href={`tel:${phone}`}
          className="bg-white hover:bg-slate-50 text-[#1e293b] py-3 rounded-xl font-bold text-[13px] border border-slate-200 shadow-sm transition-all text-center flex items-center justify-center cursor-pointer"
        >
          Утсаар холбогдох
        </a>
      </div>
    </div>
  );
}