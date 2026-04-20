"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
        isActive
          ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      {children}
    </Link>
  );
}
