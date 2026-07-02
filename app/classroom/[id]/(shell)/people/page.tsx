import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getClassroomContext } from "@/lib/queries";
import { ClassHeader } from "@/components/layout/class-header";
import { ActionBar } from "@/components/layout/action-bar";
import { PeopleView } from "./people-view";

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classroom, isTeacher } = await getClassroomContext(id);
  if (!isTeacher) redirect(`/classroom/${id}/lessons`);

  const memberships = await prisma.membership.findMany({
    where: { classroomId: id },
    include: { user: true },
    orderBy: [{ roleInClass: "asc" }, { createdAt: "asc" }],
  });

  const people = memberships.map((m) => ({
    id: m.id,
    name: m.user?.name ?? m.invitedEmail?.split("@")[0] ?? "Invited user",
    email: m.user?.email ?? m.invitedEmail ?? "",
    avatarUrl: m.user?.avatarUrl ?? null,
    roleInClass: m.roleInClass,
    status: m.status,
    lastLogin: m.user?.lastLogin ? m.user.lastLogin.toISOString() : null,
    invitedAt: m.createdAt.toISOString(),
  }));

  const studentCount = people.filter((p) => p.roleInClass === "STUDENT").length;

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <ClassHeader
        emoji={classroom.emoji}
        color={classroom.color}
        name={classroom.name}
        subtitle={`Total Students: ${studentCount}`}
      />

      <div className="mt-6">
        <PeopleView classroomId={id} people={people} />
      </div>

      <div className="mt-8">
        <ActionBar classroomId={id} />
      </div>
    </div>
  );
}
