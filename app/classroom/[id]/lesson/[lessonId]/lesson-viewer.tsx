"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  ClipboardCheck,
  Upload,
  User as UserIcon,
  Presentation,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LeafDecoration } from "@/components/brand/leaf-decoration";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { toggleLessonComplete } from "@/lib/actions/lessons";
import { LessonSteps, type Step } from "./lesson-steps";

type Props = {
  classroom: { id: string; name: string; emoji: string; color: string };
  user: { id: string; name: string; role: string; avatarUrl: string | null };
  isTeacher: boolean;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    embedUrl: string | null;
    completed: boolean;
    estimatedMinutes: number | null;
    steps: Step[];
  };
  lessonList: {
    id: string;
    number: number;
    title: string;
    completed: boolean;
    current: boolean;
  }[];
  prevId: string | null;
  nextId: string | null;
  assignments: {
    id: string;
    title: string;
    dueDate: string | null;
    submitted: boolean;
  }[];
  quizzes: {
    id: string;
    title: string;
    questionCount: number;
    completed: boolean;
  }[];
};

export function LessonViewer(props: Props) {
  const { classroom, user, isTeacher, lesson, lessonList, prevId, nextId } = props;
  const router = useRouter();
  const base = `/classroom/${classroom.id}`;
  const showRail =
    !isTeacher && (props.assignments.length > 0 || props.quizzes.length > 0);
  const [completed, setCompleted] = useState(lesson.completed);
  const [pending, startTransition] = useTransition();

  function toggleComplete() {
    const next = !completed;
    setCompleted(next);
    startTransition(async () => {
      await toggleLessonComplete(classroom.id, lesson.id, next);
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      {/* Course-content sidebar */}
      <aside className="relative flex w-72 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="px-5 py-4">
          <Link href="/dashboard">
            <Logo width={170} />
          </Link>
        </div>
        <p className="px-5 pb-2 text-xs font-bold uppercase tracking-wide text-brand-600">
          Course Content
        </p>
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3">
          {lessonList.map((l) => (
            <Link
              key={l.id}
              href={`${base}/lesson/${l.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                l.current
                  ? "bg-brand-50 font-semibold text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  l.current
                    ? "bg-brand-600 text-white"
                    : "bg-brand-50 text-brand-600"
                )}
              >
                {l.number}
              </span>
              <span className="min-w-0 flex-1 truncate">
                Lesson {l.number}: {l.title}
              </span>
              {l.completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <Circle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    l.current ? "text-brand-500" : "text-gray-300"
                  )}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-gray-100 p-3">
          <Link
            href={`${base}/assignments`}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FileText className="h-5 w-5" /> Assignments
          </Link>
          <Link
            href={`${base}/quizzes`}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ClipboardCheck className="h-5 w-5" /> Quizzes
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <UserIcon className="h-5 w-5" /> Profile
          </Link>
        </div>
        <LeafDecoration className="pointer-events-none absolute bottom-0 left-0 h-44 w-40 opacity-80" />
      </aside>

      {/* Main content + right rail */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
          <Link
            href={`${base}/lessons`}
            className="flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-800"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Lessons
          </Link>
          <UserMenu name={user.name} role={user.role} avatarUrl={user.avatarUrl} />
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Lesson content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                  style={{ backgroundColor: classroom.color }}
                >
                  {classroom.emoji}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {lesson.title}
                  </h1>
                  {lesson.estimatedMinutes && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      About {lesson.estimatedMinutes} minutes
                    </p>
                  )}
                </div>
              </div>
              {!isTeacher && (
                <Button
                  variant={completed ? "outline" : "primary"}
                  onClick={toggleComplete}
                  disabled={pending}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {completed ? "Completed" : "Mark as Complete"}
                </Button>
              )}
            </div>

            {/* Slide viewer */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {lesson.embedUrl ? (
                <iframe
                  src={lesson.embedUrl}
                  title={lesson.title}
                  allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                <PlaceholderSlide
                  title={lesson.title}
                  description={lesson.description}
                  color={classroom.color}
                />
              )}
            </div>

            {/* What this is about */}
            {lesson.description && (
              <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  What this is about
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-gray-600">
                  {lesson.description}
                </p>
              </section>
            )}

            {/* Your steps */}
            {lesson.steps.length > 0 && (
              <div className="mt-6">
                <LessonSteps classroomId={classroom.id} steps={lesson.steps} />
              </div>
            )}

            {/* Turn in my homework — the one obvious next action for a student */}
            {!isTeacher && props.assignments.length > 0 && (
              <div className="mt-6">
                <Button
                  onClick={() => router.push(`${base}/assignments`)}
                  className="px-6 py-3.5 text-base"
                >
                  <Upload className="h-5 w-5" />
                  Turn in my homework
                </Button>
              </div>
            )}

            {/* Prev / Next */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
              {prevId ? (
                <Button variant="outline" onClick={() => router.push(`${base}/lesson/${prevId}`)}>
                  <ArrowLeft className="h-5 w-5" /> Previous Lesson
                </Button>
              ) : (
                <span />
              )}
              {nextId ? (
                <Button onClick={() => router.push(`${base}/lesson/${nextId}`)}>
                  Next Lesson <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <span />
              )}
            </div>
          </main>

          {/* Right rail: student assignment + quiz cards */}
          {showRail && (
          <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto scrollbar-thin border-l border-gray-100 bg-[#f8f9fb] p-4 xl:flex">
            {!isTeacher && props.assignments.length > 0 && (
              <SidePanelSection title="Assignments" href={`${base}/assignments`}>
                {props.assignments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 text-brand-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {a.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No due date"}
                        </p>
                      </div>
                      {a.submitted && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </SidePanelSection>
            )}

            {!isTeacher && props.quizzes.length > 0 && (
              <SidePanelSection title="Quizzes" href={`${base}/quizzes`}>
                {props.quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 text-brand-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {q.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {q.questionCount} questions
                        </p>
                      </div>
                      {q.completed && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </SidePanelSection>
            )}
          </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function SidePanelSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <Link href={href} className="text-xs font-semibold text-brand-600 hover:underline">
          View All
        </Link>
      </div>
      {children}
    </div>
  );
}

function PlaceholderSlide({
  title,
  description,
  color,
}: {
  title: string;
  description: string | null;
  color: string;
}) {
  return (
    <div className="relative flex aspect-video w-full flex-col justify-center overflow-hidden bg-white p-10">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
        <Presentation className="h-4 w-4" /> {title}
      </div>
      <h2
        className="mt-4 text-4xl font-extrabold"
        style={{ color }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-xl text-lg text-gray-600">{description}</p>
      )}
      <ul className="mt-6 space-y-2 text-gray-700">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          A teacher can attach a Google Slides deck to replace this preview.
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          Students can mark the lesson complete once they&apos;ve finished.
        </li>
      </ul>
      <LeafDecoration className="pointer-events-none absolute -bottom-4 -right-4 h-40 w-36 opacity-70" />
    </div>
  );
}
