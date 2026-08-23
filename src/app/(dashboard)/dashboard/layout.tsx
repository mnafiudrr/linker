import { requireUser } from "@/features/auth/session";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getAllOwnedFolders } from "@/features/folders/queries";
import { FolderTree } from "@/features/folders/components/folder-tree";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await requireUser();
  const folders = await getAllOwnedFolders(session.user.id);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-subtle p-4 md:flex">
        <p className="mb-4 px-2 text-lg font-semibold tracking-tight text-content">
          Link
        </p>
        <div className="flex-1 overflow-y-auto">
          <FolderTree folders={folders} />
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
