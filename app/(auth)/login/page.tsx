"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authenticate } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/primitives";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">
        Sign in to continue learning and teaching.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New to Inclusive World?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-xl bg-surface-pink px-4 py-3 text-xs text-gray-600">
        <p className="font-semibold text-gray-700">Demo accounts (password: password123)</p>
        <p className="mt-1">Teacher: teacher@inclusiveworld.org</p>
        <p>Student: student@inclusiveworld.org</p>
      </div>
    </Card>
  );
}
