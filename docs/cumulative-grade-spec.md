# Spec: Cumulative Grade, Trophies & Buddy Encouragement

## 1. Summary

A Canvas-style cumulative grade for students, communicated almost entirely
through visuals (trophies/symbols, not just numbers), surfaced on the
dashboard next to the to-do list, and wired into the My Buddy pet system so
that a dip in grades produces encouragement and a nudge toward practice —
never a punishment.

## 2. What already exists (reuse, don't rebuild)

Most of the plumbing is already in the codebase from the in-flight Scores
feature. This spec extends it rather than replacing it:

| Piece | File | Status |
|---|---|---|
| Cumulative average across assignments + quizzes | [lib/queries.ts](../lib/queries.ts) `getScoresData` | ✅ exists |
| Letter grade → trophy/symbol mapping | [lib/grades.ts](../lib/grades.ts) `gradeReward` | ✅ exists (🏆🌟👍🌱💡, A–F, shame-free) |
| Full grade history page | [app/(global)/scores/page.tsx](../app/(global)/scores/page.tsx) | ✅ exists |
| Dashboard summary card | [app/dashboard/scoreboard-widget.tsx](../app/dashboard/scoreboard-widget.tsx) | ✅ exists, but rendered as a separate grid tile, not paired with the to-do list |
| Derived, never-stored XP for the pet | [lib/pet.ts](../lib/pet.ts) `petProgress` | ✅ exists |
| Notification model (`type`, `message`, `link`, `read`) | [prisma/schema.prisma](../prisma/schema.prisma) `Notification` | ✅ exists; already used for `"grade"` notifications in [assignments/actions.ts](../app/classroom/[id]/(shell)/assignments/actions.ts) |

**Gap this spec fills:** trend/drop detection, pet encouragement, practice
suggestions, and tighter dashboard placement. "Tests" are not a distinct
data type — teachers create them as Assignments or Quizzes today, so the
cumulative grade already covers them by construction; no schema change
needed there.

## 3. Goals

- One cumulative grade per student, rolling up every graded assignment
  (incl. "tests") and every quiz attempt, overall and per-class.
- Communicate grade level primarily through icons/color/size, with numbers
  as secondary confirmation — built for students who may not process
  numeric grades easily.
- Trophy/symbol system with clear tiers, consistent with the existing
  no-shame design language (no red, no "F" styled as failure).
- Cumulative grade card lives directly beside the to-do list on the
  dashboard, not scattered elsewhere.
- When a student's cumulative (or per-class) average drops, My Buddy
  reacts with encouragement — never disappointment — and the app surfaces
  optional practice.

## 4. Non-goals

- No numeric-only fallback mode (visuals are load-bearing, not decorative).
- No punitive pet states (no sad/shrinking/losing-levels animations, ever —
  matches the existing "you only ever go up" XP philosophy in `lib/pet.ts`).
- No auto-generation of new assignment *content*. "More practice" means
  surfacing/re-linking existing lessons, quizzes, or teacher-flagged
  practice items — not an AI content generator (out of scope here).

## 5. Feature breakdown

### A. Cumulative Grade Engine (extends `getScoresData`)

- Keep current shape: overall average + per-class average, built from
  `Submission.grade` (as `%` of `Assignment.points`) and `QuizAttempt.score`.
- Add a **trend value** per scope (overall and per-class): compare the
  running cumulative average *before* the most recently graded item vs.
  *after* it. This requires no new storage — items already carry
  `gradedAt`/`submittedAt`, so the trend is derived by sorting
  chronologically and diffing two running averages, the same
  "derive, never store" pattern already used for pet XP.
- Expose `trend: "up" | "down" | "flat"` and `delta: number` alongside the
  existing `average` in `ClassScores` and at the top level of `ScoresData`.

### B. Trophy / Visual Symbol System (extends `lib/grades.ts`)

- Keep the existing 5-tier A–F → emoji/badge mapping as the base layer.
- Add **milestone trophies** layered on top of the letter grade, shown as a
  small trophy shelf on `/scores` and the dashboard card:
  - 🔥 Streak — N consecutive graded items at B or above.
  - 📈 Most Improved — average rose ≥ some threshold vs. prior window.
  - 🎯 Perfect Score — any single item at 100%.
  - 🏅 Class Champion — highest average in a class the student is in
    (opt-in / teacher-visible only, to avoid unhealthy comparison — see
    open questions).
- Every symbol is always paired with a text label and `aria-label`/`role="img"`,
  exactly as `ScoreRow` and the scores page already do — no color-only or
  icon-only signal anywhere (hard accessibility requirement, not optional).
