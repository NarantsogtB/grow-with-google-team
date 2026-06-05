"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, HelpCircle, MapPin, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { PatientResponse, PaginatedResponse } from "@/types";

interface StoredDoctor {
  first_name: string;
  last_name: string;
  role: string;
}

function SearchDropdown({
  results,
  loading,
  visible,
  onSelect,
}: {
  results: PatientResponse[];
  loading: boolean;
  visible: boolean;
  onSelect: (id: string) => void;
}) {
  if (!visible) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
      {loading && (
        <div className="px-4 py-3 text-[12px] text-slate-400">Хайж байна...</div>
      )}
      {!loading && results.length === 0 && (
        <div className="px-4 py-3 text-[12px] text-slate-400">Үр дүн олдсонгүй</div>
      )}
      {results.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3"
        >
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
            {p.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-800 truncate">{p.full_name}</p>
            <p className="text-[11px] text-slate-400">{p.phone_number}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<StoredDoctor | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("admin_doctor");
    if (raw) {
      try { setDoctor(JSON.parse(raw)); } catch { /* malformed */ }
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = desktopRef.current?.contains(target);
      const insideMobile = mobileRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const d = await api.get<PaginatedResponse<PatientResponse>>(
          `/api/v1/patients/?q=${encodeURIComponent(value)}&size=6`
        );
        setSearchResults(d.items);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSelect = (id: string) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchOpen(false);
    router.push(`/dashboard/consultation?patientId=${id}`);
  };

  const displayName = doctor ? `Эмч ${doctor.first_name} ${doctor.last_name}` : "Админ";
  const initials = doctor
    ? `${doctor.first_name[0]}${doctor.last_name[0]}`.toUpperCase()
    : "А";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-3 md:gap-4 shrink-0">

      {/* Mobile: expanded search */}
      {searchOpen && (
        <div className="flex-1 flex items-center gap-2 md:hidden">
          <div ref={mobileRef} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Өвчтөн хайх..."
              className="w-full bg-slate-100 rounded-full pl-9 pr-4 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              visible={showDropdown}
              onSelect={handleSelect}
            />
          </div>
          <button
            onClick={() => {
              setSearchOpen(false);
              setShowDropdown(false);
              setSearchQuery("");
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile: collapsed header (hidden when search is open) */}
      {!searchOpen && (
        <>
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            aria-label="Хайх"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop search — always visible */}
          <div ref={desktopRef} className="hidden md:block flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Өвчтөн хайх..."
              className="w-full bg-slate-100 rounded-full pl-9 pr-4 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              visible={showDropdown}
              onSelect={handleSelect}
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="hidden md:flex w-8 h-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="hidden md:block w-px h-5 bg-slate-200" />

            {/* Location badge — desktop only */}
            <div className="hidden md:flex items-center gap-1.5 border border-slate-200 rounded-full px-3 py-1.5 text-[12px] text-slate-600 font-medium">
              <MapPin className="w-3 h-3 text-blue-600" />
              Улаанбаатар, МН
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-slate-700 hidden sm:block">
                {displayName}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
