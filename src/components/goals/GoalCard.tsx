// GoalCard — displays a goal with its operations and progress.
// This is the main card on the domain detail page.
// It shows the goal icon, title, progress stats, and a list of operations.
// Clicking the card expands/collapses the operation list (accordion pattern).

"use client";

import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ProgressStats from "@/components/ui/ProgressStats";
import HoursDisplay from "@/components/ui/HoursDisplay";
import OperationCard from "@/components/operations/OperationCard";
import OperationForm from "@/components/operations/OperationForm";
import { sumModuleHours } from "@/lib/hours";

interface GoalCardProps {
  domainSlug: string;
  goal: {
    id: string;
    title: string;
    description: string;
    icon: string | null;
    status: string;
    target_date: string | null;
    domain_id: string;
    operations: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      phases: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        sort_order: number;
        modules: Array<{
          id: string;
          is_completed: boolean;
          start_time: string | null;
          end_time: string | null;
        }>;
      }>;
    }>;
  };
  color: string;
  onUpdated: () => void;
}

export default function GoalCard({ domainSlug, goal, color, onUpdated }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOpForm, setShowOpForm] = useState(false);

  // Compute progress across all operations
  const allModules = goal.operations.flatMap((op) =>
    op.phases.flatMap((p) => p.modules)
  );
  const totalModules = allModules.length;
  const completedModules = allModules.filter((m) => m.is_completed).length;
  const totalHours = sumModuleHours(allModules);
  const completedOps = goal.operations.filter(
    (o) => o.status === "completed"
  ).length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {goal.icon && (
              <span className="text-2xl">{goal.icon}</span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">{goal.title}</h3>
                <StatusBadge status={goal.status} />
              </div>
              {goal.description && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          {/* Expand arrow */}
          <svg
            className={`w-5 h-5 text-zinc-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Progress stats */}
        <div className="mt-3">
          <ProgressStats
            completed={completedModules}
            total={totalModules}
            hours={totalHours}
            label="modules"
            color={color}
          />
        </div>

        {/* Operations summary line */}
        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <span className="font-mono">
            {completedOps}/{goal.operations.length} operations
          </span>
          {goal.target_date && (
            <span>Target: {goal.target_date}</span>
          )}
          {totalHours > 0 && <HoursDisplay hours={totalHours} />}
        </div>
      </button>

      {/* Expanded: show operations */}
      {expanded && (
        <div className="border-t border-zinc-800">
          {goal.operations.length === 0 ? (
            <div className="px-5 py-6 text-center text-zinc-500 text-sm">
              No operations yet. Create one to start structuring your work.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {goal.operations.map((op) => (
                <OperationCard
                  key={op.id}
                  operation={op}
                  color={color}
                  domainSlug={domainSlug}
                />
              ))}
            </div>
          )}

          {/* Add operation button/form */}
          <div className="px-5 py-3 border-t border-zinc-800">
            {showOpForm ? (
              <OperationForm
                goalId={goal.id}
                domainId={goal.domain_id}
                onCreated={() => {
                  setShowOpForm(false);
                  onUpdated();
                }}
                onCancel={() => setShowOpForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowOpForm(true)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Add Operation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
