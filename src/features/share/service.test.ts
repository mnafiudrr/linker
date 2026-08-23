import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createFolder } from "@/features/folders/service";
import { createLink } from "@/features/links/service";
import { createShareForFolder, isValidShare, revokeShare } from "./service";
import { getShareView } from "./queries";

process.env.DATABASE_URL ??= "postgres://link:link@localhost:5432/link";

const db = getDb();

let ownerId: string;
let strangerId: string;
let rootId: string;
let childId: string;
let outsideId: string;
let token: string;

beforeAll(async () => {
  const stamp = Date.now();
  const [owner] = await db
    .insert(users)
    .values({ id: `s-${stamp}`, name: "O", email: `so${stamp}@example.com`, emailVerified: true })
    .returning();
  const [stranger] = await db
    .insert(users)
    .values({ id: `x-${stamp}`, name: "X", email: `sx${stamp}@example.com`, emailVerified: true })
    .returning();
  if (!owner || !stranger) throw new Error("failed to seed users");
  ownerId = owner.id;
  strangerId = stranger.id;

  const root = await createFolder(db, ownerId, { name: `share-root-${stamp}` });
  if (!root.ok) throw new Error(root.message);
  rootId = root.data.id;

  const child = await createFolder(db, ownerId, { name: "child", parentId: rootId });
  if (!child.ok) throw new Error(child.message);
  childId = child.data.id;

  const outside = await createFolder(db, ownerId, { name: `outside-${stamp}` });
  if (!outside.ok) throw new Error(outside.message);
  outsideId = outside.data.id;

  await createLink(db, ownerId, {
    folderId: childId,
    url: "https://example.com/shared",
    title: "Shared link",
  });

  const share = await createShareForFolder(db, ownerId, { folderId: rootId });
  if (!share.ok) throw new Error(share.message);
  token = share.data.token;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, ownerId));
  await db.delete(users).where(eq(users.id, strangerId));
});

describe("share tokens", () => {
  it("creates an unguessable 21-char token", () => {
    expect(token).toHaveLength(21);
  });

  it("renders the shared subtree for anonymous visitors", async () => {
    const view = await getShareView(token);
    expect(view?.current.name).toContain("share-root");
    expect(view?.subfolders.map((f) => f.id)).toContain(childId);
  });

  it("allows navigating into a descendant folder", async () => {
    const view = await getShareView(token, childId);
    expect(view?.current.name).toBe("child");
    expect(view?.links[0]?.title).toBe("Shared link");
  });

  it("rejects folders outside the shared subtree", async () => {
    const view = await getShareView(token, outsideId);
    expect(view).toBeNull();
  });

  it("rejects unknown and revoked tokens", async () => {
    expect(await getShareView("nonexistent-token-xyz")).toBeNull();
  });

  it("stops working after revocation", async () => {
    const shares = await import("./service").then((m) =>
      m.getActiveSharesForFolder(db, ownerId, rootId),
    );
    const active = shares[0];
    expect(active).toBeTruthy();

    const revoked = await revokeShare(db, ownerId, { id: active!.id });
    expect(revoked.ok).toBe(true);

    expect(await getShareView(token)).toBeNull();

    // Recreate for later assertions in this file order-independence.
    const recreated = await createShareForFolder(db, ownerId, { folderId: rootId });
    expect(recreated.ok).toBe(true);
    void strangerId;
    void isValidShare;
  });

  it("prevents strangers from sharing folders they do not own", async () => {
    const result = await createShareForFolder(db, strangerId, { folderId: rootId });
    expect(result).toMatchObject({ ok: false, message: "Folder not found." });
  });
});
