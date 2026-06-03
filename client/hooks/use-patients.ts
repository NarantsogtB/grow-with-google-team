import { useState, useEffect } from "react";

export interface Patient {
  id: number;
  name: string;
  age: number;
  address: string;
  distance: string;
  time: string;
  status: "urgent" | "active" | "completed" | "pending";
  triageScore: number;
  preliminaryNote: string;
  coords: { x: number; y: number };
}

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
  },
  { 
    id: 4, 
    name: "Б. Бат-Эрдэнэ", 
    age: 29, 
    address: "3 хороо, 15-р байр, 22", 
    distance: "2.1 км", 
    time: "11:15", 
    status: "urgent", 
    triageScore: 9, 
    preliminaryNote: "Гэнэт хэвлийгээр хүчтэй өвдсөн, дотор эвгүйрхэнэ.", 
    coords: { x: 30, y: 50 } 
  }
];

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(fallbackData);
  const [loading] = useState(false); // ЕSLint cascading render алдаанаас сэргийлж setLoading-ийг түр хасав

  useEffect(() => {
    // Backend бэлэн болоход энд fetch логикоо нээнэ
  }, []);

  return { patients, loading, setPatients, fallbackData };
}