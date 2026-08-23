# 005 — URL Metadata Fetcher

- **Status:** done
- **Depends on:** [004]

## Goal

Server-side OG/meta scraper: on paste/create, fetch the target page and extract `og:title`, `og:description`, `og:image` (fallbacks: `<title>`, `<meta name="description">`, `/favicon.ico`) — with full SSRF protection and graceful failure.

## Checklist

- [ ] Implement `src/lib/metadata-fetcher.ts`: scheme allowlist, DNS resolve → reject private/reserved IPs (loopback, 169.254/16 incl. metadata endpoints, RFC1918, ULA), re-validate every redirect hop, 10 s timeout, 2 MB body cap
- [ ] HTML meta parser (lightweight; no headless browser)
- [ ] Expose `POST /api/links/metadata` returning `{title?, description?, favicon_url?, image_url?}` or empty object on failure
- [ ] Wire into link-create form: auto-fill fields, still fully editable before save
- [ ] "Re-fetch" affordance on link edit
- [ ] Unit tests: parser fixtures; SSRF guard rejects internal addresses

## Acceptance Criteria

- [ ] GitHub-style OG page auto-fills title/description/image correctly
- [ ] Requests to `127.0.0.1`, `10.x`, `169.254.169.254` are blocked
- [ ] Fetch failure never blocks saving a link manually

## Notes

Flow reference: `docs/diagrams/url-metadata-flow.puml`. Security spec: PRD FR-09.
