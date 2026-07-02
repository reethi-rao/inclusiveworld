"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Card,
  Input,
  Label,
  Textarea,
  Badge,
  EmptyState,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { createQuiz, deleteQuiz, submitQuizAttempt } from "./actions";

type QuizQuestion = { prompt: string; options: string[]; answerIndex?: number };
type Quiz = {
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
  questionCount: number;
  attemptCount: number;
  myScore: number | null;
};

export function QuizzesView({
  classroomId,
  quizzes,
  isTeacher,
  autoOpen,
}: {
  classroomId: string;
  quizzes: Quiz[];
  isTeacher: boolean;
  autoOpen: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(autoOpen);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quizzes</h2>
        {isTeacher && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-5 w-5" /> Create Quiz
          </Button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="No quizzes yet"
          description={
            isTeacher
              ? "Create a quiz to check your students' understanding."
              : "No quizzes have been posted yet."
          }
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <QuizCard
              key={q.id}
              classroomId={classroomId}
              quiz={q}
              isTeacher={isTeacher}
            />
          ))}
        </div>
      )}

      {isTeacher && (
        <CreateQuizModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          classroomId={classroomId}
        />
      )}
    </div>
  );
}

function QuizCard({
  classroomId,
  quiz,
  isTeacher,
}: {
  classroomId: string;
  quiz: Quiz;
  isTeacher: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
          {quiz.description && (
            <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">{quiz.questionCount} questions</p>
          {!isTeacher && quiz.myScore != null && (
            <div className="mt-2">
              <Badge tone={quiz.myScore >= 70 ? "green" : "amber"}>
                Your score: {quiz.myScore}%
              </Badge>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isTeacher ? (
            <span className="text-sm text-gray-500">{quiz.attemptCount} attempts</span>
          ) : (
            <Button variant={quiz.myScore != null ? "outline" : "primary"} size="sm" onClick={() => setOpen((v) => !v)}>
              {quiz.myScore != null ? "Retake" : "Start Quiz"}
              <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
            </Button>
          )}
          {isTeacher && (
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteQuiz(classroomId, quiz.id);
                  router.refresh();
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600"
              aria-label="Delete quiz"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {!isTeacher && open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <QuizRunner
            classroomId={classroomId}
            quiz={quiz}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </Card>
  );
}

function QuizRunner({
  classroomId,
  quiz,
  onClose,
}: {
  classroomId: string;
  quiz: Quiz;
  onClose: () => void;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(
    Array(quiz.questions.length).fill(-1)
  );
  const [result, setResult] = useState<{ score: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function submit() {
    if (answers.some((a) => a === -1)) {
      setError("Please answer every question.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const res = await submitQuizAttempt(classroomId, quiz.id, answers);
      if (res.ok && res.score != null) {
        setResult({ score: res.score });
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  if (result) {
    return (
      <div className="rounded-xl bg-surface-pink p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="mt-2 text-2xl font-bold text-gray-900">{result.score}%</p>
        <p className="text-sm text-gray-600">
          You got {Math.round((result.score / 100) * quiz.questions.length)} of{" "}
          {quiz.questions.length} correct.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {quiz.questions.map((q, qi) => (
        <div key={qi}>
          <p className="mb-2 font-medium text-gray-900">
            {qi + 1}. {q.prompt}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() =>
                  setAnswers((a) => {
                    const copy = [...a];
                    copy[qi] = oi;
                    return copy;
                  })
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left text-sm transition",
                  answers[qi] === oi
                    ? "border-brand-600 bg-brand-50 font-medium text-brand-800"
                    : "border-gray-200 hover:border-brand-200"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                    answers[qi] === oi
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-gray-300 text-transparent"
                  )}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-brand-700">{error}</p>}
      <Button onClick={submit} disabled={pending}>
        {pending ? "Submitting…" : "Submit quiz"}
      </Button>
    </div>
  );
}

function CreateQuizModal({
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<
    { prompt: string; options: string[]; answerIndex: number }[]
  >([{ prompt: "", options: ["", ""], answerIndex: 0 }]);

  function updateQuestion(qi: number, patch: Partial<(typeof questions)[number]>) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }

  function save() {
    setError(undefined);
    startTransition(async () => {
      const res = await createQuiz(classroomId, { title, description, questions });
      if (res.ok) {
        onClose();
        setTitle("");
        setDescription("");
        setQuestions([{ prompt: "", options: ["", ""], answerIndex: 0 }]);
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a quiz"
      description="Add questions and mark the correct answer for each."
    >
      <div className="max-h-[65vh] space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div>
          <Label htmlFor="qtitle">Quiz title</Label>
          <Input
            id="qtitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quiz 2: Functions"
          />
        </div>
        <div>
          <Label htmlFor="qdesc">Description (optional)</Label>
          <Textarea
            id="qdesc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-gray-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Question {qi + 1}
              </span>
              {questions.length > 1 && (
                <button
                  onClick={() =>
                    setQuestions((qs) => qs.filter((_, i) => i !== qi))
                  }
                  className="text-gray-400 hover:text-brand-600"
                  aria-label="Remove question"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
              placeholder="Question prompt"
            />
            <p className="mt-2 mb-1 text-xs text-gray-400">
              Tap the circle to mark the correct answer.
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, { answerIndex: oi })}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      q.answerIndex === oi
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300"
                    )}
                    aria-label="Mark correct"
                  >
                    {q.answerIndex === oi && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) =>
                      updateQuestion(qi, {
                        options: q.options.map((o, i) =>
                          i === oi ? e.target.value : o
                        ),
                      })
                    }
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  />
                  {q.options.length > 2 && (
                    <button
                      onClick={() =>
                        updateQuestion(qi, {
                          options: q.options.filter((_, i) => i !== oi),
                          answerIndex:
                            q.answerIndex >= oi && q.answerIndex > 0
                              ? q.answerIndex - 1
                              : q.answerIndex,
                        })
                      }
                      className="text-gray-300 hover:text-brand-600"
                      aria-label="Remove option"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {q.options.length < 5 && (
              <button
                onClick={() =>
                  updateQuestion(qi, { options: [...q.options, ""] })
                }
                className="mt-2 text-sm font-medium text-brand-600 hover:underline"
              >
                + Add option
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() =>
            setQuestions((qs) => [
              ...qs,
              { prompt: "", options: ["", ""], answerIndex: 0 },
            ])
          }
          className="w-full rounded-xl border-2 border-dashed border-gray-200 py-2 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600"
        >
          + Add question
        </button>

        {error && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
        )}
      </div>

      <Button onClick={save} className="mt-4 w-full" disabled={pending}>
        {pending ? "Creating…" : "Create quiz"}
      </Button>
    </Modal>
  );
}