- Size and saturation scale with grade tier so a glance at shape/size alone
  (color-blind or non-reading friendly) still communicates standing.

### C. Dashboard Placement

- Current: `ScoreboardWidget` is one tile in a 3-column grid alongside
  To-do and My Buddy ([app/dashboard/page.tsx](../app/dashboard/page.tsx)).
- New: pair the cumulative grade card directly with the to-do list as a
  single combined unit at the top of the dashboard (e.g. two-column card:
  left = "What's left" to-do list, right = cumulative grade + trophy
  shelf), so a student sees "what I owe" and "how I'm doing" in one glance
  rather than hunting across tiles. My Buddy stays as its own card below.

### D. Grade-Drop Detection → Pet Encouragement

- Trigger point: the two places a grade is written —
  `assignments/actions.ts` (grading a submission) and
  `quizzes/actions.ts` (auto-score on attempt submit).
- After a grade is written, compute the per-class trend from §A. If
  `trend === "down"`, create a `Notification` (reusing the existing model)
  with a new `type: "buddy_encouragement"`, linked to `/pet`.
- On `/pet` and the dashboard Buddy card, an encouragement state replaces
  the default "keep going" copy — e.g. Buddy shown mid-cheer pose with a
  message like "Math was tricky this time — I believe in you! Want to try
  a practice round?" Tone: warm, never guilt-inducing, never mentions the
  word "drop" or shows a declining chart to the student.
- Buddy's level/XP itself is unaffected by the drop (XP only ever
  increases per the existing model) — encouragement is a *separate*
  signal layered on top, not a penalty to growth.

### E. Practice Suggestions

- V1 (no new content, low risk): on drop, surface a "Want more practice?"
  card on `/pet` and the dashboard, linking to the **existing** lessons/
  quizzes already in that classroom that relate to the item that dropped
  the average (same `classroomId`) — e.g. "redo this quiz" or "revisit
  this lesson." Pure re-linking of existing data via `classroomId`.
- V2 (needs teacher buy-in, later phase): notify the teacher
  ("student may benefit from extra practice in [class]") so they can
  optionally flag an existing assignment/quiz as `isPractice: true` /
  low-stakes, which then shows up in the V1 suggestion card first.

## 6. Data model changes

Minimal — everything above is derivable from existing tables. The only
addition:

```prisma
// Notification.type gains a new value: "buddy_encouragement"
// (string field already, no migration needed — see lib/constants.ts
// for where notification types are validated in app code)
```

If V2 practice-flagging ships, add:

```prisma
model Assignment {
  // ...
  isPractice Boolean @default(false)
}
model Quiz {
  // ...
  isPractice Boolean @default(false)
}
```

No new tables are needed for trend/streak detection — it's computed from
existing `Submission`/`QuizAttempt` timestamps, consistent with how pet XP
is already derived rather than stored.

## 7. Accessibility / visual requirements (hard constraints)

- Every grade/trophy signal ships as icon + color + text together — never
  color alone, never icon alone.
- Minimum icon size large enough to read at a glance (match existing
  `text-6xl` hero symbol and `text-3xl` row symbols in `scores/page.tsx`).
- Reuse `ReadAloud` on every new surface (dashboard combined card, pet
  encouragement message) — this app already narrates scores; encouragement
  text must be narratable too.
- No red anywhere in the grade/trophy palette (already reserved for
  "overdue" elsewhere); low tiers use slate/amber, never a "failing" cue.
- Respect existing `textScale`/`lineSpacing`/`readingFont` user prefs on
  all new copy.

## 8. Open questions (need a decision before build)

1. **"Class Champion" trophy** — comparing students against classmates
   could cause anxiety for exactly the population this app serves. Ship
   it teacher-only, drop it, or make it opt-in per student?
2. **Drop threshold** — react to *any* decrease, or only a decrease past
   some minimum delta (e.g. 5 points) to avoid noisy encouragement after
   trivial fluctuations?
3. **Practice suggestion surface** — dashboard card, pet page only, or
   both?
4. **Notification volume** — should `buddy_encouragement` respect a
   per-day cap so a rough week doesn't spam the student?

## 9. Suggested phasing

1. **Phase 1** — trend calc in `getScoresData`, milestone trophies in
   `lib/grades.ts`, combined dashboard card (to-do + cumulative grade).
2. **Phase 2** — drop detection wired into the two grading actions, Buddy
   encouragement notification + `/pet` state.
3. **Phase 3** — V1 practice-suggestion card (re-link existing content).
4. **Phase 4 (stretch)** — teacher-facing `isPractice` flagging (V2).
