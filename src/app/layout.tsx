import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavLink from "@/components/ui/NavLink";
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
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <h1 className="text-sm font-mono font-bold tracking-[0.2em] uppercase text-zinc-300">
                War Room <span className="text-zinc-500">2026</span>
              </h1>
              <nav className="flex items-center gap-1">
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/calendar">Calendar</NavLink>
                <NavLink href="/domains">Domains</NavLink>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
