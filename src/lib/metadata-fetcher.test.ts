import { describe, expect, it } from "vitest";

import { fetchUrlMetadata, MetadataFetchError, parseHtmlMetadata } from "./metadata-fetcher";

const BASE = new URL("https://example.com/article");

describe("parseHtmlMetadata", () => {
  it("extracts OG tags", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="My Page">
        <meta property="og:description" content="A &quot;great&quot; page">
        <meta property="og:image" content="https://cdn.example.com/img.png">
        <link rel="icon" href="/favicon-32.ico">
      </head></html>
    `;

    expect(parseHtmlMetadata(html, BASE)).toEqual({
      title: "My Page",
      description: 'A "great" page',
      imageUrl: "https://cdn.example.com/img.png",
      faviconUrl: "https://example.com/favicon-32.ico",
    });
  });

  it("falls back to <title> and meta description and default favicon", () => {
    const html = `
      <html><head>
        <title>Fallback Title</title>
        <meta name="description" content="fallback description">
      </head></html>
    `;

    expect(parseHtmlMetadata(html, BASE)).toEqual({
      title: "Fallback Title",
      description: "fallback description",
      faviconUrl: "https://example.com/favicon.ico",
      imageUrl: undefined,
    });
  });

  it("resolves relative og:image URLs against the base", () => {
    const html = `<meta property="og:image" content="/images/cover.png">`;
    const result = parseHtmlMetadata(html, BASE);
    expect(result.imageUrl).toBe("https://example.com/images/cover.png");
  });

  it("ignores javascript: image URLs", () => {
    const html = `<meta property="og:image" content="javascript:alert(1)">`;
    const result = parseHtmlMetadata(html, BASE);
    expect(result.imageUrl).toBeUndefined();
  });

  it("returns empty metadata for empty HTML", () => {
    expect(parseHtmlMetadata("", BASE)).toEqual({
      title: undefined,
      description: undefined,
      faviconUrl: "https://example.com/favicon.ico",
      imageUrl: undefined,
    });
  });
});

describe("assertFetchableUrl guards (via exported error paths)", () => {
  // assertFetchableUrl is exercised indirectly through fetchUrlMetadata,
  // which must fail fast without network for forbidden URLs.
  it.each([
    "ftp://example.com/file",
    "file:///etc/passwd",
    "http://localhost/x",
    "http://127.0.0.1/x",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/x",
    "http://192.168.1.1/x",
    "http://[::1]/x",
  ])("rejects %s without fetching", async (url) => {
    await expect(fetchUrlMetadata(url)).rejects.toBeInstanceOf(MetadataFetchError);
  });
});
