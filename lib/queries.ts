import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { isTeacherRole } from "@/lib/constants";
import { dueSortKey } from "@/lib/due";
import {
  XP,
  petProgress,
  normalizeSpecies,
  normalizeColor,
  normalizePetName,
  type PetProgress,
  type PetSpecies,
} from "@/lib/pet";
import {
  trendFor,
  ENCOURAGEMENT_DROP_THRESHOLD,
  IMPROVEMENT_TROPHY_THRESHOLD,
  STREAK_TROPHY_MIN,
  type Trend,
} from "@/lib/grades";

/**
 * Loads a classroom and the current user's ACTIVE membership in it.
 * Redirects to /login if signed out; 404s if the class doesn't exist or the
 * user isn't a member.
 */
export async function getClassroomContext(classroomId: string) {
  const user = await requireUser();

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) notFound();

  const membership = await prisma.membership.findFirst({
    where: { classroomId, userId: user.id, status: "ACTIVE" },
  });
  if (!membership) notFound();

  return {
    user,
    classroom,
    membership,
    isTeacher: isTeacherRole(membership.roleInClass),
  };
}

/** Same as getClassroomContext but requires a teacher/admin role. */
export async function requireTeacherContext(classroomId: string) {
  const ctx = await getClassroomContext(classroomId);
  if (!ctx.isTeacher) redirect(`/classroom/${classroomId}/lessons`);
  return ctx;
}

/** All classrooms the user is an active member of, with quick stats. */
export async function getUserClassrooms(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      classroom: {
        include: {
          _count: {
            select: { memberships: true, lessons: true, assignments: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return memberships.map((m) => ({
    ...m.classroom,
    roleInClass: m.roleInClass,
  }));
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export type TodoItem = {
  id: string;
  kind: "assignment" | "quiz";
  title: string;
  subtitle: string | null;
  className: string;
  classEmoji: string;
  classColor: string;
  dueDate: string | null;
  href: string;
};

/**
 * Everything the student still owes across ALL of their classes, soonest first.
 *
 * Only STUDENT memberships are considered — a teacher's "to-do" is a different
 * problem (grading), so mixing them here would muddy the list.
 */
export async function getTodoItems(userId: string): Promise<TodoItem[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId, status: "ACTIVE", roleInClass: "STUDENT" },
    select: { classroomId: true },
  });
  const classIds = memberships.map((m) => m.classroomId);
  if (classIds.length === 0) return [];

  const [assignments, quizzes] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        classroomId: { in: classIds },
        // Outstanding == the student has no submission yet.
        submissions: { none: { userId } },
      },
      include: { classroom: true },
    }),
    prisma.quiz.findMany({
      where: {
        classroomId: { in: classIds },
        attempts: { none: { userId } },
      },
      include: { classroom: true },
    }),
  ]);

  const items: TodoItem[] = [
    ...assignments.map((a) => ({
      id: a.id,
      kind: "assignment" as const,
      title: a.title,
      subtitle: a.description,
      className: a.classroom.name,
      classEmoji: a.classroom.emoji,
      classColor: a.classroom.color,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      href: `/classroom/${a.classroomId}/assignments`,
    })),
    ...quizzes.map((q) => ({
      id: q.id,
      kind: "quiz" as const,
      title: q.title,
      subtitle: q.description,
      className: q.classroom.name,
      classEmoji: q.classroom.emoji,
      classColor: q.classroom.color,
      dueDate: null,
      href: `/classroom/${q.classroomId}/quizzes`,
    })),
  ];

  return items.sort((a, b) => dueSortKey(a.dueDate) - dueSortKey(b.dueDate));
}

export async function getTodoCount(userId: string): Promise<number> {
  const items = await getTodoItems(userId);
  return items.length;
}

export type PracticeSuggestion = {
  kind: "quiz" | "lesson" | "assignment";
  title: string;
  className: string;
  minutes: number | null;
  href: string;
};

export type PetEncouragement = {
  className: string;
  message: string;
  suggestions: PracticeSuggestion[];
};

export type PetState = {
  species: PetSpecies;
  name: string;
  color: string;
  progress: PetProgress;
  counts: {
    steps: number;
    lessons: number;
    assignments: number;
    quizzes: number;
  };
  encouragement: PetEncouragement | null;
};

/**
 * The student's buddy: cosmetic choices from their profile + an XP total
 * derived live from everything they've actually completed.
 */
