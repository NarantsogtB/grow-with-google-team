"use client";

import type { Patient } from "@/hooks/use-patients";

interface PatientMapProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  isRouteOptimized?: boolean;
}

const STATUS_STYLES = {
  urgent: { dot: "bg-red-500", badge: "bg-red-50 border-red-200 text-red-700", number: "bg-red-500" },
  active: { dot: "bg-emerald-500", badge: "bg-emerald-50 border-emerald-200 text-emerald-700", number: "bg-emerald-500" },
  pending: { dot: "bg-slate-400", badge: "bg-slate-50 border-slate-200 text-slate-600", number: "bg-slate-400" },
  completed: { dot: "bg-blue-400", badge: "bg-blue-50 border-blue-200 text-blue-700", number: "bg-blue-400" },
};

const STATUS_PRIORITY: Record<string, number> = { active: 0, urgent: 1, pending: 2, completed: 3 };

function sortByPriority(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const diff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    return diff !== 0 ? diff : b.triageScore - a.triageScore;
  });
}

function buildRouteUrl(patients: Patient[]): string {
  const sorted = sortByPriority(patients);
  const encode = (p: Patient) => encodeURIComponent(`${p.address}, Ulaanbaatar`);
  if (sorted.length === 1) {
    return `https://maps.google.com/maps?q=${encode(sorted[0])}&output=embed`;
  }
  const origin = encode(sorted[0]);
  const daddr = sorted.slice(1).map(encode).join("+to:");
  return `https://maps.google.com/maps?saddr=${origin}&daddr=${daddr}&output=embed`;
}

export function PatientMap({ patients, selectedPatient, isRouteOptimized = false }: PatientMapProps) {
  const sortedPatients = sortByPriority(patients);

  const mapQuery = encodeURIComponent(
    selectedPatient?.address
      ? `${selectedPatient.address}, Ulaanbaatar, Mongolia`
      : "Ulaanbaatar, Mongolia",
  );

  const mapSrc = isRouteOptimized && patients.length > 0
    ? buildRouteUrl(patients)
    : `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <div className="relative flex h-[480px] w-full flex-col overflow-hidden rounded-[32px] border-2 border-white/50 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
        <div className="rounded-xl border border-white/60 bg-white/95 px-4 py-2 text-[11px] font-bold text-[#1e293b] shadow-sm backdrop-blur-sm">
          Зам <span className="ml-1 text-[#64748b]">· 18.4 км</span>
        </div>
        <div className="rounded-xl border border-white/60 bg-white/95 px-4 py-2 text-[11px] font-bold text-[#1e293b] shadow-sm backdrop-blur-sm">
          Цаг <span className="ml-1 text-[#64748b]">· ~3h 20m</span>
        </div>
        <div className="rounded-xl border border-white/60 bg-white/95 px-4 py-2 text-[11px] font-bold text-[#1e293b] shadow-sm backdrop-blur-sm">
          Айл <span className="ml-1 text-[#64748b]">· {patients.length}</span>
        </div>
      </div>

      {isRouteOptimized && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          {sortedPatients.map((patient, index) => {
            const style = STATUS_STYLES[patient.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.pending;
            return (
              <div key={patient.id} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span className="text-[10px] font-bold text-slate-300 mx-0.5">→</span>
                )}
                <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${style.badge}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${style.number}`}>
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-bold">{patient.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <iframe
        key={mapSrc}
        title="Өвчтөний байршлын Google Maps"
        src={mapSrc}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
