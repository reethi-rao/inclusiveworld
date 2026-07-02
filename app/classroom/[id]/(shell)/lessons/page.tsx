import { prisma } from "@/lib/db";
import { getClassroomContext } from "@/lib/queries";
import { ClassHeader } from "@/components/layout/class-header";
import { LessonsManager } from "./lessons-manager";

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: newParam } = await searchParams;
  const { classroom, user, isTeacher } = await getClassroomContext(id);

  const lessons = await prisma.lesson.findMany({
    where: { classroomId: id },
    orderBy: { order: "asc" },
    include: {
      progress: { where: { userId: user.id } },
    },
  });

  const data = lessons.map((l, i) => ({
    id: l.id,
    number: i + 1,
    title: l.title,
    description: l.description,
    hasSlides: !!l.slidesUrl,
    completed: l.progress[0]?.completed ?? false,
  }));

  const completedCount = data.filter((l) => l.completed).length;

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <ClassHeader
        emoji={classroom.emoji}
        color={classroom.color}
        name={classroom.name}
        subtitle={
          isTeacher
            ? `${data.length} lessons`
            : `${completedCount} of ${data.length} lessons completed`
        }
      />

      <div className="mt-6">
        <LessonsManager
          classroomId={id}
          lessons={data}
          isTeacher={isTeacher}
          autoOpen={newParam === "1" && isTeacher}
        />
      </div>
    </div>
  );
}
