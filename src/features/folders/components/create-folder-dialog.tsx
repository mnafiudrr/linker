"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, Field, FormError } from "@/components/ui/dialog";
import { createFolder } from "@/features/folders/actions";

export function CreateFolderDialog({
  parentId,
  trigger,
}: {
  parentId?: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData, close: () => void) {
    setError(null);
    setPending(true);
    const result = await createFolder({
      name: formData.get("name"),
      parentId: parentId ?? null,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <Dialog title="New folder" trigger={trigger}>
      {(close) => (
        <form
          action={(formData) => handleSubmit(formData, close)}
          className="space-y-4"
        >
          {error ? <FormError message={error} /> : null}
          <Field id="new-folder-name" name="name" label="Name" required autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
