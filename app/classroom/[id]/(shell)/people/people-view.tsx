"use client";

import { useState, useTransition } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card, Input, Label, Badge, Avatar } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { inviteTeacher, removeMember } from "./actions";

type Person = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roleInClass: string;
  status: string;
  lastLogin: string | null;
  invitedAt: string;
};

export function PeopleView({
  classroomId,
  people,
}: {
  classroomId: string;
  people: Person[];
}) {
  const [tab, setTab] = useState<"teachers" | "students">("teachers");
  const [inviteOpen, setInviteOpen] = useState(false);

  const teachers = people.filter(
    (p) => p.roleInClass === "ADMIN" || p.roleInClass === "TEACHER"
  );
  const students = people.filter((p) => p.roleInClass === "STUDENT");
  const rows = tab === "teachers" ? teachers : students;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">People</h2>
          <p className="text-sm text-gray-500">
            Manage the teachers and students in your class.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-5 w-5" />
          Invite Teacher
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-6 border-b border-gray-100">
        <TabButton active={tab === "teachers"} onClick={() => setTab("teachers")}>
          Teachers ({teachers.length})
        </TabButton>
        <TabButton active={tab === "students"} onClick={() => setTab("students")}>
          Students ({students.length})
        </TabButton>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-400">
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Last Login</th>
              <th className="px-3 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-400">
                  {tab === "teachers"
                    ? "No teachers yet. Invite a colleague to co-teach."
                    : "No students have joined yet. Share your class code!"}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <PersonRow key={p.id} person={p} classroomId={classroomId} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        classroomId={classroomId}
      />
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
        active
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-gray-500 hover:text-gray-800"
      )}
    >
      {children}
    </button>
  );
}

const ROLE_LABELS: Record<string, { label: string; tone: "red" | "blue"; desc: string }> = {
  ADMIN: {
    label: "Administrator",
    tone: "red",
    desc: "Can manage the course, invite teachers, and manage all content.",
  },
  TEACHER: {
    label: "Teacher",
    tone: "blue",
    desc: "Can teach students, create lessons, and grade assignments.",
  },
  STUDENT: {
    label: "Student",
    tone: "blue",
    desc: "Can view lessons, submit assignments, and take quizzes.",
  },
};

function PersonRow({
  person,
  classroomId,
}: {
  person: Person;
  classroomId: string;
}) {
  const [pending, startTransition] = useTransition();
  const role = ROLE_LABELS[person.roleInClass] ?? ROLE_LABELS.STUDENT;
  const pendingInvite = person.status === "PENDING_INVITE";

  return (
    <tr className="align-top">
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={person.name} src={person.avatarUrl} size={40} />
          <span className="font-semibold text-gray-900">{person.name}</span>
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-600">{person.email}</td>
      <td className="px-3 py-4">
        <Badge tone={role.tone}>{role.label}</Badge>
        <p className="mt-1 max-w-[220px] text-xs text-gray-400">{role.desc}</p>
      </td>
      <td className="px-3 py-4">
        {pendingInvite ? (
          <div>
            <Badge tone="amber">Pending Invite</Badge>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <Mail className="h-3 w-3" /> Invitation sent {formatDateTime(person.invitedAt)}
            </p>
          </div>
        ) : (
          <Badge tone="green">Active</Badge>
        )}
      </td>
      <td className="px-3 py-4 text-sm text-gray-600">
        {pendingInvite ? "—" : formatDateTime(person.lastLogin)}
      </td>
      <td className="px-3 py-4 text-right">
        {person.roleInClass === "ADMIN" ? (
          <span className="text-xs text-gray-300">—</span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await removeMember(classroomId, person.id);
              })
            }
          >
            {pending ? "…" : "Remove"}
          </Button>
        )}
      </td>
    </tr>
  );
}

function InviteModal({
  open,
  onClose,
  classroomId,
}: {
  open: boolean;
  onClose: () => void;
  classroomId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function onSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const res = await inviteTeacher(classroomId, formData);
      if (res.ok) onClose();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a teacher"
      description="They'll be added as a co-teacher for this classroom."
    >
      <form action={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Teacher's email</Label>
          <Input id="email" name="email" type="email" placeholder="colleague@school.org" required />
        </div>
        {error && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send invite"}
        </Button>
      </form>
    </Modal>
  );
}
