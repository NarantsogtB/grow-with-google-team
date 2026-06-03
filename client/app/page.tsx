"use client";

import { useState, useEffect } from "react";
import { usePatients, Patient } from "@/hooks/use-patients"; 
import { Header } from "@/components/header"; 
import { StatsCard } from "@/components/dashboard/stats-card";
import { UrgentCard } from "@/components/dashboard/urgent-card";          
import { PatientMainCard } from "@/components/dashboard/patient-main-card";  
import { PatientItemList } from "@/components/patient/patient-item-list";
import { PatientMap } from "@/components/patient/patient-map";
import { ConsultationView } from "@/components/consultation/consultation-view";

export default function Dashboard() {
  const { patients: hookPatients, loading, setPatients, fallbackData } = usePatients();
  
  // Анхны стейтийг хоосон массив эсвэл fallback-оор эхлүүлнэ
  const [patients, setLocalPatients] = useState<Patient[]>(fallbackData || []);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

  // Хэрэв hook дата өөрчлөгдвөл (Нэвтэрч орж ирэх үед) стейтийг шууд шинэчилнэ
  useEffect(() => {
    if (hookPatients && hookPatients.length > 0) {
      const timer = setTimeout(() => {
        setLocalPatients(hookPatients);
        if (!selectedPatient) {
          setSelectedPatient(hookPatients[1] || hookPatients[0]);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hookPatients, selectedPatient]);

  const handleMoveToTop = (patientId: string | number) => {
    const id = Number(patientId);
    const targetIndex = patients.findIndex((p) => p.id === id);
    if (targetIndex === -1) return;

    const updated = [...patients];
    const [targetPatient] = updated.splice(targetIndex, 1);
    const newOrder = [targetPatient, ...updated];
    
    // Локал болон хуукны стейтийг хоёуланг нь шинэчилнэ
    setLocalPatients(newOrder);
    if (typeof setPatients === "function") {
      setPatients(newOrder);
    }
    setSelectedPatient(targetPatient);
  };

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

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 flex flex-col">
            <StatsCard totalPatients={patients.length} />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            {(() => {
              const urgentList = patients
                .filter((p) => p.status === "urgent")
                .map((p) => ({
                  id: p.id.toString(),
                  name: p.name,
                  age: p.age,
                  description: `${p.preliminaryNote} Triage score ${p.triageScore}/10. Хаяг: ${p.address}`,
                  phone: "99112235",
                }));

              const finalUrgentList = urgentList.length > 0 
                ? urgentList 
                : patients[0] 
                  ? [{
                      id: patients[0].id.toString(),
                      name: patients[0].name,
                      age: patients[0].age,
                      description: `${patients[0].preliminaryNote} Triage score ${patients[0].triageScore}/10. Хаяг: ${patients[0].address}`,
                      phone: "99112235"
                    }]
                  : [];

              return (
                <UrgentCard 
                  urgentPatients={finalUrgentList} 
                  onMoveToTop={handleMoveToTop}
                />
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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