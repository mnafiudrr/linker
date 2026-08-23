import { getDb } from "@/db";
import { requireUser } from "@/features/auth/session";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  getAllOwnedFolders,
  getCollaborations,
  getSharedFolders,
} from "@/features/folders/queries";
import { FolderTree } from "@/features/folders/components/folder-tree";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/features/collaboration/components/notification-bell";
import { getPendingInvitesForUser } from "@/features/collaboration/service";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await requireUser();
  const [folders, sharedFolders, collaborations, invites] = await Promise.all([
    getAllOwnedFolders(session.user.id),
    getSharedFolders(session.user.id),
    getCollaborations(session.user.id),
    getPendingInvitesForUser(getDb(), session.user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-subtle px-4 py-2 md:hidden">
        <span className="text-lg font-semibold tracking-tight">Link</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell invites={invites} />
        </div>
      </div>
      <div className="h-10 w-full shrink-0 md:hidden" />

      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-subtle p-4 md:flex">
        <div className="mb-4 flex items-center justify-between px-2">
          <p className="text-lg font-semibold tracking-tight text-content">Link</p>
          <div className="flex items-center gap-1">
            <NotificationBell invites={invites} />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FolderTree folders={folders} shared={sharedFolders} collaborations={collaborations} />
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
