"use client";

import { useState } from "react";

import { tintForId } from "@/lib/utils";
import type { LinkCardData } from "./link-card-data";

function Favicon({ link }: { link: LinkCardData }) {
  const [failed, setFailed] = useState(false);

  if (link.faviconUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={link.faviconUrl}
        alt=""
        width={16}
        height={16}
        onError={() => setFailed(true)}
        className="h-4 w-4 rounded"
      />
    );
  }
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded bg-subtle text-[9px] text-content-muted">
      🔗
    </span>
  );
}

export function LinkCard({
  link,
  actions,
}: {
  link: LinkCardData;
  actions?: React.ReactNode;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const domain = (() => {
    try {
      return new URL(link.url).hostname;
    } catch {
      return link.url;
    }
  })();

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-base transition hover:bg-subtle hover:shadow-e1">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-col">
        <div className={`flex h-32 items-center justify-center ${tintForId(link.id)}`}>
          {link.imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={link.imageUrl}
              alt=""
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-content-muted">{domain}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <div className="flex items-center gap-2">
            <Favicon link={link} />
            <h3 title={link.title} className="min-w-0 truncate text-sm font-medium">
              {link.title}
            </h3>
          </div>
          <p title={link.url} className="truncate font-mono text-xs text-content-muted">
            {link.url}
          </p>
          {link.description ? (
            <p className="line-clamp-2 text-xs text-content-secondary">{link.description}</p>
          ) : null}
        </div>
      </a>
      {actions ? (
        <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
