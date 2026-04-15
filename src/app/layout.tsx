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
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                War Room 2026
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
