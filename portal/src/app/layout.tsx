import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FamilyDoc — Хэрэглэгчийн портал",
  description: "Өрхийн эмнэлэгийн хэрэглэгчийн портал",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
