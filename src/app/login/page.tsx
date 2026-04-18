// Login page — Division-themed agent authentication.
//
// DESIGN DECISIONS:
// - Full-screen overlay (same z-index as BootSequence) so it doesn't
//   need a separate layout — the nav/footer simply render behind it
// - Matches the boot sequence aesthetic: dark background, hex grid
//   texture, monospaced text, scan loader during processing
// - Toggle between Sign In and Sign Up modes
// - Error messages in tactical red monospace
// - On success: redirect to dashboard, the boot sequence plays naturally

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        // Supabase may require email confirmation depending on settings.
        // For local dev, email confirmation is usually disabled.
        // Try signing in immediately after signup.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError("Account created. Check your email to confirm, then sign in.");
          setIsSignUp(false);
          return;
        }
        // Create initial data for the new user (streak rows, etc.)
        await fetch("/api/auth/onboard", { method: "POST" });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }

      // Success — redirect to dashboard
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0c0c0e]">
      <div className="w-full max-w-sm px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-sm font-mono font-bold tracking-[0.3em] uppercase text-zinc-400">
            War Room <span className="text-zinc-600">2026</span>
          </h1>
          <div className="scan-loader w-24 mx-auto mt-3 mb-4" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600">
            Agent Authentication Required
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5">
              Identifier
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@warroom.dev"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5">
              Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg border border-red-900/50 bg-red-950/20">
              <p className="text-xs font-mono text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3 rounded-lg bg-blue-500 text-white font-mono text-sm uppercase tracking-wider hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="scan-loader w-16" />
              </span>
            ) : isSignUp ? (
              "Register Agent"
            ) : (
              "Authenticate"
            )}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {isSignUp
              ? "Already registered? Sign in"
              : "New agent? Register"}
          </button>
        </div>

        {/* Classification notice */}
        <p className="mt-8 text-center text-[10px] font-mono uppercase tracking-wider text-zinc-800">
          Classified — Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
