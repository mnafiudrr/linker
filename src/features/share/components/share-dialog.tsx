"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/dialog";
import { createShare, revokeShare } from "@/features/share/actions";

export type ActiveShare = {
  id: string;
  token: string;
};

export function ShareDialog({
  folderId,
  folderName,
  shares,
}: {
  folderId: string;
  folderName: string;
  shares: ActiveShare[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setError(null);
    setPending(true);
    const result = await createShare({ folderId });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function handleRevoke(shareId: string) {
    setError(null);
    setPending(true);
    const result = await revokeShare({ id: shareId });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(!open)}>
        Share
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${folderName}`}
            className="w-full max-w-md rounded-xl border border-line bg-base p-6 text-content shadow-e3"
          >
            <h2 className="mb-1 text-lg font-semibold">Share “{folderName}”</h2>
            <p className="mb-4 text-xs text-content-muted">
              Anyone with the link can view this folder and everything inside it — read-only,
              no account needed.
            </p>

            {error ? <FormError message={error} /> : null}

            {shares.length === 0 ? (
              <p className="mb-4 rounded-lg bg-subtle px-3 py-3 text-xs text-content-secondary">
                Not shared yet.
              </p>
            ) : (
              <ul className="mb-4 space-y-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center gap-2 rounded-lg border border-line p-2"
                  >
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-content-muted">
                      /share/{share.token}
                    </code>
                    <Button
                      variant="secondary"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => handleCopy(share.token)}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="danger"
                      className="h-7 shrink-0 px-2 text-xs"
                      disabled={pending}
                      onClick={() => handleRevoke(share.id)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {copied ? (
              <p role="status" className="mb-2 text-xs text-success">
                Link copied.
              </p>
            ) : null}

            <div className="flex justify-between">
              <Button variant="primary" onClick={handleCreate} disabled={pending || shares.length > 0}>
                {shares.length > 0 ? "Shared" : pending ? "Creating…" : "Create share link"}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
