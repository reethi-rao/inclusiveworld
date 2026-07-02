"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  BookOpen,
  FileText,
  ClipboardCheck,
  User as UserIcon,
  ChevronLeft,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LeafDecoration } from "@/components/brand/leaf-decoration";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar({
  classroomId,
  isTeacher,
}: {
  classroomId: string;
  isTeacher: boolean;
}) {
  const pathname = usePathname();
  const base = `/classroom/${classroomId}`;

  const items: NavItem[] = [
    ...(isTeacher
      ? [{ label: "People", href: `${base}/people`, icon: Users }]
      : []),
    { label: "Lessons", href: `${base}/lessons`, icon: BookOpen },
    { label: "Assignments", href: `${base}/assignments`, icon: FileText },
    { label: "Quizzes", href: `${base}/quizzes`, icon: ClipboardCheck },
    { label: "Profile", href: `/profile`, icon: UserIcon },
  ];

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="px-6 py-5">
        <Link href="/dashboard">
          <Logo width={180} />
        </Link>
      </div>

      <Link
        href="/dashboard"
        className="mx-4 mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-brand-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All classes
      </Link>

      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <LeafDecoration className="pointer-events-none absolute bottom-0 left-0 h-56 w-48 opacity-90" />
    </aside>
  );
}
