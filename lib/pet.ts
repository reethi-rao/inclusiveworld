/**
 * "My Buddy" — a companion that grows as a student learns.
 *
 * Design notes:
 *  - XP is DERIVED from real accomplishments (see getPetState in queries.ts),
 *    never a stored counter. A kid can't lose progress, and it can never
 *    disagree with what they've actually done.
 *  - Growth is the reward. Rewards here are immediate, visible, and
 *    predictable — the traits that make them land for neurodivergent kids —
 *    and there is no punishment or decay. You only ever go up.
 */

export type PetSpecies = "cat" | "bear" | "bunny" | "dino";

export const PET_SPECIES: {
  id: PetSpecies;
  label: string;
  emoji: string;
}[] = [
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "bear", label: "Bear", emoji: "🐻" },
  { id: "bunny", label: "Bunny", emoji: "🐰" },
  { id: "dino", label: "Dino", emoji: "🦖" },
];

// Friendly, high-legibility body colors (all read fine against white cards).
export const PET_COLORS = [
  "#7c9cff", // blue
  "#63c7a6", // green
  "#f2a154", // orange
  "#c78be6", // purple
  "#ef8fb0", // pink
  "#f2cf5b", // yellow
];

export const DEFAULT_PET_COLOR = PET_COLORS[0];

// How much each kind of accomplishment is worth.
export const XP = {
  step: 5,
  lesson: 20,
  assignment: 25,
  quiz: 15,
} as const;

// Five growth stages. `min` is the XP at which the stage begins; the last
// stage has no ceiling.
export type PetStage = {
  level: number;
  name: string;
  min: number;
  /** Rendering scale for the SVG creature. */
  scale: number;
};

export const PET_STAGES: PetStage[] = [
  { level: 1, name: "Tiny", min: 0, scale: 0.7 },
  { level: 2, name: "Little", min: 40, scale: 0.82 },
  { level: 3, name: "Growing", min: 100, scale: 0.92 },
  { level: 4, name: "Big", min: 200, scale: 1.0 },
  { level: 5, name: "Mega", min: 350, scale: 1.08 },
];

export type PetProgress = {
  xp: number;
  stage: PetStage;
  /** XP at which the NEXT stage unlocks, or null if already maxed. */
  nextStageXp: number | null;
  /** 0–1 progress toward the next stage (1 when maxed). */
  toNext: number;
  isMaxed: boolean;
};

export function stageForXp(xp: number): PetStage {
  let current = PET_STAGES[0];
  for (const stage of PET_STAGES) {
    if (xp >= stage.min) current = stage;
  }
  return current;
}

export function petProgress(xp: number): PetProgress {
  const stage = stageForXp(xp);
  const next = PET_STAGES.find((s) => s.level === stage.level + 1) ?? null;
  const isMaxed = next === null;
  const toNext = isMaxed
    ? 1
    : Math.min(1, (xp - stage.min) / (next.min - stage.min));

  return {
    xp,
    stage,
    nextStageXp: next?.min ?? null,
    toNext,
    isMaxed,
  };
}

export function isPetSpecies(value: unknown): value is PetSpecies {
  return (
    typeof value === "string" &&
    PET_SPECIES.some((s) => s.id === value)
  );
}

export function normalizeSpecies(value: unknown): PetSpecies {
  return isPetSpecies(value) ? value : "cat";
}

export function normalizeColor(value: unknown): string {
  return typeof value === "string" && PET_COLORS.includes(value)
    ? value
    : DEFAULT_PET_COLOR;
}

/** Clamp a pet name to something safe and short. */
export function normalizePetName(value: unknown): string {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s.slice(0, 20) : "Buddy";
}
