import Link from "next/link";
import { GraduationCap, BookOpen, Mail } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getUserClassrooms } from "@/lib/queries";
import { TopBar } from "@/components/layout/top-bar";
import { Logo } from "@/components/brand/logo";
import { Card, Badge } from "@/components/ui/primitives";
import { isTeacherRole } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser();
  const classrooms = await getUserClassrooms(user.id);

  return (
    <div className="min-h-screen">
      <TopBar
        user={{
          id: user.id,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }}
        left={
          <Link href="/dashboard">
            <Logo width={185} />
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-gray-500">Manage your account details.</p>

        <div className="mt-6 grid gap-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Badge tone={user.role === "TEACHER" ? "red" : "blue"}>
                {user.role === "TEACHER" ? "Teacher" : "Student"}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="h-4 w-4" /> {user.email}
              </span>
              <span className="text-sm text-gray-400">
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
            <ProfileForm name={user.name} avatarUrl={user.avatarUrl} />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">My Classes</h2>
            {classrooms.length === 0 ? (
              <p className="text-sm text-gray-400">
                You&apos;re not in any classes yet.{" "}
                <Link href="/dashboard" className="font-semibold text-brand-600 hover:underline">
                  Go to dashboard
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {classrooms.map((c) => (
                  <Link
                    key={c.id}
                    href={`/classroom/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      {c.subject && (
                        <p className="text-xs text-gray-500">{c.subject}</p>
                      )}
                    </div>
                    <Badge tone={isTeacherRole(c.roleInClass) ? "red" : "blue"}>
                      {isTeacherRole(c.roleInClass) ? (
                        <BookOpen className="mr-1 h-3 w-3" />
                      ) : (
                        <GraduationCap className="mr-1 h-3 w-3" />
                      )}
                      {isTeacherRole(c.roleInClass) ? "Teaching" : "Student"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
