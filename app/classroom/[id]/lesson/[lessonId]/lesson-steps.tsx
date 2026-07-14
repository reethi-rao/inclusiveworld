"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLessonStep } from "@/lib/actions/lessons";

export type Step = {
  id: string;
  text: string;
  done: boolean;
};

/**
 * "Your steps" — the lesson broken into small, tickable actions.
 *
 * Optimistic: the tick flips immediately and the server write happens behind it,
 * so tapping never feels laggy. If the write fails we roll that step back.
 */
export function LessonSteps({
  classroomId,
  steps: initialSteps,
}: {
  classroomId: string;
  steps: Step[];
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [, startTransition] = useTransition();

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length && steps.length > 0;

  function toggle(step: Step) {
    const next = !step.done;
    setSteps((prev) =>
      prev.map((s) => (s.id === step.id ? { ...s, done: next } : s))
    );
    startTransition(async () => {
      const res = await toggleLessonStep(classroomId, step.id, next);
      if (!res.ok) {
        setSteps((prev) =>
          prev.map((s) => (s.id === step.id ? { ...s, done: !next } : s))
        );
      }
    });
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your steps</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Tap each step when you finish it. There is no rush.
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 whitespace-nowrap text-sm font-bold",
            allDone ? "text-green-600" : "text-brand-600"
          )}
        >
          {doneCount} of {steps.length} done
        </span>
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step, i) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => toggle(step)}
              aria-pressed={step.done}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors",
                step.done
                  ? "border-green-200 bg-green-50/60"
                  : "border-gray-100 bg-gray-50/50 hover:border-brand-200 hover:bg-brand-50/40"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-colors",
                  step.done
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-200 bg-white text-gray-400"
                )}
              >
                {step.done ? <Check className="h-5 w-5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-base",
                  step.done ? "text-gray-400 line-through" : "text-gray-800"
                )}
              >
                {step.text}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {allDone && (
        <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
          🎉 You finished every step. Great work!
        </p>
      )}
    </section>
  );
}
