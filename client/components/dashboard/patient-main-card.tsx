"use client";

import { Patient } from "@/hooks/use-patients";

interface PatientMainCardProps {
  selectedPatient: Patient | null;
  onStartConsultation: () => void;
}

export function PatientMainCard({ selectedPatient, onStartConsultation }: PatientMainCardProps) {
  if (!selectedPatient) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] border-2 border-white/50 shadow-sm flex items-center justify-center min-h-[480px] w-full text-center">
        <p className="text-[#94a3b8] font-medium text-sm">Өвчтөн сонгоно уу</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] border-2 border-white/50 shadow-sm flex flex-col justify-between min-h-[480px] w-full flex-1">
      <div>
        {/* Профайл Толгой */}
        <div className="flex gap-4 items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#0d523b] text-white flex items-center justify-center font-black text-sm shadow-inner shrink-0">
            {selectedPatient.name.split(" ").pop()?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-black text-lg text-[#1e293b] leading-tight">{selectedPatient.name}</h4>
            <p className="text-[11px] text-[#94a3b8] mt-1 font-medium">{selectedPatient.age} нас · {selectedPatient.address}</p>
          </div>
        </div>

        {/* Triage болон Очих цаг */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50/60 border border-white/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-1">Triage</span>
            <p className="text-xl font-black text-[#14b8a6]">{selectedPatient.triageScore}<span className="text-xs font-bold text-[#94a3b8] ml-0.5">/10</span></p>
          </div>
          <div className="bg-slate-50/60 border border-white/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-1">Очих цаг</span>
            <p className="text-xl font-black text-[#1e293b]">{selectedPatient.time}</p>
          </div>
        </div>

        {/* Урьдчилсан асуумж */}
        <div className="mt-2">
          <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-2">Урьдчилсан асуумж</span>
          <div className="bg-slate-50/60 border border-white/40 p-4 rounded-2xl text-[13px] font-medium text-[#475569] leading-relaxed">
            {selectedPatient.preliminaryNote}
          </div>
        </div>
      </div>

      {/* Үзлэг эхлүүлэх товчлуур */}
      <button 
        onClick={onStartConsultation}
        className="w-full bg-[#1e5d48] hover:bg-[#164737] text-white py-4 rounded-2xl font-black text-[15px] shadow-md transition-all mt-6"
      >
        Үзлэг эхлүүлэх
      </button>
    </div>
  );
}