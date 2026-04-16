// StatusBar — thin tactical footer that sits at the bottom of the viewport.
// Shows system status info in tiny monospaced text.
// Gives the "you're inside a secure system" feel.

"use client";

import { useState, useEffect } from "react";

export default function StatusBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-sm px-4 py-1.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
          <span>
            {time && `Local ${time}`}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
          <span>War Room v1.0</span>
          <span>Session Active</span>
        </div>
      </div>
    </footer>
  );
}
