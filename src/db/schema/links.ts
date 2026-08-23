import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { folders } from "./folders";

export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    folderId: uuid("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    faviconUrl: text("favicon_url"),
    imageUrl: text("image_url"),
    metadataFetchedAt: timestamp("metadata_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("links_folder_id_idx").on(table.folderId)],
);

export type Link = typeof links.$inferSelect;
