// ScrambleText — "decryption" text reveal effect.
// Each character cycles through random glyphs before resolving to
// the actual letter, staggered left-to-right for a decode feel.
//
// Props:
//   text        — the final string to reveal
//   delay       — ms before the scramble starts (for sequencing multiple titles)
//   speed       — ms between each character scramble tick (lower = faster)
//   onComplete  — callback when all characters have resolved

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Character pool — mix of uppercase, numbers, and symbols for that classified look
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>{}[]";

interface ScrambleTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function ScrambleText({
  text,
  delay = 0,
  speed = 30,
  className = "",
  onComplete,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const frameRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const animate = useCallback(() => {
    const chars = text.split("");
    const totalChars = chars.length;
    // Each character gets a "resolve time" — how many ticks until it locks in.
    // Earlier characters resolve faster, later ones take longer.
    // This creates the left-to-right decode cascade.
    const resolveAt = chars.map((_, i) => {
      const base = 3; // minimum ticks before first char resolves
      const perChar = 2; // additional ticks per character position
      return base + i * perChar;
    });

    let tick = 0;
    const maxTicks = resolveAt[totalChars - 1] + 1;

    function step() {
      const result = chars
        .map((char, i) => {
          // Spaces don't scramble — they're always spaces
          if (char === " ") return " ";
          // If this character has resolved, show the real one
          if (tick >= resolveAt[i]) return char;
          // Otherwise show a random glyph
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplay(result);
      tick++;

      if (tick <= maxTicks) {
        frameRef.current = window.setTimeout(step, speed);
      } else {
        // All characters resolved
        setDisplay(text);
        setDone(true);
        onCompleteRef.current?.();
      }
    }

    step();
  }, [text, speed]);

  // Start after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
      animate();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, [delay, animate]);

  // Before animation starts, show empty or scrambled placeholder
  if (!started) {
    return (
      <span className={`${className} opacity-0`}>
        {text}
      </span>
    );
  }

  return (
    <span className={`${className} font-mono`}>
      {display.split("").map((char, i) => {
        const isResolved = done || display[i] === text[i];
        return (
          <span
            key={i}
            className={`inline-block transition-colors duration-150 ${
              isResolved ? "" : "text-zinc-500"
            }`}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </span>
  );
}
