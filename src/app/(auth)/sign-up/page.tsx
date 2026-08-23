import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <SignUpForm />;
}
