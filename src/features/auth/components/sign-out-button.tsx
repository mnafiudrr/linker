"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/features/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-xs text-content-secondary transition hover:bg-subtle hover:text-content disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
