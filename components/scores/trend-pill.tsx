import type { Trend } from "@/lib/grades";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ARROWS: Record<Trend["direction"], string> = { up: "↑", down: "↓", flat: "→" };
// Never red for "down" — same no-shaming palette as the grade badges
// themselves (see lib/grades.ts). A drop is just information, not a penalty.
const TONES: Record<Trend["direction"], "green" | "amber"> = {
  up: "green",
  down: "amber",
  flat: "green",
};

/**
 * A small "↑ +4 / ↓ -6 / → steady" chip showing how a score moved. Pass
 * `hidden` when nesting inside a parent that already has a full aria-label
 * covering this value (avoids double-announcing it to screen readers).
 */
export function TrendPill({
  trend,
  className,
  hidden = false,
}: {
  trend: Trend;
  className?: string;
  hidden?: boolean;
}) {
  const description =
    trend.direction === "flat"
      ? "steady, no change"
      : `${trend.direction === "up" ? "up" : "down"} ${Math.abs(trend.delta)} points`;

  return (
    <Badge
      tone={TONES[trend.direction]}
      className={cn("gap-1", className)}
      {...(hidden
        ? { "aria-hidden": true }
        : { role: "img" as const, "aria-label": `Trend: ${description}` })}
    >
      <span aria-hidden>
        {ARROWS[trend.direction]} {trend.label}
      </span>
    </Badge>
  );
}
