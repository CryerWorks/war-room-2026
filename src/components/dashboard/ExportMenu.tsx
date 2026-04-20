"use client";

import { useState, useRef, useEffect } from "react";

export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function download(path: string) {
    setOpen(false);
    window.open(path, "_blank");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-mono hover:border-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        title="Export data"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
          />
        </svg>
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => download("/api/export/modules-csv")}
            className="w-full px-4 py-2.5 text-left text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2"
          >
            <span className="text-zinc-500">CSV</span>
            Modules
          </button>
          <div className="border-t border-zinc-800" />
          <button
            onClick={() => download("/api/export/hierarchy-json")}
            className="w-full px-4 py-2.5 text-left text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2"
          >
            <span className="text-zinc-500">JSON</span>
            Full Hierarchy
          </button>
        </div>
      )}
    </div>
  );
}
