// BootSequence — plays a quick classified-system boot animation
// on first visit. Shows initialization messages one by one,
// then fades out to reveal the app.
//
// Uses sessionStorage so it only plays once per browser session.
//
// IMPORTANT: Children are always rendered in the same position in the
// React tree. If we conditionally changed the tree structure (e.g.,
// returning <>{children}</> when done vs <><overlay/><div>{children}</div></>
// when booting), React would unmount and remount the children — resetting
// all their animations. Instead, we always render children and just
// toggle the overlay's visibility.

"use client";

import { useState, useEffect } from "react";

const BOOT_MESSAGES = [
  { text: "INITIALIZING SYSTEM", delay: 0 },
  { text: "ESTABLISHING SECURE CONNECTION", delay: 600 },
  { text: "LOADING OPERATIONAL DATA", delay: 1200 },
  { text: "VERIFYING CREDENTIALS", delay: 1800 },
  { text: "ACCESS GRANTED", delay: 2400, highlight: true },
];

const TOTAL_DURATION = 3200;

interface BootSequenceProps {
  children: React.ReactNode;
}

export default function BootSequence({ children }: BootSequenceProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if we've already booted this session
    if (sessionStorage.getItem("wr2026-booted")) {
      return; // No overlay, children render immediately
    }

    // Show the boot overlay
    setShowOverlay(true);

    // Schedule each message
    BOOT_MESSAGES.forEach((msg, i) => {
      setTimeout(() => setCurrentStep(i), msg.delay);
    });

    // Fade out the overlay
    setTimeout(() => setFadeOut(true), TOTAL_DURATION);

    // Remove overlay from DOM, mark as booted
    setTimeout(() => {
      setShowOverlay(false);
      sessionStorage.setItem("wr2026-booted", "true");
    }, TOTAL_DURATION + 600);
  }, []);

  return (
    <>
      {/* Boot overlay — sits on top of everything, fades out when done */}
      {showOverlay && (
        <div
          className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#0c0c0e] transition-opacity duration-500 ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="w-full max-w-md px-8">
            <div className="text-center mb-8">
              <h1 className="text-sm font-mono font-bold tracking-[0.3em] uppercase text-zinc-400">
                War Room <span className="text-zinc-600">2026</span>
              </h1>
              <div className="scan-loader w-24 mx-auto mt-3" />
            </div>

            <div className="space-y-2">
              {BOOT_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    i <= currentStep
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      msg.highlight
                        ? "bg-emerald-500"
                        : i < currentStep
                          ? "bg-zinc-600"
                          : i === currentStep
                            ? "bg-blue-500 animate-pulse"
                            : "bg-zinc-800"
                    }`}
                  />
                  <span
                    className={`text-xs font-mono tracking-wider ${
                      msg.highlight
                        ? "text-emerald-400 font-bold"
                        : i <= currentStep
                          ? "text-zinc-400"
                          : "text-zinc-700"
                    }`}
                  >
                    {msg.text}
                    {i === currentStep && !msg.highlight && (
                      <span className="blink-cursor" />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Children always render in the same tree position — never remounted */}
      {children}
    </>
  );
}
