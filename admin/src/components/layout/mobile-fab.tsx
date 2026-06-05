"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileFAB() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/dashboard/consultation")}
      className="md:hidden fixed bottom-[76px] right-4 z-30 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-all"
      aria-label="Шинэ үзлэг"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
