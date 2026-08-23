import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const USER_AGENT =
  "Mozilla/5.0 (compatible; LinkBot/0.1; +https://github.com/your-org/link)";
const MAX_REDIRECTS = 5;

export type UrlMetadata = {
  title?: string;
  description?: string;
  faviconUrl?: string;
  imageUrl?: string;
};

/** Hosts that must never be fetched (SSRF guard). */
function isPrivateHost(host: string): boolean {
  const hostname = host.replace(/^\[|\]$/g, "").toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return true;
  }

  // Dotted-quad or raw IPv6 literal in the URL itself.
  if (isIP(hostname)) return isForbiddenIp(hostname);

  return false;
}

function isForbiddenIp(ip: string): boolean {
  if (ip.includes(":")) {
    // IPv6: loopback, link-local fe80::/10, unique-local fc00::/7, IPv4-mapped.
    const v6 = ip.toLowerCase();
    return (
      v6 === "::1" ||
      v6.startsWith("fe8") ||
      v6.startsWith("fe9") ||
      v6.startsWith("fea") ||
      v6.startsWith("feb") ||
      v6.startsWith("fc") ||
      v6.startsWith("fd") ||
      v6.startsWith("::ffff:")
    );
  }

  const [a, b] = ip.split(".").map(Number) as [number, number, ...number[]];
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

/**
 * Resolves `hostname` and rejects when every resolved address is forbidden.
 * Returns true when at least one address is publicly routable AND none are
 * private (preventing DNS-rebinding via multi-answer responses).
 */
async function resolvesToPublicAddress(hostname: string): Promise<boolean> {
  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    return false;
  }
  if (addresses.length === 0) return false;

  return addresses.every(
    ({ address }) => isIP(address) === 0 || !isForbiddenIp(address),
  );
}

export class MetadataFetchError extends Error {}

function assertFetchableUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new MetadataFetchError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new MetadataFetchError("Only http(s) URLs are supported");
  }
  if (isPrivateHost(url.hostname)) {
    throw new MetadataFetchError("Refused to fetch a private address");
  }
  return url;
}

async function guardedFetch(rawUrl: string): Promise<string> {
  let current = assertFetchableUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await resolvesToPublicAddress(current.hostname))) {
      throw new MetadataFetchError("Refused to fetch a private address");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      });
    } catch {
      clearTimeout(timer);
      throw new MetadataFetchError("Failed to fetch the URL");
    }
    clearTimeout(timer);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      await response.body?.cancel();
      // Re-validate each redirect hop against the SSRF guards.
      current = assertFetchableUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new MetadataFetchError(`Target responded with ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("html") && !contentType.includes("xml")) {
      throw new MetadataFetchError("Target is not an HTML document");
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new MetadataFetchError("Response too large");
    }

    // Read with a hard byte cap even when content-length is missing.
    const reader = response.body?.getReader();
    if (!reader) throw new MetadataFetchError("Empty response");

    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new MetadataFetchError("Response too large");
      }
      chunks.push(value);
    }

    const merged = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(merged);
  }

  throw new MetadataFetchError("Too many redirects");
}

function absoluteUrl(base: URL, candidate: string | undefined | null): string | undefined {
  if (!candidate) return undefined;
  try {
    const resolved = new URL(candidate.trim(), base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return undefined;
    return resolved.toString();
  } catch {
    return undefined;
  }
}

export function parseHtmlMetadata(html: string, baseUrl: URL): UrlMetadata {
  const head = html.slice(0, Math.min(html.length, 200_000));

  function metaContent(...names: Array<[string, string]>): string | undefined {
    for (const [attr, value] of names) {
      const pattern = new RegExp(
        `<meta[^>]+${attr}=["']${escapeRegExp(value)}["'][^>]*>`,
        "i",
      );
      const tag = head.match(pattern)?.[0];
      if (!tag) continue;
      const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
      if (content?.trim()) return decodeEntities(content.trim());
    }
    return undefined;
  }

  const title =
    metaContent(["property", "og:title"], ["name", "twitter:title"]) ??
    head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const description =
    metaContent(["property", "og:description"], ["name", "description"], [
      "name",
      "twitter:description",
    ]) ?? undefined;
  const image = metaContent(["property", "og:image"], ["name", "twitter:image"]);
  const iconHref = head.match(
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i,
  )?.[0];
  const icon = iconHref?.match(/href=["']([^"']*)["']/i)?.[1];

  return {
    title: title || undefined,
    description,
    imageUrl: absoluteUrl(baseUrl, image),
    faviconUrl:
      absoluteUrl(baseUrl, icon) ?? absoluteUrl(baseUrl, "/favicon.ico"),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Minimal entity decoding — covers what OG tags commonly use.
function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Fetches `url` behind the SSRF guard and extracts OG/meta metadata.
 * Throws MetadataFetchError on any failure — callers fall back to manual entry.
 */
export async function fetchUrlMetadata(rawUrl: string): Promise<UrlMetadata> {
  assertFetchableUrl(rawUrl);
  const html = await guardedFetch(rawUrl);
  return parseHtmlMetadata(html, new URL(rawUrl));
}
