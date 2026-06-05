"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header />
      <main className="flex-1 p-5 sm:p-8 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
