// StatusBar — thin tactical footer showing system status and agent info.

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function StatusBar() {
  const { user } = useAuth();
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
          {user && (
            <span className="text-zinc-500">{user.email}</span>
          )}
          <span>War Room v2.0</span>
          <span>{user ? "Session Active" : "No Session"}</span>
        </div>
      </div>
    </footer>
  );
}
