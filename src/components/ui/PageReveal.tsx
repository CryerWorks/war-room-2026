// PageReveal — wraps page content and reveals it with a staggered fade-in
// after a specified delay (typically after ScrambleText finishes).
//
// Each direct child fades in sequentially, creating a cascading reveal
// that feels like classified intel being declassified section by section.

"use client";

import { useState, useEffect } from "react";

interface PageRevealProps {
  delay: number; // ms to wait before starting the reveal
  stagger?: number; // ms between each child's reveal
  children: React.ReactNode;
}

export default function PageReveal({
  delay,
  stagger = 120,
  children,
}: PageRevealProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity duration-500 ${
        revealed ? "opacity-100" : "opacity-0"
      }`}
      style={{
        // Each child gets a staggered animation delay via CSS custom property
        ...(revealed ? { "--stagger": `${stagger}ms` } as React.CSSProperties : {}),
      }}
    >
      {revealed && (
        <div className="stagger-in space-y-8">
          {children}
        </div>
      )}
    </div>
  );
}
