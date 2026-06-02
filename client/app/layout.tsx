import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './auth-context';

export const metadata: Metadata = {
  title: 'Family Medical System',
  description: 'DVA - Эргэлтийн туслах',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}