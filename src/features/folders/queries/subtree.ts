import { sql } from "drizzle-orm";

import type { Database } from "@/db";

/**
 * Returns the ids of `folderId` and every descendant folder, resolved
 * recursively in a single query (see docs/plans/architecture.md §3).
 */
export async function resolveSubtreeIds(db: Database, folderId: string) {
  const rows = await db.execute<{ id: string }>(sql`
    WITH RECURSIVE subtree AS (
      SELECT id FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id
    )
    SELECT id FROM subtree
  `);
  return rows.map((row) => row.id);
}

/**
 * Depth of the ancestor chain below `folderId` counting its own level
 * (a root folder's children start at depth 1). Returns 0 when `parentId`
 * is null.
 */
export async function getFolderDepth(db: Database, parentId: string | null) {
  if (parentId === null) return 0;

  const rows = await db.execute<{ depth: number }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, 1 AS depth FROM folders WHERE id = ${parentId}
      UNION ALL
      SELECT f.id, f.parent_id, a.depth + 1
      FROM folders f JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT COALESCE(MAX(depth), 0)::int AS depth FROM ancestors
  `);
  const [row] = rows;
  return row ? Number(row.depth) : 0;
}

/**
 * Height of the subtree rooted at `folderId` (a leaf returns 0).
 * Used to validate that moves keep the whole tree within the depth limit.
 */
export async function getSubtreeHeight(db: Database, folderId: string) {
  const rows = await db.execute<{ height: number }>(sql`
    WITH RECURSIVE subtree AS (
      SELECT id, parent_id, 0 AS depth FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f.parent_id, s.depth + 1 FROM folders f JOIN subtree s ON f.parent_id = s.id
    )
    SELECT COALESCE(MAX(depth), 0)::int AS height FROM subtree
  `);
  const [row] = rows;
  return row ? Number(row.height) : 0;
}

/**
 * Ids of every ancestor above `folderId` (excluding it).
 * An empty result means the folder is a root.
 */
export async function getAncestorIds(db: Database, folderId: string) {
  const rows = await db.execute<{ id: string }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f.parent_id FROM folders f JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT id FROM ancestors WHERE id != ${folderId}
  `);
  return rows.map((row) => row.id);
}
