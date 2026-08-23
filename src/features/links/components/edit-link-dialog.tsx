"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, Field, FormError } from "@/components/ui/dialog";
import { deleteLink, moveLink, updateLink } from "@/features/links/actions";

export type EditLinkData = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  folderId: string;
};

export function EditLinkDialog({
  link,
  folders,
  trigger,
}: {
  link: EditLinkData;
  folders: Array<{ id: string; name: string }>;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setError(null);
    setPending(false);
  }

  async function handleUpdate(formData: FormData, close: () => void) {
    reset();
    setPending(true);
    const result = await updateLink({
      id: link.id,
      url: formData.get("url"),
      title: formData.get("title"),
      description: formData.get("description") || null,
      faviconUrl: formData.get("faviconUrl") || null,
      imageUrl: formData.get("imageUrl") || null,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.refresh();
  }

  async function handleMove(formData: FormData, close: () => void) {
    reset();
    setPending(true);
    const result = await moveLink({
      id: link.id,
      newFolderId: formData.get("newFolderId"),
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.refresh();
  }

  async function handleDelete(close: () => void) {
    reset();
    setPending(true);
    const result = await deleteLink({ id: link.id });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.refresh();
  }

  const moveTargets = folders.filter((f) => f.id !== link.folderId);

  return (
    <Dialog
      title="Edit link"
      trigger={trigger}
      contentClassName="max-h-[85vh] overflow-y-auto"
    >
      {(close) => (
        <div className="space-y-5">
          {error ? <FormError message={error} /> : null}

          <form action={(formData) => handleUpdate(formData, close)} className="space-y-3">
            <Field
              id="edit-link-url"
              name="url"
              label="URL"
              type="url"
              defaultValue={link.url}
              required
            />
            <Field
              id="edit-link-title"
              name="title"
              label="Title"
              defaultValue={link.title}
              required
            />
            <Field
              id="edit-link-description"
              name="description"
              label="Description"
              defaultValue={link.description ?? ""}
            />
            <input type="hidden" name="faviconUrl" value={link.faviconUrl ?? ""} />
            <input type="hidden" name="imageUrl" value={link.imageUrl ?? ""} />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={pending}>
                Save changes
              </Button>
            </div>
          </form>

          {moveTargets.length > 0 ? (
            <form action={(formData) => handleMove(formData, close)} className="space-y-3">
              <div>
                <label htmlFor="edit-link-move" className="mb-1 block text-xs font-medium">
                  Move to folder
                </label>
                <select
                  id="edit-link-move"
                  name="newFolderId"
                  defaultValue={link.folderId}
                  className="h-9 w-full rounded-lg border border-line bg-base px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
                >
                  {moveTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" disabled={pending}>
                  Move
                </Button>
              </div>
            </form>
          ) : null}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <Button variant="danger" onClick={() => handleDelete(close)} disabled={pending}>
              Delete link
            </Button>
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
