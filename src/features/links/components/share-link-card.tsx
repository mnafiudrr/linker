import { ShareLinkImage } from "@/features/links/components/share-link-image";

export type ShareLinkCardData = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
};

export function ShareLinkCard({ link }: { link: ShareLinkCardData }) {
  const domain = (() => {
    try {
      return new URL(link.url).hostname;
    } catch {
      return link.url;
    }
  })();

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-base transition hover:bg-subtle hover:shadow-e1">
      <a href={link.url} target="_blank" rel="noopener noreferrer">
        <div className="flex h-32 items-center justify-center">
          <ShareLinkImage
            id={link.id}
            imageUrl={link.imageUrl}
            fallbackLabel={domain}
          />
        </div>
        <div className="flex flex-col gap-1 p-4">
          <h3 title={link.title} className="truncate text-sm font-medium">
            {link.title}
          </h3>
          <p title={link.url} className="truncate font-mono text-xs text-content-muted">
            {link.url}
          </p>
          {link.description ? (
            <p className="line-clamp-2 text-xs text-content-secondary">{link.description}</p>
          ) : null}
        </div>
      </a>
    </article>
  );
}
