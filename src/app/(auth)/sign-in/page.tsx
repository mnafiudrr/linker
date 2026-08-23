import type { Metadata } from "next";

import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getSession } from "@/features/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <SignInForm />;
}
