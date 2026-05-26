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
  return (
    <div className="bg-white/80 backdrop-blur-md h-full flex flex-col flex-1">
      {/* Жагсаалтын толгой хэсэг */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
        <h3 className="font-black text-[13px] text-[#475569] uppercase tracking-wider">
          Өнөөдрийн жагсаалт
        </h3>
        <span className="text-xs font-bold text-[#64748b] bg-slate-100 px-2.5 py-1 rounded-full">
          {patients.length} айл
        </span>
      </div>

      {/* Өвчтөнүүдийн жагсаалт урсдаг хэсэг */}
      <div className="divide-y divide-slate-100/60 overflow-y-auto flex-1 max-h-[420px]">
        {patients.map((patient, index) => {
          const isActive = selectedPatient?.id === patient.id;

          // Профайл дээр харагдах өнгөнүүд
          const statusColors: { [key: number]: string } = {
            1: "bg-red-500",    // Д. Мөнхбат - Улаан
            2: "bg-teal-500",   // Ц. Оюунчимэг - Ногоон
            3: "bg-slate-400",  // Б. Дорж - Саарал
            4: "bg-teal-500",
            5: "bg-orange-500",
            6: "bg-teal-500",
            7: "bg-teal-500",
            8: "bg-slate-400"
          };

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className={`relative pl-8 pr-5 py-4 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-[#e2f0ec]/70" // Идэвхтэй үед зөөлөн ногоон туяатай дэвсгэр
                  : "hover:bg-slate-50/60 bg-white/10"
              }`}
            >
              {/* Идэвхтэй үед зүүн талд харагдах Босоо Ногоон Зураас */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#1e5d48] rounded-r-md" />
              )}

              <div className="flex items-center gap-4">
                {/* Мөрийн дугаар */}
                <span className="text-[13px] text-[#94a3b8] font-bold w-4 text-center">
                  {index + 1}
                </span>
                
                {/* Өвчтөний мэдээлэл */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[patient.id] || "bg-slate-400"}`} />
                    <p className="font-black text-[14px] text-[#1e293b] tracking-tight">
                      {patient.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5 font-medium leading-tight">
                    {patient.address}
                  </p>
                </div>
              </div>

              {/* Очих цаг */}
              <span className="text-xs font-bold text-[#64748b] tracking-tight shrink-0">
                {patient.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}