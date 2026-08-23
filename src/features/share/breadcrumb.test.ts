import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createFolder } from "@/features/folders/service";
import { createShareForFolder } from "./service";
import { getShareView } from "./queries";

process.env.DATABASE_URL ??= "postgres://link:link@localhost:5432/link";

const db = getDb();

let ownerId: string;
let privateRootId: string;
let sharedFolderId: string;
let nestedId: string;
let token: string;

beforeAll(async () => {
  const stamp = Date.now();

  const [owner] = await db
    .insert(users)
    .values({ id: `b-${stamp}`, name: "B", email: `sb${stamp}@example.com`, emailVerified: true })
    .returning();
  if (!owner) throw new Error("failed to seed user");
  ownerId = owner.id;

  // Private root → Shared (shared) → Nested
  const privateRoot = await createFolder(db, ownerId, { name: `PrivateRoot-${stamp}` });
  if (!privateRoot.ok) throw new Error(privateRoot.message);
  privateRootId = privateRoot.data.id;

  const shared = await createFolder(db, ownerId, { name: `Shared-${stamp}`, parentId: privateRootId });
  if (!shared.ok) throw new Error(shared.message);
  sharedFolderId = shared.data.id;

  const nested = await createFolder(db, ownerId, { name: "Nested", parentId: sharedFolderId });
  if (!nested.ok) throw new Error(nested.message);
  nestedId = nested.data.id;

  const share = await createShareForFolder(db, ownerId, { folderId: sharedFolderId });
  if (!share.ok) throw new Error(share.message);
  token = share.data.token;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, ownerId));
});

describe("share breadcrumb scope (issue #1 regression)", () => {
  it("starts the breadcrumb at the share root for a nested folder", async () => {
    const view = await getShareView(token, nestedId);
    expect(view).not.toBeNull();
    // The current folder itself renders as the page heading, so the
    // breadcrumb only carries ancestors up to (and including) the share root.
    expect(view?.breadcrumb.map((entry) => entry.name)).toEqual([
      expect.stringContaining("Shared-"),
    ]);
  });

  it("never exposes ancestor folders above the share root", async () => {
    const view = await getShareView(token, nestedId);
    const names = view?.breadcrumb.map((entry) => entry.name) ?? [];
    expect(names.some((name) => name.startsWith("PrivateRoot-"))).toBe(false);
  });

  it("shows only the root when viewing the share root itself", async () => {
    const view = await getShareView(token);
    expect(view?.breadcrumb).toHaveLength(1);
    expect(view?.breadcrumb[0]?.id).toBe(sharedFolderId);
  });
});
