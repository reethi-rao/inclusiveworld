/**
 * Turns a 0-100 score into a letter grade + a symbol a student can recognize
 * at a glance — same spirit as My Buddy (see lib/pet.ts): rewards are
 * immediate and visible, and nothing here reads as a penalty, even at the
 * low end. There's no shaming color or "fail" language, only softer symbols.
 *
 * Badge colors are one hue family (green → amber → slate) so the scale reads
 * as "more saturated = more mastery" rather than a grab-bag of unrelated
 * colors. Deliberately no blue (unused elsewhere in the app) and no red
 * (already means "overdue/urgent" on the Assignments views — reusing it for
 * a low grade would send the wrong signal here). Solid, mid-saturation fills
 * (not pale tints) so every tier actually reads as a badge, not a smudge.
 */

export type LetterGrade = "A" | "B" | "C" | "D" | "F";

export type GradeReward = {
  letter: LetterGrade;
  symbol: string;
  label: string;
  badgeClass: string; // bg-*/text-* pair for the grade pill (solid fill, white text)
  washClass: string; // pale bg-* wash for a hero card background
  accentClass: string; // border-* accent, same hue/shade as badgeClass's fill
};

const REWARDS: Record<LetterGrade, Omit<GradeReward, "letter">> = {
  A: { symbol: "🏆", label: "Outstanding", badgeClass: "bg-green-600 text-white", washClass: "bg-green-50", accentClass: "border-green-600" },
  B: { symbol: "🌟", label: "Doing great", badgeClass: "bg-green-500 text-white", washClass: "bg-green-50", accentClass: "border-green-500" },
  C: { symbol: "👍", label: "Good progress", badgeClass: "bg-amber-500 text-white", washClass: "bg-amber-50", accentClass: "border-amber-500" },
  D: { symbol: "🌱", label: "Growing well", badgeClass: "bg-slate-400 text-white", washClass: "bg-slate-50", accentClass: "border-slate-400" },
  F: { symbol: "💡", label: "Keep going!", badgeClass: "bg-slate-500 text-white", washClass: "bg-slate-50", accentClass: "border-slate-500" },
};

export function letterGrade(score: number): LetterGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function gradeReward(score: number): GradeReward {
  const letter = letterGrade(score);
  return { letter, ...REWARDS[letter] };
}

/** A-to-F in order, for rendering a "what do these symbols mean?" legend. */
export const GRADE_LEGEND: GradeReward[] = (
  Object.keys(REWARDS) as LetterGrade[]
).map((letter) => ({ letter, ...REWARDS[letter] }));

const TIER_MIN: Record<LetterGrade, number> = { A: 90, B: 80, C: 70, D: 60, F: 0 };

/**
 * A finer "B+"-style label for hero displays, layered on top of the plain
 * letter grade above. F never gets a modifier — there's nothing to soften.
 */
export function letterGradeDisplay(score: number): string {
  const letter = letterGrade(score);
  if (letter === "F") return "F";
  const offset = score - TIER_MIN[letter];
  if (offset >= 7) return `${letter}+`;
  if (offset >= 3) return letter;
  return `${letter}-`;
}

/**
 * How a score moved relative to just before it. Movement is reported
 * neutrally — "up"/"down" describe direction only, never "good"/"bad" — a
 * drop still gets a calm amber pill, never red (see gradeReward above: no
 * shaming anywhere in this system, even at the low end).
 */
export type TrendDirection = "up" | "down" | "flat";

export type Trend = {
  direction: TrendDirection;
  delta: number;
  label: string; // "+4" | "-6" | "steady"
};

export function trendFor(delta: number): Trend {
  if (delta > 0) return { direction: "up", delta, label: `+${delta}` };
  if (delta < 0) return { direction: "down", delta, label: `${delta}` };
  return { direction: "flat", delta: 0, label: "steady" };
}

/**
 * A cumulative average has to fall by at least this many points before My
 * Buddy offers encouragement + practice — keeps trivial day-to-day noise
 * (a single so-so quiz) from triggering it.
 */
export const ENCOURAGEMENT_DROP_THRESHOLD = 3;

/** How big a class average's rise has to be to earn the "Most Improved" trophy. */
export const IMPROVEMENT_TROPHY_THRESHOLD = 5;

/** How many graded items at B-or-above in a row earns the streak trophy. */
export const STREAK_TROPHY_MIN = 3;
