"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, Field, FormError } from "@/components/ui/dialog";
import { deleteFolder, moveFolder, renameFolder } from "@/features/folders/actions";

export type FolderActionsData = {
  id: string;
  name: string;
  parentId: string | null;
};

export function EditFolderDialog({
  folder,
  folders,
  trigger,
}: {
  folder: FolderActionsData;
  /** All owned folders (id + name) — used for the move target select. */
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

  async function handleRename(formData: FormData, close: () => void) {
    reset();
    setPending(true);
    const result = await renameFolder({
      id: folder.id,
      name: formData.get("name"),
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
    const raw = formData.get("newParentId");
    const result = await moveFolder({
      id: folder.id,
      newParentId: raw === "" ? null : raw,
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
    const result = await deleteFolder({ id: folder.id });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.push("/dashboard");
    router.refresh();
  }

  const moveTargets = folders.filter((f) => f.id !== folder.id);

  return (
    <Dialog title="Edit folder" trigger={trigger}>
      {(close) => (
        <div className="space-y-5">
          {error ? <FormError message={error} /> : null}

          <form action={(formData) => handleRename(formData, close)} className="space-y-3">
            <Field
              id="folder-name"
              name="name"
              label="Name"
              defaultValue={folder.name}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={pending}>
                Rename
              </Button>
            </div>
          </form>

          {moveTargets.length > 0 ? (
            <form action={(formData) => handleMove(formData, close)} className="space-y-3">
              <div>
                <label
                  htmlFor="folder-move-target"
                  className="mb-1 block text-xs font-medium"
                >
                  Move to
                </label>
                <select
                  id="folder-move-target"
                  name="newParentId"
                  defaultValue={folder.parentId ?? ""}
                  className="h-9 w-full rounded-lg border border-line bg-base px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
                >
                  <option value="">Home (root)</option>
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
              Delete folder and contents
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
