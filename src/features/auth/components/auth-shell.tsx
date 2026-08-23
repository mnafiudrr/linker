import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-subtle px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-base p-8 shadow-e2">
        {children}
      </div>
    </main>
  );
}

export function AuthFooter({
  text,
  href,
  linkText,
}: {
  text: string;
  href: string;
  linkText: string;
}) {
  return (
    <p className="mt-4 text-center text-xs text-content-secondary">
      {text}{" "}
      <Link href={href} className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-400">
        {linkText}
      </Link>
    </p>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger">
      {message}
    </p>
  );
}
