// PageTransition — plays a brief glitch effect when navigating between pages.
// Detects route changes via usePathname() and triggers a quick
// opacity dip + horizontal shift, like a data feed refreshing on a HUD.

"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // Skip the initial mount — only trigger on actual navigation
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    setTransitioning(true);
    // The glitch plays for 250ms, then content appears
    const timer = setTimeout(() => setTransitioning(false), 250);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={transitioning ? "page-glitch" : ""}
      style={{ minHeight: "100%" }}
    >
      {children}
    </div>
  );
}
