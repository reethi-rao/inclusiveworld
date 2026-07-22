"use client";

import Link from "next/link";
import { Home, ListChecks, Sparkles, GraduationCap, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LeafDecoration } from "@/components/brand/leaf-decoration";
import { SidebarNav, type NavItem } from "./sidebar-nav";

/**
 * Left nav for pages outside any one classroom (Dashboard, To-do, Scores, My
 * Buddy, Profile) — same shell as AppSidebar so moving between a classroom
 * and these personal pages doesn't drop the navigation a student's relying
 * on. Lessons/Assignments/Quizzes/People aren't here since those only make
 * sense scoped to a specific classroom.
 */
export function GlobalSidebar({
  isTeacher,
  todoCount = 0,
}: {
  isTeacher: boolean;
  todoCount?: number;
}) {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    ...(!isTeacher
      ? [
          { label: "To-do", href: "/todo", icon: ListChecks, badge: todoCount },
          { label: "Scores", href: "/scores", icon: GraduationCap },
          { label: "My Buddy", href: "/pet", icon: Sparkles },
        ]
      : []),
    { label: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="px-6 py-5">
        <Link href="/dashboard">
          <Logo width={180} />
        </Link>
      </div>

      <SidebarNav items={items} />

      <LeafDecoration className="pointer-events-none absolute bottom-0 left-0 h-56 w-48 opacity-90" />
    </aside>
  );
}
