"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTeacherContext } from "@/lib/queries";

export type PeopleResult = { ok: boolean; error?: string };

export async function inviteTeacher(
  classroomId: string,
  formData: FormData
): Promise<PeopleResult> {
  await requireTeacherContext(classroomId);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  // If the invitee already has an account, link it; otherwise store a pending
  // invite keyed by email (they'll be attached when they join with the code).
  const existingUser = await prisma.user.findUnique({ where: { email } });

  const alreadyMember = await prisma.membership.findFirst({
    where: {
      classroomId,
      OR: [
        existingUser ? { userId: existingUser.id } : { id: "__none__" },
        { invitedEmail: email },
      ],
    },
  });
  if (alreadyMember) {
    return { ok: false, error: "That person is already invited or enrolled." };
  }

  await prisma.membership.create({
    data: {
      classroomId,
      userId: existingUser?.id ?? null,
      invitedEmail: email,
      roleInClass: "TEACHER",
      status: existingUser ? "ACTIVE" : "PENDING_INVITE",
    },
  });

  if (existingUser) {
    await prisma.notification.create({
      data: {
        userId: existingUser.id,
        type: "people",
        message: "You've been added as a teacher to a classroom.",
        link: `/classroom/${classroomId}/people`,
      },
    });
  }

  revalidatePath(`/classroom/${classroomId}/people`);
  return { ok: true };
}

export async function removeMember(
  classroomId: string,
  membershipId: string
): Promise<PeopleResult> {
  const { membership } = await requireTeacherContext(classroomId);
  if (membership.id === membershipId) {
    return { ok: false, error: "You can't remove yourself." };
  }
  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath(`/classroom/${classroomId}/people`);
  return { ok: true };
}
