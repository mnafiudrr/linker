"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { respondToInvitation } from "@/features/collaboration/actions";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/dialog";

export type PendingInvite = {
  id: string;
  role: "editor" | "viewer";
  folderName: string;
  inviterName: string;
  inviterEmail: string;
};

export function NotificationBell({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function respond(id: string, accept: boolean) {
    setError(null);
    setPendingId(id);
    const result = await respondToInvitation({ id, accept });
    setPendingId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications (${invites.length} pending)`}
        onClick={() => setOpen(!open)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-base"
      >
        🔔
        {invites.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-peach px-1 text-[9px] font-semibold text-content">
            {invites.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-10 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-base p-4 shadow-e2 md:left-0 md:right-auto"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Invitations
          </p>
          {error ? <FormError message={error} /> : null}

          {invites.length === 0 ? (
            <p className="py-2 text-xs text-content-muted">No pending invitations.</p>
          ) : (
            <ul className="space-y-3">
              {invites.map((invite) => (
                <li key={invite.id} className="rounded-lg border border-line p-3">
                  <p className="text-xs text-content-secondary">
                    <span className="font-medium text-content">{invite.inviterName}</span>{" "}
                    invited you to collaborate on{" "}
                    <span className="font-medium text-content">“{invite.folderName}”</span> as{" "}
                    <span className="uppercase">{invite.role}</span>.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="primary"
                      className="h-7 px-3 text-xs"
                      disabled={pendingId === invite.id}
                      onClick={() => respond(invite.id, true)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      className="h-7 px-3 text-xs"
                      disabled={pendingId === invite.id}
                      onClick={() => respond(invite.id, false)}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
