import { requireUser } from "@/features/auth/session";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getAllOwnedFolders, getSharedFolders } from "@/features/folders/queries";
import { FolderTree } from "@/features/folders/components/folder-tree";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await requireUser();
  const [folders, sharedFolders] = await Promise.all([
    getAllOwnedFolders(session.user.id),
    getSharedFolders(session.user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-subtle p-4 md:flex">
        <div className="mb-4 flex items-center justify-between px-2">
          <p className="text-lg font-semibold tracking-tight text-content">Link</p>
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          <FolderTree folders={folders} shared={sharedFolders} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
          <span className="truncate text-xs text-content-secondary">
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