export type ScoreItem = {
  id: string;
  kind: "assignment" | "quiz";
  title: string;
  classroomId: string;
  className: string;
  classEmoji: string;
  classColor: string;
  score: number; // normalized 0-100, so assignments (out of `points`) and quizzes (already %) compare fairly
  raw: string; // "92/100" or "85%", shown to the student instead of the normalized score
  gradedAt: string;
  feedback: string | null; // teacher's written comment, if any (quizzes don't have one — auto-graded)
};

export type ClassScores = {
  classroomId: string;
  className: string;
  classEmoji: string;
  classColor: string;
  average: number;
  trend: Trend;
  items: ScoreItem[];
};

export type ScoreTrophy = {
  id: string;
  icon: string;
  label: string;
  description: string;
};

export type ScoresData = {
  overallAverage: number | null;
  overallTrend: Trend | null;
  gradedCount: number;
  classes: ClassScores[];
  trophies: ScoreTrophy[];
};

const average = (scores: number[]) =>
  Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

/**
 * How much the average moved when the most recent item (by gradedAt) was
 * added, compared to where it stood right before. Needs no history table —
 * derived live from the timestamps every graded item already carries, same
 * "derive, never store" spirit as pet XP (see lib/pet.ts).
 */
function trendFromChronological(itemsNewestFirst: ScoreItem[]): Trend {
  if (itemsNewestFirst.length < 2) return trendFor(0);
  const oldestFirst = [...itemsNewestFirst].reverse();
  const scores = oldestFirst.map((i) => i.score);
  const currentAvg = average(scores);
  const priorAvg = average(scores.slice(0, -1));
  return trendFor(currentAvg - priorAvg);
}

/**
 * A student's own grades across every class they're in: graded assignment
 * submissions plus quiz attempts (quizzes auto-score on submit, so every
 * attempt counts). Mirrors getTodoItems/getPetState — a cross-class rollup,
 * not scoped to one classroom.
 */
export async function getScoresData(userId: string): Promise<ScoresData> {
  const [submissions, attempts] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, grade: { not: null } },
      include: { assignment: { include: { classroom: true } } },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { include: { classroom: true } } },
    }),
  ]);

  const items: ScoreItem[] = [
    ...submissions.map((s) => ({
      id: s.id,
      kind: "assignment" as const,
      title: s.assignment.title,
      classroomId: s.assignment.classroomId,
      className: s.assignment.classroom.name,
      classEmoji: s.assignment.classroom.emoji,
      classColor: s.assignment.classroom.color,
      score: Math.round((s.grade! / s.assignment.points) * 100),
      raw: `${s.grade}/${s.assignment.points}`,
      gradedAt: s.submittedAt.toISOString(),
      feedback: s.feedback,
    })),
    ...attempts.map((a) => ({
      id: a.id,
      kind: "quiz" as const,
      title: a.quiz.title,
      classroomId: a.quiz.classroomId,
      className: a.quiz.classroom.name,
      classEmoji: a.quiz.classroom.emoji,
      classColor: a.quiz.classroom.color,
      score: a.score,
      raw: `${a.score}%`,
      gradedAt: a.completedAt.toISOString(),
      feedback: null,
    })),
  ];
  items.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

  const byClass = new Map<string, Omit<ClassScores, "trend">>();
  for (const item of items) {
    const existing = byClass.get(item.classroomId);
    if (existing) {
      existing.items.push(item);
    } else {
      byClass.set(item.classroomId, {
        classroomId: item.classroomId,
        className: item.className,
        classEmoji: item.classEmoji,
        classColor: item.classColor,
        average: 0,
        items: [item],
      });
    }
  }
  const classes = Array.from(byClass.values()).map((c) => ({
    ...c,
    average: average(c.items.map((i) => i.score)),
    trend: trendFromChronological(c.items),
  }));

  return {
    overallAverage: items.length ? average(items.map((i) => i.score)) : null,
    overallTrend: items.length ? trendFromChronological(items) : null,
    gradedCount: items.length,
    classes,
    trophies: computeTrophies(items, classes),
  };
}

/**
 * Milestone trophies layered on top of the plain A-F badge — a small
 * "shelf" of things the student has earned, not just a snapshot of where
 * they stand right now. No trophy compares a student to classmates (that's
 * deliberately left out for this audience — see docs/cumulative-grade-spec.md).
 */
