import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavLink from "@/components/ui/NavLink";
import StatusBar from "@/components/ui/StatusBar";
import BootSequence from "@/components/ui/BootSequence";
import PageTransition from "@/components/ui/PageTransition";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UndoToastProvider } from "@/components/ui/UndoToast";
import LogoutButton from "@/components/auth/LogoutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "War Room 2026",
  description: "Personal goal tracker — linguistic, skill, and physical development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ambient-scanline">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <BootSequence>
            <UndoToastProvider>
            <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                  <h1 className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase text-zinc-300">
                    <span className="hidden sm:inline">War Room </span>
                    <span className="sm:hidden">WR </span>
                    <span className="text-zinc-500 blink-cursor">2026</span>
                  </h1>
                  <nav className="flex items-center gap-0.5 sm:gap-1">
                    <NavLink href="/">Dashboard</NavLink>
                    <NavLink href="/calendar">Calendar</NavLink>
                    <NavLink href="/domains">Domains</NavLink>
                    <NavLink href="/theatres">Theatres</NavLink>
                    <LogoutButton />
                  </nav>
                </div>
              </div>
            </header>

            <main id="main-content" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 w-full">
              <PageTransition>
                {children}
              </PageTransition>
            </main>

            <StatusBar />
            </UndoToastProvider>
          </BootSequence>
        </AuthProvider>
      </body>
    </html>
  );
}
