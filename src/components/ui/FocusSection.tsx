// FocusSection — wrapper that dims/brightens based on scroll visibility.
//
// Uses the Intersection Observer API to detect when this section enters
// the viewport's center zone. When centered, the section is full brightness.
// When scrolled away, it dims slightly — creating a depth-of-field effect
// that guides the eye to the currently relevant content.
//
// The effect is subtle (opacity 0.55 → 1.0) — just enough to create
// visual hierarchy without making off-screen content feel hidden.
//
// threshold: 0.3 means "trigger when 30% of the element is visible"
// This prevents flickering at the edges.

"use client";

import { useRef, useEffect, useState } from "react";

interface FocusSectionProps {
  children: React.ReactNode;
  className?: string;
}

export default function FocusSection({ children, className = "" }: FocusSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        // rootMargin shrinks the "viewport" for observation purposes.
        // -10% top and bottom means only the middle 80% of the screen
        // counts as "in view" — sections at the very edges stay dimmed.
        rootMargin: "-10% 0px -10% 0px",
        threshold: 0.3,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0.55,
        transform: isInView ? "scale(1)" : "scale(0.99)",
        filter: isInView ? "none" : "brightness(0.85)",
      }}
    >
      {children}
    </div>
  );
}
