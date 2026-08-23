import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type Session } from "./server";

export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session ?? null;
}

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
