// StepperTimeline — vertical phase timeline showing progress through an operation.
// Visual language:
//   ● Solid filled circle = completed (with checkmark)
//   ◉ Pulsing dot = active (currently working on)
//   ○ Hollow circle = pending (not started)
// The connecting line fills up in the domain color as phases complete,
// giving a clear visual of "how far through this operation am I."

import type { PhaseStatus } from "@/types";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: PhaseStatus;
  stats?: {
    completed: number;
    total: number;
  };
}

interface StepperTimelineProps {
  steps: TimelineStep[];
  color: string; // domain accent color
  onStepClick?: (stepId: string) => void;
}

export default function StepperTimeline({
  steps,
  color,
  onStepClick,
}: StepperTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === "completed";
        const isActive = step.status === "active";

        return (
          <div
            key={step.id}
            className="relative flex gap-4"
            onClick={() => onStepClick?.(step.id)}
          >
            {/* Timeline column: dot + connecting line */}
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Status dot */}
              <div
                className={`relative w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                  isCompleted
                    ? "text-white"
                    : isActive
                      ? "border-2"
                      : "border-2 border-zinc-700"
                }`}
                style={{
                  backgroundColor: isCompleted ? color : "transparent",
                  borderColor: isActive ? color : undefined,
                  animation: isActive ? "activePulse 2s ease-in-out infinite" : undefined,
                }}
              >
                {isCompleted && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>

              {/* Connecting line (not on last step) */}
              {!isLast && (
                <div
                  className="w-0.5 flex-1 min-h-[40px]"
                  style={{
                    backgroundColor: isCompleted ? color : "#3f3f46",
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${onStepClick ? "cursor-pointer" : ""}`}>
              <h4
                className={`text-sm font-medium ${
                  isCompleted
                    ? "text-zinc-400"
                    : isActive
                      ? "text-zinc-100"
                      : "text-zinc-500"
                }`}
              >
                {step.title}
              </h4>

              {step.description && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  {step.description}
                </p>
              )}

              {step.stats && step.stats.total > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${step.stats.total === 0 ? 0 : (step.stats.completed / step.stats.total) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-zinc-500">
                    {step.stats.completed}/{step.stats.total}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
