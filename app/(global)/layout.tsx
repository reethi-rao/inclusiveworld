import { GlobalSidebar } from "@/components/layout/global-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { requireUser } from "@/lib/auth-helpers";
import { getTodoCount } from "@/lib/queries";

export default async function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isTeacher = user.role === "TEACHER";
  const todoCount = isTeacher ? 0 : await getTodoCount(user.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <GlobalSidebar isTeacher={isTeacher} todoCount={todoCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          user={{
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          }}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
