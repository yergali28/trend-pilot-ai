import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-16 sm:items-center">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
