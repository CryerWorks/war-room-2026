// ScrambleHeading — a thin client wrapper around ScrambleText
// that can be used inside server components.
// Server components can't use hooks directly, so this bridges the gap.

"use client";

import ScrambleText from "./ScrambleText";

interface ScrambleHeadingProps {
  title: string;
  subtitle?: string;
  titleDelay?: number;
  subtitleDelay?: number;
}

export default function ScrambleHeading({
  title,
  subtitle,
  titleDelay = 100,
  subtitleDelay = 350,
}: ScrambleHeadingProps) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
        <ScrambleText text={title} delay={titleDelay} speed={30} />
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm sm:text-base text-zinc-400">
          <ScrambleText text={subtitle} delay={subtitleDelay} speed={20} />
        </p>
      )}
    </div>
  );
}
