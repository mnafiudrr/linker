"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side details are already logged; keep client output generic.
    console.error(error.digest ?? "Unhandled application error");
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-subtle px-4 text-center">
      <p className="text-sm font-medium">Something went wrong.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary-300 px-3 py-1.5 text-sm font-medium text-on-primary transition hover:bg-primary-400"
      >
        Try again
      </button>
    </main>
  );
}
