import { redirect } from "next/navigation";
import { getClassroomContext } from "@/lib/queries";

export default async function ClassroomIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isTeacher } = await getClassroomContext(id);
  redirect(isTeacher ? `/classroom/${id}/people` : `/classroom/${id}/lessons`);
}
