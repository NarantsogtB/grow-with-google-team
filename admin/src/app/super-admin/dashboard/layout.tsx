"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, LogOut } from "lucide-react";

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("super_admin_auth")) {
      router.replace("/super-admin/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("super_admin_auth");
    router.push("/super-admin/login");
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-slate-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top bar */}
      <header className="h-13 bg-slate-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-white tracking-tight">
            Super Admin
          </span>
          <span className="text-[12px] text-slate-400">· FamilyDoc</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[12px] text-slate-400 hover:text-white transition-colors"
          >
            Admin панел
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Гарах
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
