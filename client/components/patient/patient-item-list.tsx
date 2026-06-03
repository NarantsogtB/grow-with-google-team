"use client";

import { Patient } from "@/hooks/use-patients";

interface PatientItemListProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
}

export function PatientItemList({
  patients,
  selectedPatient,
  onSelectPatient,
}: PatientItemListProps) {
  
  // Төлөвөөс хамаарч өнгийг динамикаар оноох шидэт функц
  const getStatusStyles = (status: Patient["status"]) => {
    switch (status) {
      case "urgent": return "bg-red-50 text-red-700 border-red-200/60";
      case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "completed": return "bg-slate-50 text-slate-500 border-slate-200/60";
      default: return "bg-amber-50 text-amber-700 border-amber-200/60";
    }
  };

  const getStatusLabel = (status: Patient["status"]) => {
    switch (status) {
      case "urgent": return "Яаралтай";
      case "active": return "Үзэж буй";
      case "completed": return "Үзсэн";
      default: return "Хүлээж буй";
    }
  };

  return (
    <div className="bg-white flex flex-col h-full rounded-[32px] overflow-hidden">
      {/* Толгой хэсэг */}
      <div className="p-6 border-b border-slate-100/80">
        <h3 className="font-black text-lg text-slate-800">Өнөөдрийн жагсаалт</h3>
        <p className="text-xs font-medium text-slate-400 mt-0.5">Нийт {patients.length} өвчтөн байна</p>
      </div>

      {/* max-h-[360px] болгож өөрчилснөөр яг 4 хүн дэлгэц дээр бүтэн харагдах ба 5 дахь хүнээс scroll хийнэ */}
      <div className="divide-y divide-slate-100/60 overflow-y-auto flex-1 max-h-[360px] pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {patients.map((patient, index) => {
          const isActive = selectedPatient?.id === patient.id;
          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className={`p-5 flex items-center justify-between cursor-pointer transition-all ${
                isActive ? "bg-slate-50/80 font-bold" : "hover:bg-slate-50/40"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-slate-300 w-5">
                  #{index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">{patient.name}</h4>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {patient.age} настай · {patient.time} ({patient.distance})
                  </p>
                </div>
              </div>

              {/* Зөв тодорхойлогдсон 4 төлөвийн статус */}
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyles(patient.status)}`}>
                {getStatusLabel(patient.status)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}