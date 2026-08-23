import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-subtle px-4 text-center">
      <p className="text-sm font-medium">Page not found.</p>
      <Link href="/" className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-300">
        Back to home
      </Link>
    </main>
  );
}
