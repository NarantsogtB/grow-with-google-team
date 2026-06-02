'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext<{
  token: string | null;
  userName: string | null;
  userAddress: string | null;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');
    const storedAddress = localStorage.getItem('user_address');
    
    setToken(storedToken);
    setUserName(storedName);
    setUserAddress(storedAddress);
    setLoading(false);

    if (!storedToken && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
    
    if (storedToken && (pathname === '/login' || pathname === '/register')) {
      router.push('/');
    }
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_address');
    setToken(null);
    setUserName(null);
    setUserAddress(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef4f0]">
        <div className="animate-pulse text-[#1a5342] font-semibold text-sm">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, userName, userAddress, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};