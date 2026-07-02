"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, User as UserIcon, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { doSignOut } from "@/lib/session-actions";

export function UserMenu({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const firstName = name.split(" ")[0];
  const roleLabel = role === "TEACHER" ? "Instructor" : "Student";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
      >
        <Avatar name={name} src={avatarUrl} size={40} />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-gray-900">Hi, {firstName}!</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <UserIcon className="h-4 w-4 text-gray-400" />
            My Profile
          </Link>
          <form action={doSignOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
