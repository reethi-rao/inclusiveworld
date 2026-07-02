"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronRight,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card, Input, Label, Textarea, EmptyState } from "@/components/ui/primitives";
import { FileUpload } from "@/components/ui/file-upload";
import { createLesson, deleteLesson } from "@/lib/actions/lessons";

type LessonRow = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  hasSlides: boolean;
  completed: boolean;
};

export function LessonsManager({
  classroomId,
  lessons,
  isTeacher,
  autoOpen,
}: {
  classroomId: string;
  lessons: LessonRow[];
  isTeacher: boolean;
  autoOpen: boolean;
}) {
  const [addOpen, setAddOpen] = useState(autoOpen);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Lessons</h2>
        {isTeacher && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-5 w-5" />
            Add Lesson
          </Button>
        )}
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="No lessons yet"
          description={
            isTeacher
              ? "Add your first lesson and attach a Google Slides deck."
              : "Your teacher hasn't published any lessons yet. Check back soon!"
          }
          action={
            isTeacher ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-5 w-5" /> Add Lesson
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              classroomId={classroomId}
              lesson={lesson}
              isTeacher={isTeacher}
            />
          ))}
        </div>
      )}

      <AddLessonModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classroomId={classroomId}
      />
    </div>
  );
}

function LessonCard({
  classroomId,
  lesson,
  isTeacher,
}: {
  classroomId: string;
  lesson: LessonRow;
  isTeacher: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {lesson.completed ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : (
          <BookOpen className="h-6 w-6" />
        )}
      </div>

      <Link
        href={`/classroom/${classroomId}/lesson/${lesson.id}`}
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">
            Lesson {lesson.number}
          </span>
          {lesson.hasSlides && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Presentation className="h-3 w-3" /> Slides
            </span>
          )}
        </div>
        <h3 className="truncate font-semibold text-gray-900">{lesson.title}</h3>
        {lesson.description && (
          <p className="truncate text-sm text-gray-500">{lesson.description}</p>
        )}
      </Link>

      {!isTeacher &&
        (lesson.completed ? (
          <span className="flex items-center gap-1 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Completed
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Circle className="h-4 w-4" /> Not started
          </span>
        ))}

      {isTeacher && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteLesson(classroomId, lesson.id);
              router.refresh();
            })
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600"
          aria-label="Delete lesson"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}

      <Link
        href={`/classroom/${classroomId}/lesson/${lesson.id}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:text-brand-600"
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </Card>
  );
}

function AddLessonModal({
  open,
  onClose,
  classroomId,
}: {
  open: boolean;
  onClose: () => void;
  classroomId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function onSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const res = await createLesson(classroomId, formData);
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a lesson"
      description="Attach a Google Slides deck, Drive file, or leave it as a text lesson."
    >
      <form action={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Lesson title</Label>
          <Input id="title" name="title" placeholder="e.g. Functions in Python" required />
        </div>
        <div>
          <Label htmlFor="description">Short description</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            placeholder="What will students learn?"
          />
        </div>
        <div>
          <Label htmlFor="slidesUrl">Google Slides / Drive link (optional)</Label>
          <Input
            id="slidesUrl"
            name="slidesUrl"
            placeholder="https://docs.google.com/presentation/d/…"
          />
          <p className="mt-1 text-xs text-gray-400">
            Paste a share link — we&apos;ll embed the slides in the lesson.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
          <span className="h-px flex-1 bg-gray-100" /> OR upload a file{" "}
          <span className="h-px flex-1 bg-gray-100" />
        </div>
        <FileUpload name="fileUrl" label="Upload slides, PDF, or a document" />
        {error && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Adding…" : "Add lesson"}
        </Button>
      </form>
    </Modal>
  );
}
