import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/features/auth/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await requireUser();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-subtle p-4 md:block">
        <p className="text-lg font-semibold tracking-tight text-content">Link</p>
        <div className="mt-6 flex items-center justify-between rounded-lg px-2 py-1.5">
          <span className="truncate text-xs text-content-secondary">
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
