"use client";

import { useState } from "react";

import { tintForId } from "@/lib/utils";

export function ShareLinkImage({
  id,
  imageUrl,
  fallbackLabel,
}: {
  id: string;
  imageUrl: string | null;
  fallbackLabel: string;
}) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <span className={`text-sm font-medium text-content-muted ${tintForId(id)} h-full w-full flex items-center justify-center`}>
      {fallbackLabel}
    </span>
  );
}
