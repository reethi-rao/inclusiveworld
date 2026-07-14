import { prisma } from "@/lib/db";
import { normalizeTheme } from "@/lib/themes";
import { NotificationBell } from "./notification-bell";
import { ThemePicker } from "./theme-picker";
import { UserMenu } from "./user-menu";

export async function TopBar({
  user,
  left,
}: {
  user: { id: string; name: string; role: string; avatarUrl: string | null };
  left?: React.ReactNode;
}) {
  const [notifications, dbUser] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { theme: true },
    }),
  ]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="min-w-0 flex-1">{left}</div>
      <div className="flex items-center gap-2">
        <ThemePicker current={normalizeTheme(dbUser?.theme)} />
        <NotificationBell
          unread={unread}
          notifications={notifications.map((n) => ({
            id: n.id,
            message: n.message,
            link: n.link,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
        <UserMenu name={user.name} role={user.role} avatarUrl={user.avatarUrl} />
      </div>
    </header>
  );
}
