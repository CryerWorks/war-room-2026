"use client";

import { useState, useEffect, useCallback } from "react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DayDetail from "@/components/calendar/DayDetail";
import { toDateString } from "@/lib/calendar";
import type { Domain } from "@/types";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateString(new Date())
  );
  const [domains, setDomains] = useState<Domain[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchDomains() {
      try {
        const res = await fetch("/api/domains");
        if (res.ok) {
          const data = await res.json();
          setDomains(data.domains.map((d: { domain: Domain }) => d.domain));
        }
      } catch {
        // domains will stay empty, form won't render domain buttons
      }
    }
    fetchDomains();
  }, []);

  // Called when a module is created, toggled, or deleted
  // so the calendar grid refreshes its dot indicators
  const handleModuleChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Calendar
        </h2>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Schedule and track your daily modules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar grid — takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2">
          <CalendarGrid
            key={refreshKey}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>

        {/* Day detail panel — takes 1/3 */}
        <div className="lg:col-span-1">
          {selectedDate && domains.length > 0 && (
            <DayDetail
              date={selectedDate}
              domains={domains}
              onModuleChanged={handleModuleChanged}
            />
          )}
        </div>
      </div>
    </div>
  );
}
