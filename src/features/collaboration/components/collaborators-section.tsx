"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/dialog";
import { inviteCollaborator, removeCollaborator } from "@/features/collaboration/actions";

export type CollaboratorRow = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  status: "pending" | "accepted" | "rejected";
};

const statusLabel: Record<CollaboratorRow["status"], string> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "declined",
};

export function CollaboratorsSection({
  folderId,
  collaborators,
}: {
  folderId: string;
  collaborators: CollaboratorRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleInvite(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await inviteCollaborator({
      folderId,
      email: formData.get("email"),
      role: formData.get("role"),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function handleRemove(id: string) {
    setError(null);
    const result = await removeCollaborator({ id });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
        Collaborators
      </p>
      {error ? <FormError message={error} /> : null}

      <form action={handleInvite} className="space-y-2">
        <Field
          id="collab-email"
          name="email"
          label="Invite by email"
          type="email"
          placeholder="teammate@example.com"
          required
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="collab-role" className="mb-1 block text-xs font-medium">
              Role
            </label>
            <select
              id="collab-role"
              name="role"
              defaultValue="viewer"
              className="h-9 w-full rounded-lg border border-line bg-base px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="editor">Editor (can edit)</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Invite
          </Button>
        </div>
      </form>

      {collaborators.length > 0 ? (
        <ul className="space-y-2">
          {collaborators.map((collab) => (
            <li
              key={collab.id}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs">{collab.email}</span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  collab.role === "editor"
                    ? "bg-accent-lilac-soft text-content-secondary"
                    : "bg-subtle text-content-muted"
                }`}
              >
                {collab.role}
              </span>
              <span className="shrink-0 text-[10px] text-content-muted">
                {statusLabel[collab.status]}
              </span>
              <Button
                variant="ghost"
                aria-label={`Remove ${collab.email}`}
                className="h-6 w-6 p-0 text-xs text-danger hover:bg-danger-bg"
                onClick={() => handleRemove(collab.id)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-content-muted">No collaborators yet.</p>
      )}
    </div>
  );
}
