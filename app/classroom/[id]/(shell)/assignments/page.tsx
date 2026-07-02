import { prisma } from "@/lib/db";
import { getClassroomContext } from "@/lib/queries";
import { ClassHeader } from "@/components/layout/class-header";
import { ActionBar } from "@/components/layout/action-bar";
import { AssignmentsView } from "./assignments-view";

export default async function AssignmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: newParam } = await searchParams;
  const { classroom, user, isTeacher } = await getClassroomContext(id);

  const assignments = await prisma.assignment.findMany({
    where: { classroomId: id },
    orderBy: { createdAt: "desc" },
    include: {
      submissions: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });

  const data = assignments.map((a) => {
    const mine = a.submissions.find((s) => s.userId === user.id) ?? null;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      slidesUrl: a.slidesUrl,
      points: a.points,
      submissionCount: a.submissions.length,
      mySubmission: mine
        ? {
            id: mine.id,
            linkUrl: mine.linkUrl,
            text: mine.text,
            grade: mine.grade,
            feedback: mine.feedback,
          }
        : null,
      submissions: isTeacher
        ? a.submissions.map((s) => ({
            id: s.id,
            studentName: s.user.name,
            avatarUrl: s.user.avatarUrl,
            linkUrl: s.linkUrl,
            text: s.text,
            grade: s.grade,
            feedback: s.feedback,
            submittedAt: s.submittedAt.toISOString(),
          }))
        : [],
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <ClassHeader
        emoji={classroom.emoji}
        color={classroom.color}
        name={classroom.name}
        subtitle={`${data.length} assignment${data.length === 1 ? "" : "s"}`}
      />
      <div className="mt-6">
        <AssignmentsView
          classroomId={id}
          assignments={data}
          isTeacher={isTeacher}
          autoOpen={newParam === "1" && isTeacher}
        />
      </div>
      {isTeacher && (
        <div className="mt-8">
          <ActionBar classroomId={id} />
        </div>
      )}
    </div>
  );
}
