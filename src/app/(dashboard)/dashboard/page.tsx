import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { getAllOwnedFolders } from "@/features/folders/queries";
import {
  CreateFolderDialog,
} from "@/features/folders/components/create-folder-dialog";
import { EditFolderDialog } from "@/features/folders/components/edit-folder-dialog";

export default async function DashboardPage() {
  const session = await requireUser();
  const folders = await getAllOwnedFolders(session.user.id);
  const rootFolders = folders.filter((folder) => folder.parentId === null);
  const moveTargets = folders.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 md:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <CreateFolderDialog trigger={<Button variant="primary">+ New folder</Button>} />
      </header>

      <section className="px-4 py-6 md:px-8">
        {rootFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-xl">
              📁
            </span>
            <p className="text-sm font-medium">Nothing here yet.</p>
            <p className="mt-1 text-xs text-content-muted">
              Create your first folder to start organizing links.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {rootFolders.map((folder) => (
              <li key={folder.id}>
                <div className="group relative rounded-xl border border-line bg-base p-4 transition hover:bg-subtle hover:shadow-e1">
                  <Link href={`/dashboard/folder/${folder.id}`} className="block">
                    <span className="text-2xl">📁</span>
                    <h3 className="mt-2 truncate text-sm font-medium" title={folder.name}>
                      {folder.name}
                    </h3>
                  </Link>
                  <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
                    <EditFolderDialog
                      folder={{ id: folder.id, name: folder.name, parentId: folder.parentId }}
                      folders={moveTargets}
                      trigger={
                        <Button
                          variant="ghost"
                          aria-label={`Edit ${folder.name}`}
                          className="h-7 px-2 text-xs"
                        >
                          Edit
                        </Button>
                      }
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
