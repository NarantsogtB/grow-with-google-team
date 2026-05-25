// hooks/use-patients.ts
import { useState, useEffect } from "react";

// Өвчтөний дата төрөл (Type)
export interface Patient {
  id: number;
  name: string;
  age: number;
  address: string;
  distance: string;
  time: string;
  status: "urgent" | "active" | "pending";
  triageScore: number;
  preliminaryNote: string;
  coords: { x: number; y: number };
}

// 🌟 Түр зуурын мок дата
const fallbackData: Patient[] = [
  { 
    id: 1, 
    name: "Д. Мөнхбат", 
    age: 67, 
    address: "4 хороо, 32-р байр, 14", 
    distance: "0.8 км", 
    time: "09:20", 
    status: "urgent", 
    triageScore: 8, 
    preliminaryNote: "Цусны даралт 165/100 · толгой эргэх.", 
    coords: { x: 20, y: 40 } 
  },
  { 
    id: 2, 
    name: "Ц. Оюунчимэг", 
    age: 72, 
    address: "4 хороо, 28-р байр, 41", 
    distance: "1.2 км", 
    time: "09:50", 
    status: "active", 
    triageScore: 4, 
    preliminaryNote: "Зүрхний бэрхшээл байхгүй", 
    coords: { x: 45, y: 60 } 
  },
  { 
    id: 3, 
    name: "Б. Дорж", 
    age: 45, 
    address: "5 хороо, 12-р гудамж, 7", 
    distance: "1.7 км", 
    time: "10:30", 
    status: "pending", 
    triageScore: 2, 
    preliminaryNote: "Хөл өвдөнө гэсэн", 
    coords: { x: 60, y: 30 } 
  }
];

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(fallbackData);
  const [loading, setLoading] = useState(false); // Backend холбохдоо true болгоно (мартаж болохгүй!!!)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // backend бэлэн болоход доорх комментоо нээнэ:
        /*
        setLoading(true);
        const response = await fetch("https://api.your-backend-link.com/patients");
        if (!response.ok) throw new Error("Сүлжээний алдаа гарлаа");
        const data = await response.json();
        setPatients(data);
        */
      } catch (error) {
        console.error("Дата татахад алдаа гарлаа, Mock датаг ашиглаж байна:", error);
        setPatients(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return { patients, loading, setPatients, fallbackData };
}