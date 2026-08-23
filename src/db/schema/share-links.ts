import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { folders } from "./folders";

export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    token: text("token").notNull(),
    folderId: uuid("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("share_links_token_unique").on(table.token),
    index("share_links_folder_id_idx").on(table.folderId),
  ],
);

export type ShareLink = typeof shareLinks.$inferSelect;
