import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
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
import { ShareDialog } from "@/features/share/components/share-dialog";
import { getActiveSharesForFolder } from "@/features/share/service";
import { LinkCard } from "@/features/links/components/link-card";
import { getCollaborators } from "@/features/collaboration/service";

const roleBadge: Record<string, string> = {
  owner: "bg-accent-peach-soft text-content-secondary",
  editor: "bg-accent-lilac-soft text-content-secondary",
  viewer: "bg-subtle text-content-muted",
};

export default async function FolderPage({
  params,
}: PageProps<"/dashboard/folder/[id]">) {
  const { id } = await params;
  const session = await requireUser();

  const [contents, breadcrumb, ownedFolders] = await Promise.all([
    getFolderContents(session.user.id, id),
    getBreadcrumb(session.user.id, id),
    getAllOwnedFolders(session.user.id),
  ]);

  if (!contents || !breadcrumb) notFound();

  const { folder, subfolders, links } = contents;

  const isOwner = contents.access === "owner";

  // Owner-only extras (shares + collaborator management).
  const [shares, collaborators] = await Promise.all([
    isOwner
      ? getActiveSharesForFolder(getDb(), session.user.id, id)
      : Promise.resolve([]),
    isOwner ? getCollaborators(getDb(), session.user.id, id) : Promise.resolve([]),
  ]);

  const canEdit = contents.access !== "viewer";
  const moveTargets = ownedFolders.map(({ id: folderId, name }) => ({ id: folderId, name }));
  void shares;

  return (
    <>
      <header className="border-b border-line px-4 py-4 md:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-2 overflow-x-auto whitespace-nowrap text-xs text-content-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link href="/dashboard" className="hover:text-content-secondary">
            My links
          </Link>
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id}>
              {" / "}
              <Link
                href={`/dashboard/folder/${crumb.id}`}
                className={
                  index === breadcrumb.length - 1
                    ? "font-medium text-content"
                    : "hover:text-content-secondary"
                }
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight md:text-2xl">
            {folder.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadge[contents.access]}`}
            >
              {contents.access === "owner" ? "owner" : `${contents.access} · shared`}
            </span>
            {canEdit ? (
              <>
                <EditFolderDialog
                  folder={{ id: folder.id, name: folder.name, parentId: folder.parentId }}
                  folders={moveTargets}
                  collaborators={
                    isOwner
                      ? collaborators.map(({ id, collaboratorEmail, role, status }) => ({
                          id,
                          email: collaboratorEmail,
                          role,
                          status,
                        }))
                      : []
                  }
                  trigger={<Button variant="ghost">Settings</Button>}
                />
                {isOwner ? (
                  <ShareDialog
                    folderId={folder.id}
                    folderName={folder.name}
                    shares={shares.map(({ id, token }) => ({ id, token }))}
                  />
                ) : null}
                <CreateFolderDialog
                  parentId={folder.id}
                  trigger={<Button variant="secondary">+ New folder</Button>}
                />
                <AddLinkDialog
                  folderId={folder.id}
                  trigger={<Button variant="primary">+ Add link</Button>}
                />
              </>
            ) : null}
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
            {canEdit ? (
              <p className="mt-1 text-xs text-content-muted">
                Add a subfolder or paste your first link.
              </p>
            ) : null}
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
                  {canEdit ? (
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
                  ) : null}
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
                    canEdit ? (
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
                    ) : undefined
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
