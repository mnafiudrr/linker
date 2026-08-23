import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { folders } from "./folders";

export const collaboratorRole = pgEnum("collaborator_role", ["editor", "viewer"]);
export const collaboratorStatus = pgEnum("collaborator_status", [
  "pending",
  "accepted",
  "rejected",
]);

/**
 * Per-folder collaboration grants. Access cascades to the folder's whole
 * subtree (resolved with the same recursive CTE used by public shares).
 */
export const folderCollaborators = pgTable(
  "folder_collaborators",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    folderId: uuid("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: collaboratorRole("role").notNull(),
    status: collaboratorStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("folder_collaborators_folder_user_unique").on(table.folderId, table.userId),
    index("folder_collaborators_user_id_idx").on(table.userId),
  ],
);

export type FolderCollaborator = typeof folderCollaborators.$inferSelect;
