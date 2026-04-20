"use client";

import { useState, useEffect, useCallback } from "react";
import { getCalendarDays, toDateString, MONTH_NAMES, DAY_HEADERS } from "@/lib/calendar";
import type { Module } from "@/types";

interface CalendarGridProps {
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

export default function CalendarGrid({ onSelectDate, selectedDate }: CalendarGridProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [modules, setModules] = useState<Module[]>([]);

  const todayStr = toDateString(today);
  const days = getCalendarDays(year, month);

  // Fetch modules for the visible date range
  const fetchModules = useCallback(async () => {
    const startDate = toDateString(days[0]);
    const endDate = toDateString(days[days.length - 1]);

    try {
      const res = await fetch(
        `/api/modules?start_date=${startDate}&end_date=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch {
      // Silently fail — calendar still renders, just without dots
    }
  }, [year, month]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Count modules per date for the dot indicators
  function getModuleCounts(dateStr: string) {
    const dayModules = modules.filter((m) => m.scheduled_date === dateStr);
    return {
      total: dayModules.length,
      completed: dayModules.filter((m) => m.is_completed).length,
    };
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="p-1.5 sm:p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          &larr; <span className="hidden sm:inline">Prev</span>
        </button>
        <h3 className="text-base sm:text-xl font-semibold text-zinc-100">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="p-1.5 sm:p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <span className="hidden sm:inline">Next</span> &rarr;
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-zinc-400 py-1 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 border-t border-l border-zinc-800">
        {days.map((date, i) => {
          const dateStr = toDateString(date);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const counts = getModuleCounts(dateStr);

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${counts.total > 0 ? `, ${counts.total} modules` : ""}`}
              aria-current={isToday ? "date" : undefined}
              className={`
                relative min-h-[52px] sm:min-h-[80px] p-1 sm:p-2 text-left border-r border-b border-zinc-800
                transition-colors
                ${isCurrentMonth
                  ? "bg-zinc-900/50"
                  : "bg-zinc-950"
                }
                ${isSelected
                  ? "ring-2 ring-inset ring-blue-500"
                  : "hover:bg-zinc-800/50"
                }
              `}
            >
              {/* Date number */}
              <span
                className={`
                  text-sm font-medium
                  ${isToday
                    ? "bg-blue-500 text-white w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm"
                    : isCurrentMonth
                      ? "text-zinc-100"
                      : "text-zinc-500"
                  }
                `}
              >
                {date.getDate()}
              </span>

              {/* Module indicators */}
              {counts.total > 0 && (
                <div className="mt-1 flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {counts.completed > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    {counts.total - counts.completed > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">{counts.total}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
