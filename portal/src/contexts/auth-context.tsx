"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { PatientResponse, PatientSession } from "@/types";

interface AuthContextValue {
  patient: PatientResponse | null;
  session: PatientSession | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, session: PatientSession) => void;
  updatePatient: (patient: PatientResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<PatientSession | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("patient_token");
    const storedSession = localStorage.getItem("patient_session");
    if (storedToken && storedSession) {
      setToken(storedToken);
      try {
        setSession(JSON.parse(storedSession));
      } catch {
        // ignore parse errors
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newSession: PatientSession) => {
    localStorage.setItem("patient_token", newToken);
    localStorage.setItem("patient_session", JSON.stringify(newSession));
    setToken(newToken);
    setSession(newSession);
  }, []);

  const updatePatient = useCallback((updated: PatientResponse) => {
    setPatient(updated);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            full_name: updated.full_name,
            address_text: updated.address_text,
          }
        : prev,
    );
    const stored = localStorage.getItem("patient_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PatientSession;
        localStorage.setItem(
          "patient_session",
          JSON.stringify({
            ...parsed,
            full_name: updated.full_name,
            address_text: updated.address_text,
          }),
        );
      } catch {
        // ignore
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_session");
    setToken(null);
    setSession(null);
    setPatient(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ patient, session, token, isLoading, login, updatePatient, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
