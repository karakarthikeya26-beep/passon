import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { ToastContainer } from '../components/ui/toast-container';
import { DemoUserSwitcher } from '../components/demo-user-switcher';

export const metadata: Metadata = {
  title: 'PassOn — VNR Student Exchange & Knowledge Platform',
  description: 'PassOn helps VNR VJIET students discover, exchange, donate, hand over useful items and share practical senior knowledge. Pass it forward.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#FFFCF8] text-[#292524] flex flex-col min-h-screen">
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ToastContainer />
            <DemoUserSwitcher />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
