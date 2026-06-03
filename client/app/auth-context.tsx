'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthState {
  token: string | null;
  userName: string | null;
  userAddress: string | null;
}

const AuthContext = createContext<{
  token: string | null;
  userName: string | null;
  userAddress: string | null;
  loginSuccess: (token: string, name: string, address: string) => void; // 👈 Шинээр нэмэв
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [auth, setAuth] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      return {
        token: localStorage.getItem('token'),
        userName: localStorage.getItem('user_name'),
        userAddress: localStorage.getItem('user_address'),
      };
    }
    return { token: null, userName: null, userAddress: null };
  });

  useEffect(() => {
    if (!auth.token && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
    if (auth.token && (pathname === '/login' || pathname === '/register')) {
      router.push('/');
    }
  }, [auth.token, pathname, router]);

  // Нэвтрэлт амжилттай болоход стейтийг тэр дороо шинэчлэх функц
  const loginSuccess = (token: string, name: string, address: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_address', address);
    
    setAuth({ token, userName: name, userAddress: address });
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_address');
    setAuth({ token: null, userName: null, userAddress: null });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ ...auth, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};