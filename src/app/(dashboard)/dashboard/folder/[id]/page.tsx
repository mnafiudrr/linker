import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import {
  getAllOwnedFolders,
  getBreadcrumb,
  getFolderContents,
} from "@/features/folders/queries";
import { CreateFolderDialog } from "@/features/folders/components/create-folder-dialog";
import { EditFolderDialog } from "@/features/folders/components/edit-folder-dialog";
import { AddLinkDialog } from "@/features/links/components/add-link-dialog";
import { EditLinkDialog } from "@/features/links/components/edit-link-dialog";
import { LinkCard } from "@/features/links/components/link-card";

export default async function FolderPage({
  params,
}: PageProps<"/dashboard/folder/[id]">) {
  const { id } = await params;
  const session = await requireUser();

  const [contents, breadcrumb, folders] = await Promise.all([
    getFolderContents(session.user.id, id),
    getBreadcrumb(session.user.id, id),
    getAllOwnedFolders(session.user.id),
  ]);

  if (!contents || !breadcrumb) notFound();

  const { folder, subfolders, links } = contents;
  const moveTargets = folders.map(({ id: folderId, name }) => ({ id: folderId, name }));

  return (
    <>
      <header className="border-b border-line px-4 py-4 md:px-8">
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-content-muted">
          <Link href="/dashboard" className="hover:text-content-secondary">
            Home
          </Link>
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id}>
              {" / "}
              {index === breadcrumb.length - 1 ? (
                <span className="font-medium text-content">{crumb.name}</span>
              ) : (
                <Link
                  href={`/dashboard/folder/${crumb.id}`}
                  className="hover:text-content-secondary"
                >
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{folder.name}</h1>
          <div className="flex items-center gap-2">
            <EditFolderDialog
              folder={{ id: folder.id, name: folder.name, parentId: folder.parentId }}
              folders={moveTargets}
              trigger={<Button variant="ghost">Settings</Button>}
            />
            <CreateFolderDialog
              parentId={folder.id}
              trigger={<Button variant="secondary">+ New folder</Button>}
            />
            <AddLinkDialog
              folderId={folder.id}
              trigger={<Button variant="primary">+ Add link</Button>}
            />
          </div>
        </div>
      </header>

      <section className="space-y-8 px-4 py-6 md:px-8">
        {subfolders.length === 0 && links.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-xl">
              🗂️
            </span>
            <p className="text-sm font-medium">This folder is empty.</p>
            <p className="mt-1 text-xs text-content-muted">
              Add a subfolder or paste your first link.
            </p>
          </div>
        ) : null}

        {subfolders.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {subfolders.map((subfolder) => (
              <li key={subfolder.id}>
                <div className="group relative rounded-xl border border-line bg-base p-4 transition hover:bg-subtle hover:shadow-e1">
                  <Link href={`/dashboard/folder/${subfolder.id}`} className="block">
                    <span className="text-2xl">📁</span>
                    <h3 className="mt-2 truncate text-sm font-medium" title={subfolder.name}>
                      {subfolder.name}
                    </h3>
                  </Link>
                  <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
                    <EditFolderDialog
                      folder={{
                        id: subfolder.id,
                        name: subfolder.name,
                        parentId: subfolder.parentId,
                      }}
                      folders={moveTargets}
                      trigger={
                        <Button
                          variant="ghost"
                          aria-label={`Edit ${subfolder.name}`}
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
        ) : null}

        {links.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {links.map((link) => (
              <li key={link.id}>
                <LinkCard
                  link={{
                    id: link.id,
                    url: link.url,
                    title: link.title,
                    description: link.description,
                    faviconUrl: link.faviconUrl,
                    imageUrl: link.imageUrl,
                  }}
                  actions={
                    <EditLinkDialog
                      link={{
                        id: link.id,
                        url: link.url,
                        title: link.title,
                        description: link.description,
                        faviconUrl: link.faviconUrl,
                        imageUrl: link.imageUrl,
                        folderId: link.folderId,
                      }}
                      folders={moveTargets}
                      trigger={
                        <Button
                          variant="secondary"
                          aria-label={`Edit ${link.title}`}
                          className="h-7 bg-base/90 px-2 text-xs backdrop-blur"
                        >
                          Edit
                        </Button>
                      }
                    />
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
