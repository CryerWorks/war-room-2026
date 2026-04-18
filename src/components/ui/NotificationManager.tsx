// NotificationManager — handles notification permissions and scheduling.
//
// ARCHITECTURE:
// This component mounts on the dashboard. On mount it:
// 1. Checks notification permission state
// 2. If granted, fetches today's modules and schedules reminders
// 3. If not yet asked, shows a small prompt
// 4. On unmount, clears all scheduled timeouts (prevents leaks)
//
// The reminder time is stored in localStorage so it persists
// between sessions. Default is 30 minutes.

"use client";

import { useState, useEffect, useRef } from "react";
import {
  notificationsSupported,
  requestPermission,
  getPermission,
  scheduleNotifications,
} from "@/lib/notifications";

interface NotificationManagerProps {
  todayModules: Array<{
    id: string;
    title: string;
    start_time: string | null;
    is_completed: boolean;
    domain?: { name: string } | null;
  }>;
}

const REMINDER_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
];

export default function NotificationManager({ todayModules }: NotificationManagerProps) {
  const [permission, setPermission] = useState<string>("default");
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const timeoutIds = useRef<number[]>([]);

  // Check permission and schedule on mount
  useEffect(() => {
    const perm = getPermission();
    setPermission(perm === "unsupported" ? "unsupported" : perm);

    // Load saved reminder preference
    const saved = localStorage.getItem("wr2026-reminder-minutes");
    if (saved) setReminderMinutes(parseInt(saved, 10));
  }, []);

  // Schedule notifications when permission is granted and modules are available
  useEffect(() => {
    if (permission !== "granted") return;

    // Clear any existing timeouts from previous renders
    timeoutIds.current.forEach((id) => clearTimeout(id));

    const ids = scheduleNotifications(todayModules, reminderMinutes);
    timeoutIds.current = ids;
    setScheduledCount(ids.length);

    // Cleanup on unmount
    return () => {
      ids.forEach((id) => clearTimeout(id));
    };
  }, [permission, todayModules, reminderMinutes]);

  async function handleRequestPermission() {
    const result = await requestPermission();
    setPermission(result);
  }

  function handleReminderChange(minutes: number) {
    setReminderMinutes(minutes);
    localStorage.setItem("wr2026-reminder-minutes", String(minutes));
  }

  // Don't render anything if notifications aren't supported
  if (permission === "unsupported") return null;

  // Permission prompt — shows once if not yet asked
  if (permission === "default") {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 flex items-center gap-4">
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="text-xs text-zinc-400">Enable notifications for module reminders?</span>
        <button
          onClick={handleRequestPermission}
          className="px-3 py-1 text-xs font-mono rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0 ml-auto"
        >
          Enable
        </button>
      </div>
    );
  }

  // Denied — don't nag, just don't show anything
  if (permission === "denied") return null;

  // Granted — show a small indicator with settings toggle
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-1 hover:text-zinc-400 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {scheduledCount > 0
          ? `${scheduledCount} reminder${scheduledCount !== 1 ? "s" : ""} set`
          : "No upcoming reminders"
        }
      </button>

      {showSettings && (
        <div className="flex items-center gap-1">
          <span className="text-zinc-600">Alert:</span>
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleReminderChange(opt.value)}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                reminderMinutes === opt.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
