"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { session, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = session?.full_name
    ? session.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2v14M2 9h14"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-[15px] font-bold text-slate-900 tracking-tight">
          FamilyDoc
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {session && (
          <>
            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-full pl-1 pr-3 py-1">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                {initials}
              </div>
              <span className="text-[13px] font-medium text-slate-700 max-w-[140px] truncate">
                {session.full_name}
              </span>
            </div>

            {/* Mobile avatar */}
            <div className="sm:hidden w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold">
              {initials}
            </div>
          </>
        )}

        {!session && (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-900 transition-colors"
          >
            <User className="w-4 h-4" />
            Нэвтрэх
          </Link>
        )}

        {session && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Гарах</span>
          </button>
        )}
      </div>
    </header>
  );
}
