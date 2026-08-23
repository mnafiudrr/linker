import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSession } from "@/features/auth/session";
import { LinkedDotsCanvas } from "@/features/landing/components/linked-dots-canvas";

export const metadata = {
  title: "Link — organize & share URLs",
};

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-subtle">
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <span className="text-xl font-semibold tracking-tight text-content">Link</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="primary">Sign up</Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <LinkedDotsCanvas className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70" />
        <h1 className="text-4xl font-semibold tracking-tight text-content md:text-5xl">
          Your links, organized.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-content-secondary md:text-base">
          Save URLs into folders, enrich them with titles, descriptions and fetched
          page details — then share any folder publicly with a read-only link.
          No account needed on the visitor side.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link href="/sign-up">
            <Button variant="primary" className="h-11 px-6 text-base shadow-e2">
              Get started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="secondary" className="h-11 px-6 text-base">
              Sign in
            </Button>
          </Link>
        </div>
        <p className="mt-10 font-mono text-xs text-content-muted">
          folders · metadata · public sharing
        </p>
      </section>

      <footer className="relative z-10 pb-6 text-center text-xs text-content-muted">
        Self-hosted · open by design
      </footer>
    </main>
  );
}
