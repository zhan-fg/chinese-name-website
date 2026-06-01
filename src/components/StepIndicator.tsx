"use client";

interface Props {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}

export default function StepIndicator({ steps, current, onStepClick }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 max-w-sm mx-auto">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          {/* Dot */}
          <button
            onClick={() => onStepClick?.(i)}
            className={`flex flex-col items-center gap-1 group ${
              onStepClick ? "cursor-pointer" : "cursor-default"
            }`}
            aria-label={`Step ${i + 1}: ${label}${i <= current ? " (completed)" : ""}`}
            aria-current={i === current ? "step" : undefined}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < current
                  ? "bg-deep-blue"
                  : i === current
                  ? "bg-deep-blue ring-2 ring-deep-blue/20"
                  : "bg-card-border"
              }`}
            />
            <span
              className={`text-[10px] transition-colors duration-300 ${
                i <= current ? "text-text-primary" : "text-mist"
              }`}
            >
              {label}
            </span>
          </button>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={`h-px w-10 mb-4 transition-colors duration-300 ${
                i < current ? "bg-deep-blue" : "bg-card-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
