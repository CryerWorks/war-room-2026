// AuthProvider — React context that provides the current user to the entire app.
//
// HOW IT WORKS:
// 1. On mount, checks if there's an existing session (user already logged in)
// 2. Subscribes to onAuthStateChange — fires on sign in, sign out, token refresh
// 3. Provides { user, loading } via React context
// 4. Any component can call useAuth() to get the current user
//
// WHY CONTEXT, NOT PROPS:
// Auth state is needed everywhere — the header (logout button), the status bar
// (user email), API calls (user ID for inserts). Passing it as props through
// every component would be tedious. Context makes it available anywhere in the
// tree without prop drilling.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check for existing session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Subscribe to auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the current authenticated user.
 * Returns { user, loading } — check loading before assuming user is null.
 */
export function useAuth() {
  return useContext(AuthContext);
}
