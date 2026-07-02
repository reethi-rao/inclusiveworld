import { Logo } from "@/components/brand/logo";
import { LeafDecoration } from "@/components/brand/leaf-decoration";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-pinklite via-white to-surface-pink px-4 py-10">
      <LeafDecoration className="pointer-events-none absolute -bottom-6 -left-6 h-72 w-60 opacity-70" />
      <LeafDecoration className="pointer-events-none absolute -right-10 -top-10 h-72 w-60 rotate-180 opacity-40" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo width={230} />
        </div>
        {children}
      </div>
    </div>
  );
}