function computeTrophies(itemsNewestFirst: ScoreItem[], classes: ClassScores[]): ScoreTrophy[] {
  const trophies: ScoreTrophy[] = [];

  let streak = 0;
  for (const item of itemsNewestFirst) {
    if (item.score >= 80) streak++;
    else break;
  }
  if (streak >= STREAK_TROPHY_MIN) {
    trophies.push({
      id: "streak",
      icon: "🔥",
      label: `${streak}-streak at B+`,
      description: `${streak} graded items in a row at B or above`,
    });
  }

  const mostImproved = classes
    .filter((c) => c.trend.direction === "up" && c.trend.delta >= IMPROVEMENT_TROPHY_THRESHOLD)
    .sort((a, b) => b.trend.delta - a.trend.delta)[0];
  if (mostImproved) {
    trophies.push({
      id: "most-improved",
      icon: "📈",
      label: "Most Improved",
      description: `${mostImproved.className} rose ${mostImproved.trend.delta} points`,
    });
  }

  const perfect = itemsNewestFirst.find((i) => i.score === 100);
  if (perfect) {
    trophies.push({
      id: "perfect-score",
      icon: "🎯",
      label: "Perfect Score",
      description: `${perfect.title} — 100%`,
    });
  }

  return trophies;
}

export async function getPetState(userId: string): Promise<PetState> {
  const [user, steps, lessons, assignments, quizzes, scores] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { petSpecies: true, petName: true, petColor: true },
    }),
    prisma.lessonStepProgress.count({ where: { userId, done: true } }),
    prisma.lessonProgress.count({ where: { userId, completed: true } }),
    prisma.submission.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId } }),
    getScoresData(userId),
  ]);

  const xp =
    steps * XP.step +
    lessons * XP.lesson +
    assignments * XP.assignment +
    quizzes * XP.quiz;

  return {
    species: normalizeSpecies(user?.petSpecies),
    name: normalizePetName(user?.petName),
    color: normalizeColor(user?.petColor),
    progress: petProgress(xp),
    counts: { steps, lessons, assignments, quizzes },
    encouragement: await getPetEncouragement(userId, scores),
  };
}

/**
 * When a class's average just dropped by more than trivial noise, My Buddy
 * reacts — never with disappointment (Buddy's own level never goes down,
 * see lib/pet.ts), just encouragement plus a couple of low-stakes, already-
 * existing things the student could revisit. Picks whichever dropping class
 * was graded most recently, so the message always matches what just happened.
 */
async function getPetEncouragement(
  userId: string,
  scores: ScoresData
): Promise<PetEncouragement | null> {
  const dropped = scores.classes
    .filter((c) => c.trend.direction === "down" && c.trend.delta <= -ENCOURAGEMENT_DROP_THRESHOLD)
    .sort((a, b) => {
      const aLatest = new Date(a.items[0]?.gradedAt ?? 0).getTime();
      const bLatest = new Date(b.items[0]?.gradedAt ?? 0).getTime();
      return bLatest - aLatest;
    })[0];
  if (!dropped) return null;

  const lowestItem = [...dropped.items].sort((a, b) => a.score - b.score)[0];
  const suggestions: PracticeSuggestion[] = [];

  if (lowestItem) {
    suggestions.push({
      kind: lowestItem.kind,
      title: `Redo: ${lowestItem.title}`,
      className: dropped.className,
      minutes: null,
      href:
        lowestItem.kind === "quiz"
          ? `/classroom/${dropped.classroomId}/quizzes`
          : `/classroom/${dropped.classroomId}/assignments`,
    });
  }

  const [incompleteLesson, anyLesson] = await Promise.all([
    prisma.lesson.findFirst({
      where: { classroomId: dropped.classroomId, progress: { none: { userId, completed: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.lesson.findFirst({
      where: { classroomId: dropped.classroomId },
      orderBy: { order: "asc" },
    }),
  ]);
  const lesson = incompleteLesson ?? anyLesson;
  if (lesson) {
    suggestions.push({
      kind: "lesson",
      title: `Revisit: ${lesson.title} lesson`,
      className: dropped.className,
      minutes: lesson.estimatedMinutes,
      href: `/classroom/${dropped.classroomId}/lessons`,
    });
  }

  return {
    className: dropped.className,
    message: `${dropped.className} was a little tricky this time — I still believe in you! Want to try a practice round?`,
    suggestions,
  };
}
