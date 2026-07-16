import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getPetState } from "@/lib/queries";
import { TopBar } from "@/components/layout/top-bar";
import { Logo } from "@/components/brand/logo";
import { PetView } from "./pet-view";

export default async function PetPage() {
  const user = await requireUser();
  // The buddy is a student reward loop; teachers don't have one.
  if (user.role === "TEACHER") redirect("/dashboard");

  const pet = await getPetState(user.id);

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
        <PetView pet={pet} />
      </div>
    </div>
  );
}
