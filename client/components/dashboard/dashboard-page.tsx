"use client";

import { useState } from "react";
import { ConsultationView } from "@/components/consultation/consultation-view";
import { HealthCheckModal } from "@/components/consultation/health-check-modal";
import { Header } from "@/components/header";
import { PatientItemList } from "@/components/patient/patient-item-list";
import { PatientMap } from "@/components/patient/patient-map";
import { usePatients } from "@/hooks/use-patients";
import type { Patient } from "@/hooks/use-patients";
import { PatientMainCard } from "./patient-main-card";
import { StatsCard } from "./stats-card";
import { UrgentCard } from "./urgent-card";

export function DashboardPage() {
  const { patients, loading, fallbackData } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    fallbackData[1],
  );
  const [isConsulting, setIsConsulting] = useState(false);
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eaf2ee]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#1e5d48]"></div>
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
    <div className="min-h-screen bg-[#eaf2ee] p-4 font-sans text-[#334155] antialiased lg:p-8">
      <Header />
      <HealthCheckModal
        open={isHealthCheckOpen}
        onClose={() => setIsHealthCheckOpen(false)}
      />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="flex flex-col lg:col-span-8">
            <StatsCard
              totalPatients={patients.length}
              onNewConsultation={() => setIsHealthCheckOpen(true)}
            />
          </div>
          <div className="flex flex-col lg:col-span-4">
            <UrgentCard />
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="grid grid-cols-1 items-stretch gap-6 lg:col-span-8 md:grid-cols-12">
            <div className="flex flex-col overflow-hidden rounded-[32px] border-2 border-white/50 shadow-sm md:col-span-5">
              <PatientItemList
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
              />
            </div>

            <div className="flex flex-col overflow-hidden rounded-[32px] border-2 border-white/50 shadow-sm md:col-span-7">
              <PatientMap patients={patients} selectedPatient={selectedPatient} />
            </div>
          </div>

          <div className="flex flex-col lg:col-span-4">
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
