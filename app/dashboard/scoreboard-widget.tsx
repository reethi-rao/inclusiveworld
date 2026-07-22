import Link from "next/link";
import type { ScoresData } from "@/lib/queries";
import { gradeReward, letterGradeDisplay } from "@/lib/grades";
import { Card } from "@/components/ui/primitives";
import { TrendPill } from "@/components/scores/trend-pill";
import { TrophyShelf } from "@/components/scores/trophy-shelf";

/**
 * "How you're doing" — the dashboard's cumulative-grade card, paired with
 * the to-do list (see DashboardPage) so a student sees what they owe and
 * how they're doing in one glance. Nothing to show until something's
 * graded, so it just doesn't render rather than taking up space with an
 * empty state in this tight top-of-page row.
 */
export function ScoreboardWidget({ scores }: { scores: ScoresData }) {
  if (scores.overallAverage == null) return null;

  const overall = gradeReward(scores.overallAverage);

  return (
    <Card className="flex h-full flex-col p-6">
      <h2 className="text-lg font-bold text-gray-900">How you&apos;re doing</h2>

      <Link href="/scores" className="mt-3 block">
        <div
          className={`flex items-center gap-4 rounded-xl p-4 transition-shadow hover:shadow-md ${overall.washClass}`}
          role="img"
          aria-label={`${overall.label}, grade ${letterGradeDisplay(scores.overallAverage)}, ${scores.overallAverage} percent`}
        >
          <span className="text-4xl shrink-0" aria-hidden>
            {overall.symbol}
          </span>
          <div aria-hidden>
            <p className="text-lg font-bold text-gray-900">
              {overall.label} — {letterGradeDisplay(scores.overallAverage)}
            </p>
            <p className="text-xs text-gray-500">Cumulative average across all classes</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold text-brand-600">
                {scores.overallAverage}%
              </span>
              {scores.overallTrend && <TrendPill trend={scores.overallTrend} hidden />}
            </div>
          </div>
        </div>
      </Link>

      {scores.trophies.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Trophy shelf
          </p>
          <TrophyShelf trophies={scores.trophies} />
        </div>
      )}
    </Card>
  );
}
