import Link from "next/link";
import { BookOpen, FileText, ClipboardCheck } from "lucide-react";

export function ActionBar({ classroomId }: { classroomId: string }) {
  const base = `/classroom/${classroomId}`;
  const actions = [
    { label: "Add Lesson", href: `${base}/lessons?new=1`, icon: BookOpen },
    { label: "Create Assignment", href: `${base}/assignments?new=1`, icon: FileText },
    { label: "Create Quiz", href: `${base}/quizzes?new=1`, icon: ClipboardCheck },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-4 font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
          >
            <Icon className="h-5 w-5" />
            <span>+ {a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
