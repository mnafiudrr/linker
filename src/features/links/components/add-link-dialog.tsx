"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, Field, FormError } from "@/components/ui/dialog";
import { createLink } from "@/features/links/actions";

type FetchedMetadata = {
  title?: string;
  description?: string;
  faviconUrl?: string;
  imageUrl?: string;
};

/**
 * Fetches OG metadata for the entered URL via /api/links/metadata.
 * Never blocks saving — failures just leave the fields untouched.
 */
export function useMetadataAutofill() {
  const [fetching, setFetching] = useState(false);

  async function fetchMetadata(url: string): Promise<FetchedMetadata> {
    setFetching(true);
    try {
      const response = await fetch("/api/links/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) return {};
      return (await response.json()) as FetchedMetadata;
    } catch {
      return {};
    } finally {
      setFetching(false);
    }
  }

  return { fetching, fetchMetadata };
}

export function AddLinkDialog({
  folderId,
  trigger,
}: {
  folderId: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { fetching, fetchMetadata } = useMetadataAutofill();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState({
    url: "",
    title: "",
    description: "",
    faviconUrl: "",
    imageUrl: "",
  });

  async function handleUrlBlur() {
    if (!values.url.trim()) return;
    const metadata = await fetchMetadata(values.url.trim());
    setValues((current) => ({
      ...current,
      title: current.title || metadata.title || "",
      description: current.description || metadata.description || "",
      faviconUrl: metadata.faviconUrl ?? current.faviconUrl,
      imageUrl: metadata.imageUrl ?? current.imageUrl,
    }));
  }

  async function handleSubmit(formData: FormData, close: () => void) {
    setError(null);
    setPending(true);
    const result = await createLink({
      folderId,
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
    setValues({ url: "", title: "", description: "", faviconUrl: "", imageUrl: "" });
    close();
    router.refresh();
  }

  return (
    <Dialog title="Add link" trigger={trigger}>
      {(close) => (
        <form action={(formData) => handleSubmit(formData, close)} className="space-y-4">
          {error ? <FormError message={error} /> : null}

          <Field
            id="link-url"
            name="url"
            label="URL"
            type="url"
            placeholder="https://…"
            value={values.url}
            required
            autoFocus
            onChange={(event) => setValues({ ...values, url: event.target.value })}
            onBlur={handleUrlBlur}
          />
          {fetching ? (
            <p className="text-xs text-content-muted" role="status">
              Fetching page details…
            </p>
          ) : null}

          <Field
            id="link-title"
            name="title"
            label="Title"
            value={values.title}
            required
            onChange={(event) => setValues({ ...values, title: event.target.value })}
          />
          <Field
            id="link-description"
            name="description"
            label="Description"
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save link"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
