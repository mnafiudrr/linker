import { z } from "zod";

export const MAX_FOLDER_DEPTH = 10;

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

export const createFolderInput = z.object({
  name: folderNameSchema,
  parentId: z.uuid().nullish(),
});

export const renameFolderInput = z.object({
  id: z.uuid(),
  name: folderNameSchema,
});

export const moveFolderInput = z.object({
  id: z.uuid(),
  newParentId: z.uuid().nullish(),
});

export const deleteFolderInput = z.object({
  id: z.uuid(),
});

export type CreateFolderInput = z.infer<typeof createFolderInput>;
export type MoveFolderInput = z.infer<typeof moveFolderInput>;
