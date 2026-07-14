import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getClassroomContext, getTodoCount } from "@/lib/queries";

export default async function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, isTeacher } = await getClassroomContext(id);
  const todoCount = isTeacher ? 0 : await getTodoCount(user.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar classroomId={id} isTeacher={isTeacher} todoCount={todoCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          user={{
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          }}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-[#f8f9fb]">
          {children}
        </main>
      </div>
    </div>
  );
}
