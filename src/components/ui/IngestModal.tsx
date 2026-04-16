// IngestModal — AI document ingestion interface.
// Paste a training regimen, syllabus, or study plan and Claude
// will parse it into the goal/operation/phase/module hierarchy.
//
// Shows a processing state with the scanning line animation,
// then a summary of what was created.

"use client";

import { useState } from "react";

interface IngestModalProps {
  domainId: string;
  domainSlug: string;
  domainName: string;
  domainColor: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function IngestModal({
  domainId,
  domainSlug,
  domainName,
  domainColor,
  onClose,
  onComplete,
}: IngestModalProps) {
  const [documentText, setDocumentText] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [preferences, setPreferences] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentText.trim()) return;

    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: documentText.trim(),
          domain_id: domainId,
          domain_slug: domainSlug,
          start_date: startDate,
          preferences: preferences.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process document");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setProcessing(false);
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative max-w-2xl w-full mx-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider" style={{ color: domainColor }}>
                AI Planner
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Paste a document and Claude will structure it into {domainName} goals
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {result ? (
            // Success state
            <div className="space-y-4">
              <div className="text-center py-4">
                <span className="text-3xl mb-2 block">
                  {result.summary?.goal ? "✓" : ""}
                </span>
                <h4 className="text-lg font-semibold text-zinc-100">
                  Plan Created
                </h4>
                <p className="text-sm text-zinc-400 mt-1">
                  {result.summary?.goal}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <p className="text-xl font-mono font-bold text-zinc-100">
                    {result.summary?.operations}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase">Operations</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <p className="text-xl font-mono font-bold text-zinc-100">
                    {result.summary?.phases}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase">Phases</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <p className="text-xl font-mono font-bold text-zinc-100">
                    {result.summary?.modules}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase">Modules</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                View in Domain
              </button>
            </div>
          ) : processing ? (
            // Processing state
            <div className="py-12 text-center space-y-4">
              <div className="scan-loader w-40 mx-auto" style={{ "--scan-color": domainColor } as React.CSSProperties} />
              <div className="space-y-1">
                <p className="text-sm font-mono text-zinc-300">ANALYZING DOCUMENT</p>
                <p className="text-xs text-zinc-600">
                  Claude is parsing your document into a structured plan...
                </p>
              </div>
            </div>
          ) : (
            // Input form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Document input */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Document Content
                </label>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste your training regimen, course syllabus, study plan, or any structured program here..."
                  rows={10}
                  required
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Start date */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Preferences */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Preferences (optional)
                </label>
                <input
                  type="text"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="e.g. Schedule sessions for mornings, 3x per week"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 font-mono">{error}</p>
              )}

              <button
                type="submit"
                disabled={!documentText.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Process with AI
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
