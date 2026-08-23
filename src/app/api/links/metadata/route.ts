import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/features/auth/session";
import { MetadataFetchError, fetchUrlMetadata } from "@/lib/metadata-fetcher";
import { linkUrlSchema } from "@/features/links/schema";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = z.object({ url: linkUrlSchema }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid URL" },
      { status: 400 },
    );
  }

  try {
    const metadata = await fetchUrlMetadata(parsed.data.url);
    return NextResponse.json(metadata);
  } catch (error) {
    if (error instanceof MetadataFetchError) {
      // Fetch failures are non-fatal for the form — return empty metadata.
      return NextResponse.json({});
    }
    throw error;
  }
}
