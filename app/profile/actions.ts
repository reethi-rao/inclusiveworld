"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;
  if (!name) return { ok: false, error: "Name can't be empty." };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, avatarUrl },
  });
  revalidatePath("/profile");
  return { ok: true };
}
