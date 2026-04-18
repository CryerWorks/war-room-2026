// DashboardShell — client wrapper that adds the decode/reveal animation
// to the dashboard. The server component renders all the data, passes it
// here as children. This component handles the theatrical entrance:
//
// 1. "DASHBOARD" title scramble-decodes
// 2. Subtitle scramble-decodes (slightly delayed)
// 3. After titles stabilize, the rest of the page fades in with stagger

"use client";

import { useState } from "react";
import ScrambleText from "@/components/ui/ScrambleText";
import PageReveal from "@/components/ui/PageReveal";
import StreakBadge from "@/components/ui/StreakBadge";
import NotificationManager from "@/components/ui/NotificationManager";

interface DashboardShellProps {
  streak: {
    current_streak: number;
    longest_streak: number;
  } | null;
  todayModules?: Array<{
    id: string;
    title: string;
    start_time: string | null;
    is_completed: boolean;
    domain?: { name: string } | null;
  }>;
  children: React.ReactNode;
}

export default function DashboardShell({ streak, todayModules, children }: DashboardShellProps) {
  const [titleDone, setTitleDone] = useState(false);

  // Title scramble takes roughly: (3 + 9*2) * 30ms = ~630ms
  // Subtitle starts 200ms after, adds ~800ms
  // Total header animation: ~1600ms
  // Content reveal starts at ~1200ms (slight overlap for smoothness)
  const contentRevealDelay = 1200;

  return (
    <div className="space-y-8">
      {/* Header with scramble effect */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
            <ScrambleText
              text="Dashboard"
              delay={100}
              speed={30}
              onComplete={() => setTitleDone(true)}
            />
          </h2>
          <p className="mt-1 text-sm sm:text-base">
            <ScrambleText
              text="Your 2026 progress at a glance."
              delay={400}
              speed={20}
              className="text-zinc-400"
            />
          </p>
          {titleDone && todayModules && (
            <div className="mt-2">
              <NotificationManager todayModules={todayModules} />
            </div>
          )}
        </div>
        {streak && titleDone && (
          <div className="animate-[fadeSlideIn_0.3s_ease-out_both]">
            <StreakBadge
              current={streak.current_streak}
              longest={streak.longest_streak}
              label={`Best: ${streak.longest_streak} days`}
            />
          </div>
        )}
      </div>

      {/* Content reveals after titles stabilize */}
      <PageReveal delay={contentRevealDelay}>
        {children}
      </PageReveal>
    </div>
  );
}
