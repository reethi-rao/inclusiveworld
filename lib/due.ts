/**
 * Friendly, low-anxiety due-date labels.
 *
 * Students see "Due Tomorrow" or "Due Friday" instead of a raw date — a
 * relative phrase is far easier to act on than "2026-07-17". Anything further
 * out than a week falls back to a plain date so the label stays unambiguous.
 */

export type DueTone = "overdue" | "soon" | "later" | "none";

export type DueInfo = {
  label: string;
  tone: DueTone;
};

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Midnight of the given date, so comparisons are day-based not hour-based. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dueInfo(due: Date | string | null, now: Date = new Date()): DueInfo {
  if (!due) return { label: "No due date", tone: "none" };

  const dueDate = typeof due === "string" ? new Date(due) : due;
  if (Number.isNaN(dueDate.getTime())) return { label: "No due date", tone: "none" };

  const days = Math.round(
    (startOfDay(dueDate).getTime() - startOfDay(now).getTime()) / DAY_MS
  );

  if (days < 0) {
    const overdueBy = Math.abs(days);
    return {
      label: overdueBy === 1 ? "Due yesterday" : `${overdueBy} days late`,
      tone: "overdue",
    };
  }
  if (days === 0) return { label: "Due Today", tone: "soon" };
  if (days === 1) return { label: "Due Tomorrow", tone: "soon" };
  // Within the coming week, the weekday name is the most natural handle.
  if (days <= 6) {
    return { label: `Due ${WEEKDAYS[dueDate.getDay()]}`, tone: days <= 3 ? "soon" : "later" };
  }
  return {
    label: `Due ${dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`,
    tone: "later",
  };
}

/** Sort key: items with no due date sink to the bottom, soonest first. */
export function dueSortKey(due: Date | string | null): number {
  if (!due) return Number.MAX_SAFE_INTEGER;
  const d = typeof due === "string" ? new Date(due) : due;
  const t = d.getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}
