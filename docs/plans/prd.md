# PRD — Link

> Product Requirements Document for **Link**: a self-hosted web app to organize URLs into folders and share them publicly, read-only.

- **Version:** 0.1.0 (MVP)
- **Status:** Draft
- **Date:** 2026-08-23
- **Owner:** Nafiu

---

## 1. Overview

**Link** is a self-hosted bookmark/URL organizer with a Google Drive–like folder structure. Users can save URLs into nested folders, enrich each link with a title, description, and automatically fetched metadata (Open Graph / meta tags), then share entire folders — including all sub-folders — via a public read-only URL that anyone can open without an account.

## 2. Goals & Objectives

| # | Objective | Priority |
|---|-----------|----------|
| G1 | Organize URLs in nested folders (directory-like, gdrive-style) | P0 |
| G2 | Add title & description to each link; auto-fetch metadata from the URL | P0 |
| G3 | Share a folder via public link; anonymous visitors get read-only access to it **and all descendant folders/links** | P0 |
| G4 | Self-hostable via Docker Compose (single command deploy) | P0 |

### Non-goals (v1 / MVP)

- Multi-user collaboration or edit permissions on shared folders
- Tags, full-text search, or smart collections
- Browser extension
- Import/export (bookmarks HTML, CSV)
- Link health checking / archive snapshots
- Thumbnails stored locally (only remote OG images referenced)

These are candidates for v2+.

## 3. Target Users & Personas

1. **Curator (authenticated user)** — wants to collect, categorize, and annotate web links; shares curated collections publicly.
2. **Visitor (anonymous)** — receives a share link, browses the folder tree read-only, clicks through to target URLs. No account required.

## 4. User Stories

### Curator

| ID | Story |
|----|-------|
| US-01 | As a curator, I can sign up with email + password and sign in securely. |
| US-02 | As a curator, I can create folders and sub-folders to any depth. |
| US-03 | As a curator, I can rename, move, and delete folders (delete cascades to children after confirmation). |
| US-04 | As a curator, I can add a link by pasting a URL into a folder. |
| US-05 | When I paste a URL, the system auto-fetches its title, description, favicon, and preview image from OG/meta tags, which I can edit before saving. |
| US-06 | As a curator, I can edit a link's title, description, and URL at any time. |
| US-07 | As a curator, I can delete links and move them between folders. |
| US-08 | As a curator, I can browse my folders with breadcrumbs and see folder contents as cards/list. |
| US-09 | As a curator, I can generate a share link for any folder. |
| US-10 | As a curator, I can revoke (disable) a share link. |

### Visitor

| ID | Story |
|----|-------|
| US-11 | As a visitor, I can open a shared link without an account. |
| US-12 | As a visitor, I can navigate the shared folder and all of its sub-folders read-only. |
| US-13 | As a visitor, I can see each link's title, description, and thumbnail, and click to visit the target URL. |
| US-14 | As a visitor, I cannot modify, add, or delete anything; no owner data is exposed (only the shared subtree). |

## 5. Functional Requirements

### 5.1 Folders

| ID | Requirement |
|----|-------------|
| FR-01 | Folders belong to exactly one user; have `name` and optional parent → form an n-ary tree. |
| FR-02 | Max depth: 10 levels (validated on create/move). |
| FR-03 | Folder names must be unique among siblings (case-insensitive). |
| FR-04 | Moving a folder into its own descendant is rejected (cycle prevention). |
| FR-05 | Deleting a folder deletes its descendants and contained links (soft-delete not required for MVP; confirmation dialog required). |

### 5.2 Links

| ID | Requirement |
|----|-------------|
| FR-06 | Links live inside exactly one folder; fields: `url`, `title`, `description`, `favicon_url`, `image_url`, `metadata_fetched_at`. |
| FR-07 | URLs must be valid http(s). |
| FR-08 | On paste/create, metadata is fetched server-side from OG tags (`og:title`, `og:description`, `og:image`) falling back to `<title>`, `<meta name="description">`, `/favicon.ico`. |
| FR-09 | Fetch must respect SSRF protections: block private/internal IP ranges, non-http(s) schemes, redirects re-validated, timeout ≤ 10 s, max body size ≤ 2 MB. |
| FR-10 | If fetching fails, the user can still save the link manually (title required). |

### 5.3 Sharing

| ID | Requirement |
|----|-------------|
| FR-11 | A share record targets one folder and has an unguessable random token (≥ 128-bit entropy, nanoid). |
| FR-12 | Public route `/share/[token]` renders the shared folder's contents and full subtree, read-only. |
| FR-13 | Share scope = the shared folder **and every descendant folder/link**, resolved recursively server-side. |
| FR-14 | Shares can be revoked; optionally expire (`expires_at`). |
| FR-15 | Anonymous access must never expose other users' data or the existence of sibling folders outside the shared subtree. |

### 5.4 Auth

| ID | Requirement |
|----|-------------|
| FR-16 | Email + password authentication via Better Auth; sessions via secure HTTP-only cookies. |

## 6. UX Overview

- **Dashboard** (`/dashboard`): root folders + links grid/list; sidebar tree; breadcrumb navigation.
- **Folder view** (`/dashboard/folder/[id]`): same layout scoped to folder; actions: new folder, new link, rename, delete, share.
- **Share view** (`/share/[token]`): identical browsing UI, all mutations hidden, "read-only" banner.
- Empty states for: no folders, empty folder, invalid/expired share token.
- Responsive (mobile-first acceptable).

## 7. Acceptance Criteria (MVP Exit)

- [ ] User can register, log in, log out.
- [ ] User can build a ≥ 3-level folder tree and CRUD links within it.
- [ ] Pasting a known OG-enabled URL (e.g., a GitHub repo) auto-fills title/description/image.
- [ ] Share link works in incognito browser with zero account interaction, showing the whole subtree read-only.
- [ ] Revoked share returns 404-style page.
- [ ] SSRF guard blocks requests to `127.0.0.1`, `169.254.x.x`, `10.x`, etc.
- [ ] `docker compose up -d` starts app + Postgres, migrations applied automatically.

## 8. Success Metrics (post-MVP)

- Time-to-save-link < 5 s including metadata fetch.
- Metadata fetch success rate > 80% on popular sites.
- Zero unauthorized-access incidents on share boundaries.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| SSRF via crafted URLs during metadata fetch | Strict scheme/IP allowlist checks, redirect re-validation, timeouts |
| Sites blocking scraper UA | Send descriptive UA header; graceful fallback to manual entry |
| Token leakage | Tokens unguessable; revocation supported; HTTPS recommended at reverse proxy |
| Deep recursion performance | Single recursive CTE query for subtree resolution |

## 10. Open Questions

- Q1: Should share links allow password protection? *(deferred to v2)*
- Q2: Should metadata refresh be manual ("re-fetch") only? *(yes for MVP)*
