// LogoutButton — tactical-styled logout in the header nav.
// Calls supabase.auth.signOut() and redirects to /login.
// Only renders when a user is authenticated.

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

export default function LogoutButton() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
    >
      Logout
    </button>
  );
}
