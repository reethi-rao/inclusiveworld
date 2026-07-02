"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Avatar } from "@/components/ui/primitives";
import { updateProfile } from "./actions";

export function ProfileForm({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState(avatarUrl ?? "");
  const [message, setMessage] = useState<string>();

  function onSubmit(formData: FormData) {
    setMessage(undefined);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.ok) {
        setMessage("Profile saved ✓");
        router.refresh();
      } else setMessage(res.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={preview || null} size={64} />
        <div className="flex-1">
          <Label htmlFor="avatarUrl">Avatar image URL</Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            defaultValue={avatarUrl ?? ""}
            placeholder="https://…"
            onChange={(e) => setPreview(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>
    </form>
  );
}
