"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// ============================================================
// Types
// ============================================================

type EntityType = "goal" | "operation" | "phase" | "module";

interface UndoToastItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  deletedAt: string;
  onUndo: () => void;
}

interface UndoToastContextValue {
  showUndoToast: (item: Omit<UndoToastItem, "id">) => void;
}

// ============================================================
// Context
// ============================================================

const UndoToastContext = createContext<UndoToastContextValue | null>(null);

export function useUndoToast(): UndoToastContextValue {
  const ctx = useContext(UndoToastContext);
  if (!ctx) throw new Error("useUndoToast must be used within UndoToastProvider");
  return ctx;
}

// ============================================================
// Provider
// ============================================================

const TOAST_DURATION = 10_000; // 10 seconds

// Map entity type to its plural API path segment
const entityPathMap: Record<EntityType, string> = {
  goal: "goals",
  operation: "operations",
  phase: "phases",
  module: "modules",
};

export function UndoToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<UndoToastItem[]>([]);

  const showUndoToast = useCallback(
    (item: Omit<UndoToastItem, "id">) => {
      const id = `${item.entityType}-${item.entityId}-${Date.now()}`;
      setToasts((prev) => [...prev, { ...item, id }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUndo = useCallback(
    async (toast: UndoToastItem) => {
      const path = entityPathMap[toast.entityType];
      const res = await fetch(`/api/${path}/${toast.entityId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_at: toast.deletedAt }),
      });

      if (res.ok) {
        toast.onUndo();
      }

      removeToast(toast.id);
    },
    [removeToast]
  );

  return (
    <UndoToastContext.Provider value={{ showUndoToast }}>
      {children}

      {/* Toast container — fixed above the status bar */}
      {toasts.length > 0 && (
        <div className="fixed bottom-10 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onUndo={() => handleUndo(toast)}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
    </UndoToastContext.Provider>
  );
}

// ============================================================
// Individual Toast
// ============================================================

function Toast({
  toast,
  onUndo,
  onDismiss,
}: {
  toast: UndoToastItem;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const [remaining, setRemaining] = useState(TOAST_DURATION);
  const [restoring, setRestoring] = useState(false);
  const startRef = useRef<number | null>(null);

  // Auto-dismiss countdown — capture start time in effect to keep render pure
  useEffect(() => {
    startRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - (startRef.current || Date.now());
      const left = TOAST_DURATION - elapsed;
      if (left <= 0) {
        clearInterval(interval);
        onDismiss();
      } else {
        setRemaining(left);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onDismiss]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = remaining / TOAST_DURATION;

  async function handleUndo() {
    setRestoring(true);
    await onUndo();
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm shadow-lg animate-in slide-in-from-right-5 fade-in duration-200">
      {/* Progress bar countdown */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-amber-500/60 transition-all duration-100"
        style={{ width: `${progress * 100}%` }}
      />

      <div className="px-4 py-3 flex items-center gap-3">
        {/* Icon */}
        <div className="text-amber-500 shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-zinc-300 truncate">
            <span className="text-zinc-500 uppercase">{toast.entityType}</span>{" "}
            &quot;{toast.entityTitle}&quot; deleted
          </p>
        </div>

        {/* Countdown */}
        <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0">
          {seconds}s
        </span>

        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={restoring}
          className="shrink-0 px-2.5 py-1 text-xs font-mono font-medium text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors disabled:opacity-50"
        >
          {restoring ? "..." : "UNDO"}
        </button>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
