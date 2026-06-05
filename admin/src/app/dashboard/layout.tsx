"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileFAB } from "@/components/layout/mobile-fab";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav />
      <MobileFAB />
    </div>
  );
}
