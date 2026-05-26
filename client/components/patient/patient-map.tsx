"use client";

import { Patient } from "@/hooks/use-patients";

interface PatientMapProps {
  patients: Patient[];
  selectedPatient: Patient | null;
}

export function PatientMap({ patients, selectedPatient }: PatientMapProps) {
  return (
    <div className="rounded-[32px] p-6 shadow-sm border-2 border-white/50 flex flex-col h-[480px] bg-white/80 backdrop-blur-md relative overflow-hidden w-full">
      
      <div className="absolute top-6 left-6 z-10 flex gap-2">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-[11px] font-bold text-[#1e293b] border border-white/50 shadow-sm">
          Зам <span className="text-[#64748b] ml-1">· 18.4 км</span>
        </div>
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-[11px] font-bold text-[#1e293b] border border-white/50 shadow-sm">
          Цаг <span className="text-[#64748b] ml-1">· ~3h 20m</span>
        </div>
      </div>

      {/* Мок Газрын зургийн арын тор (Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>
      
      {/* Маршрутын шугам ба цэгүүд */}
      <div className="relative w-full h-full flex items-center justify-center">
        <svg className="absolute w-full h-full p-12" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 20 50 Q 40 60, 50 55 T 80 70" fill="none" stroke="#1e5d48" strokeWidth="1" strokeDasharray="3,3" />
        </svg>

        {/* Цэг 1 (Яаралтай - Д. Мөнхбат) */}
        <div className={`absolute transition-all duration-300 rounded-full w-9 h-9 flex items-center justify-center font-bold text-xs border-4 shadow-md left-[20%] top-[45%] ${
          selectedPatient?.id === 1 ? 'bg-[#ef4444] text-white border-white ring-4 ring-[#ef4444]/20 scale-110' : 'bg-[#ef4444] text-white border-white'
        }`}>1</div>

        {/* Цэг 2 (Ц. Оюунчимэг) */}
        <div className={`absolute transition-all duration-300 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs border-2 shadow-md left-[45%] top-[56%] ${
          selectedPatient?.id === 2 ? 'bg-[#1e5d48] text-white border-white ring-4 ring-[#1e5d48]/20 scale-110' : 'bg-white text-[#1e5d48] border-[#1e5d48]'
        }`}>2</div>

        {/* Цэг 3 (Б. Дорж) */}
        <div className={`absolute transition-all duration-300 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs border-2 shadow-md left-[62%] top-[50%] ${
          selectedPatient?.id === 3 ? 'bg-[#1e5d48] text-white border-white ring-4 ring-[#1e5d48]/20 scale-110' : 'bg-slate-300 text-slate-600 border-white'
        }`}>3</div>
      </div>
    </div>
  );
}