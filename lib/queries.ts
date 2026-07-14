import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { isTeacherRole } from "@/lib/constants";
import { dueSortKey } from "@/lib/due";

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
