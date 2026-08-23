"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { authClient } from "@/features/auth/client";
import { AuthError, AuthFooter, AuthShell } from "./auth-shell";

const signUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const parsed = signUpSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError("Check your details: name is required, and the password needs at least 8 characters.");
      return;
    }

    setPending(true);
    const { error: authError } = await authClient.signUp.email(parsed.data);
    setPending(false);

    if (authError) {
      setError(
        authError.status === 422
          ? "An account with this email already exists."
          : "Sign up failed. Please try again.",
      );
      return;
    }
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-content">Create account</h1>
      <p className="mt-1 mb-6 text-xs text-content-muted">
        Start organizing your links into folders.
      </p>

      <form action={handleSubmit} className="space-y-4">
        {error ? <AuthError message={error} /> : null}

        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="h-9 w-full rounded-lg border border-line bg-base px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-9 w-full rounded-lg border border-line bg-base px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-9 w-full rounded-lg border border-line bg-base px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-9 w-full rounded-lg bg-primary-300 text-sm font-medium text-on-primary transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <AuthFooter text="Already have an account?" href="/sign-in" linkText="Sign in" />
      <Link
        href="/"
        className="mt-2 block text-center text-xs text-content-muted hover:text-content-secondary"
      >
        Back to home
      </Link>
    </AuthShell>
  );
}
