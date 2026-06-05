"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plus,
  Route,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoredDoctor {
  first_name: string;
  last_name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  GENERAL: "Ерөнхий эмч",
  PEDIATRICIAN: "Хүүхдийн эмч",
  NURSE: "Сувилагч",
};

export const NAV_ITEMS = [
  { label: "Хяналт", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Туслах", href: "/dashboard/assistant", icon: Sparkles },
  { label: "Үзлэгийн түүх", href: "/dashboard/history", icon: ClipboardList },
  { label: "Оршин суугч", href: "/dashboard/patients", icon: Users },
  { label: "Хуваарь", href: "/dashboard/schedules", icon: CalendarDays },
  { label: "Гэрийн эргэлт", href: "/dashboard/visits", icon: CalendarCheck2 },
  { label: "Маршрут", href: "/dashboard/route", icon: Route },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [doctor, setDoctor] = useState<StoredDoctor | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("admin_doctor");
    if (raw) {
      try {
        setDoctor(JSON.parse(raw));
      } catch {
        // malformed — ignore
      }
    }
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 h-screen bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2v12M2 8h12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="font-semibold text-[15px] text-slate-900 tracking-tight">
          FamilyDoc-AI
        </span>
      </div>

      {/* Шинэ үзлэг button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => router.push("/dashboard/consultation")}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Шинэ үзлэг
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Тохиргоо
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Гарах
        </Link>
      </div>

      {/* Doctor profile */}
      <div className="border-t border-slate-100 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
          {doctor
            ? `${doctor.first_name[0]}${doctor.last_name[0]}`.toUpperCase()
            : "—"}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-slate-800 truncate">
            {doctor ? `Эмч ${doctor.first_name} ${doctor.last_name}` : "—"}
          </p>
          <p className="text-[11px] text-slate-500">
            {doctor ? (ROLE_LABELS[doctor.role] ?? doctor.role) : "—"}
          </p>
        </div>
      </div>
    </aside>
  );
}
