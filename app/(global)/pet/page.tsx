import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getPetState } from "@/lib/queries";
import { PetView } from "./pet-view";

export default async function PetPage() {
  const user = await requireUser();
  // The buddy is a student reward loop; teachers don't have one.
  if (user.role === "TEACHER") redirect("/dashboard");

  const pet = await getPetState(user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PetView pet={pet} />
    </div>
  );
}
