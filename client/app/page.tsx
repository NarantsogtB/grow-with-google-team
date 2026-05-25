"use client";

import { useState } from "react";
import { usePatients, Patient } from "@/hooks/use-patients"; 
import { Header } from "@/components/header"; 
import { StatsCard } from "@/components/dashboard/stats-card";
import { UrgentCard } from "@/components/dashboard/urgent-card";          
import { PatientMainCard } from "@/components/dashboard/patient-main-card";  
import { PatientItemList } from "@/components/patient/patient-item-list";
import { PatientMap } from "@/components/patient/patient-map";
import { ConsultationView } from "@/components/consultation/consultation-view";

export default function Dashboard() {
  const { patients, loading, fallbackData } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(fallbackData[1]);
  const [isConsulting, setIsConsulting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eaf2ee] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e5d48]"></div>
      </div>
    );
  }

  if (isConsulting && selectedPatient) {
    return (
      <ConsultationView 
        selectedPatient={selectedPatient} 
        onClose={() => setIsConsulting(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#eaf2ee] p-4 lg:p-8 font-sans text-[#334155] antialiased">
      <Header />

      {/* Үндсэн div */}
      <div className="flex flex-col gap-6">
        
        {/* 🌟 1. ДЭЭД ТАЛ (StatsCard болон UrgentCard) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 flex flex-col">
            <StatsCard totalPatients={patients.length} />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <UrgentCard />
          </div>
        </div>

        {/* 🌟 2. ДООД ТАЛ (Жагсаалт, Зураг болон Үндсэн Карт) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Зүүн талын дэд div */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            <div className="md:col-span-5 border-2 border-white/50 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
              <PatientItemList 
                patients={patients} 
                selectedPatient={selectedPatient} 
                onSelectPatient={setSelectedPatient} 
              />
            </div>

            <div className="md:col-span-7 border-2 border-white/50 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
              <PatientMap patients={patients} selectedPatient={selectedPatient} />
            </div>

          </div>

          {/* Баруун талын дэд div (Үндсэн карт) */}
          <div className="lg:col-span-4 flex flex-col">
            <PatientMainCard 
              selectedPatient={selectedPatient} 
              onStartConsultation={() => setIsConsulting(true)} 
            />
          </div>

        </div>

      </div>
    </div>
  );
}