import { z } from "zod";

export const linkUrlSchema = z
  .url("Enter a valid URL")
  .check((ctx) => {
    let protocol: string;
    try {
      protocol = new URL(ctx.value).protocol;
    } catch {
      return; // not a parseable URL — already reported by the url() check
    }
    if (protocol !== "http:" && protocol !== "https:") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: "Only http(s) URLs are supported",
      });
    }
  });

export const createLinkInput = z.object({
  folderId: z.uuid(),
  url: linkUrlSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).nullish(),
  faviconUrl: linkUrlSchema.nullish(),
  imageUrl: linkUrlSchema.nullish(),
});

export const updateLinkInput = z.object({
  id: z.uuid(),
  url: linkUrlSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).nullish(),
  faviconUrl: linkUrlSchema.nullish(),
  imageUrl: linkUrlSchema.nullish(),
});

export const moveLinkInput = z.object({
  id: z.uuid(),
  newFolderId: z.uuid(),
});

export const deleteLinkInput = z.object({
  id: z.uuid(),
});
