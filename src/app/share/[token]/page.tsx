import Link from "next/link";

import { getShareView } from "@/features/share/queries";
import { ShareLinkCard } from "@/features/links/components/share-link-card";

export const metadata = { title: "Shared folder" };

function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-subtle px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-base text-xl">
        🔒
      </span>
      <p className="text-sm font-medium">This shared link is not available.</p>
      <p className="text-xs text-content-muted">
        It may have been revoked or never existed.
      </p>
    </div>
  );
}

export default async function SharePage({
  params,
  searchParams,
}: PageProps<"/share/[token]">) {
  const { token } = await params;
  const { f: requestedFolderId } = await searchParams;

  if (typeof token !== "string" || token.length === 0) return <ShareNotFound />;

  // Only accept well-formed folder ids in the query param.
  let scopedFolderId: string | null = null;
  if (
    typeof requestedFolderId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedFolderId)
  ) {
    scopedFolderId = requestedFolderId;
  }

  const view = await getShareView(token, scopedFolderId);
  if (!view) return <ShareNotFound />;

  const shareHref = `/share/${token}`;

  return (
    <>
      <div role="status" className="bg-primary-300 px-4 py-2 text-center text-xs font-medium text-on-primary">
        You are viewing a read-only shared folder.
      </div>

      <header className="border-b border-line px-4 py-4 md:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-content-muted">
          {view.breadcrumb.map((crumb, index) => {
            const isLast = index === view.breadcrumb.length - 1;
            return (
              <span key={crumb.id}>
                {index > 0 ? " / " : ""}
                {isLast ? (
                  <span className="font-medium text-content">{crumb.name}</span>
                ) : (
                  <Link href={`${shareHref}?f=${crumb.id}`} className="hover:text-content-secondary">
                    {crumb.name}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">{view.current.name}</h1>
      </header>

      <section className="space-y-8 px-4 py-6 md:px-8">
        {view.subfolders.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {view.subfolders.map((subfolder) => (
              <li key={subfolder.id}>
                <Link
                  href={`${shareHref}?f=${subfolder.id}`}
                  className="block rounded-xl border border-line bg-base p-4 transition hover:bg-subtle hover:shadow-e1"
                >
                  <span className="text-2xl">📁</span>
                  <h3 className="mt-2 truncate text-sm font-medium" title={subfolder.name}>
                    {subfolder.name}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {view.links.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {view.links.map((link) => (
              <li key={link.id}>
                <ShareLinkCard
                  link={{
                    id: link.id,
                    url: link.url,
                    title: link.title,
                    description: link.description,
                    faviconUrl: link.faviconUrl,
                    imageUrl: link.imageUrl,
                  }}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {view.subfolders.length === 0 && view.links.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-16 text-center text-xs text-content-muted">
            This folder is empty.
          </p>
        ) : null}
      </section>
    </>
  );
}
