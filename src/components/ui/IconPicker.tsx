// IconPicker — a compact grid of curated Tabler icons for selecting
// goal and theatre icons. Organized by category with a tactical feel.
//
// DESIGN DECISION: Why not show all 6000 icons?
// Because choice overload kills usability. 40 curated icons covering
// the key concepts (combat, progress, mind, tech, activity) is enough.
// Each icon is clearly readable at the picker's 28x28 button size.
// If you need more, add them to ICON_MAP in TacticalIcon.tsx — one line.

"use client";

import { useState, useEffect, useRef } from "react";
import TacticalIcon, { ICON_CATEGORIES, ALL_ICON_NAMES } from "./TacticalIcon";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Selected icon button — click to open picker */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={value ? `Selected icon: ${value}. Click to change` : "Choose an icon"}
        aria-haspopup="true"
        aria-expanded={open}
        className={`w-12 h-10 rounded-lg border flex items-center justify-center transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
          value
            ? "border-zinc-600 bg-zinc-800"
            : "border-zinc-700 bg-zinc-900"
        } hover:border-zinc-500`}
      >
        {value ? (
          <TacticalIcon name={value} size={20} className="text-zinc-200" />
        ) : (
          <span className="text-xs text-zinc-500">Icon</span>
        )}
      </button>

      {/* Picker dropdown */}
      {open && (
        <div className="absolute top-12 left-0 z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden" role="listbox" aria-label="Icon picker">
          <div className="p-3 max-h-64 overflow-y-auto space-y-3">
            {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
              <div key={category}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {icons.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      role="option"
                      aria-selected={value === iconName}
                      aria-label={iconName}
                      onClick={() => {
                        onChange(iconName);
                        setOpen(false);
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        value === iconName
                          ? "bg-blue-500/20 border border-blue-500/50 text-blue-400"
                          : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <TacticalIcon name={iconName} size={18} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Clear selection */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border-t border-zinc-800 mt-2 pt-2"
              >
                Clear icon
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
