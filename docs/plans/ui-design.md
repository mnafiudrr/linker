# UI/UX Design Guide — Link

> Visual language and interaction standards for the Link web app. Binding for all UI work (tasks 006–008). Implemented with Tailwind CSS v4 — values below map to Tailwind theme tokens.

- **Version:** 0.1.0
- **Status:** Draft

---

## 1. Design Principles

1. **Content-first** — links and folders are the heroes; chrome stays quiet.
2. **Calm & trustworthy** — soft neutrals, one accent, generous whitespace.
3. **Familiar patterns** — gdrive-like navigation; no novel interaction paradigms.
4. **Readable everywhere** — WCAG 2.1 AA contrast minimum (4.5:1 body text).
5. **Responsive mobile-first** — single-column base, sidebar becomes drawer on small screens.

## 2. Color System

Brand palette (issue #2): **Sky Blue `#67AEEE`** (primary) · **Soft Lilac `#FBD3FF`** (selected/secondary accent) · **Soft Peach `#FFDBD0`** (warm accent/warning surfaces) · **Light Baby Blue `#D4EEFF`** (surface tint). Sky Blue is light enough that primary surfaces pair it with **deep navy text** (`on-primary`) for AA+ contrast.

### Brand / Accent — Light Theme

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#EFF7FE` | Subtle highlights, badges, empty-state icon circles |
| `primary-100` | `#DDF0FD` | Selected row/card background |
| `primary-200` | `#C2E4FC` | Hover on selected items, soft borders |
| `primary-300` | `#67AEEE` ★ Sky Blue | Primary button bg, active nav bg, focus rings |
| `primary-400` | `#4E97DB` | Primary button hover |
| `primary-500` | `#357DC2` | Active/pressed states |
| `primary-600` | `#2563A6` | Text links (AA on white), strong accents |
| `primary-700` | `#1B4C82` | Deep accent text, pressed link states |
| `on-primary` | `#0B2440` | Text/icons on any sky-blue surface |

### Neutrals — Light Theme (tinted toward Light Baby Blue)

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#FFFFFF` | Page background |
| `bg-subtle` | `#EEF8FE` | Sidebar, cards-on-hover, section backgrounds |
| `border-default` | `#CFE6F7` | Dividers, card borders, inputs |
| `text-primary` | `#10243A` | Headings, primary text |
| `text-secondary` | `#40556B` | Descriptions, metadata |
| `text-muted` | `#8598AC` | Placeholders, timestamps, disabled |

### Semantic & Secondary Accents — Light Theme

| Token | Hex | Usage |
|---|---|---|
| `success` | `#15803D` | Saved/toast confirmations |
| `warning` / `warning-bg` | `#9A3412` on **`#FFDBD0` Soft Peach** | Destructive-confirm banners, expiring share notice |
| `danger` / `danger-bg` | `#DC2626` / `#FEF2F2` | Delete buttons, destructive hover, error text |
| `info` | `primary-600` (`#2563A6`) | Read-only banner, informational toasts |
| `accent-lilac(-soft)` | **`#FBD3FF`** (`#FDEFFD`) | Selected states, badges, decorative highlights |
| `accent-peach(-soft)` | **`#FFDBD0`** (`#FFF4EF`) | Warm highlights, share indicators |

### Dark Theme

Blue-charcoal surfaces; anchors stay recognizable and gain contrast.

| Token | Hex (dark) | Light counterpart note |
|---|---|---|
| `primary-50..200` | `#122436` / `#17324C` / `#1E4263` | Selected/hover surfaces |
| `primary-300` | `#67AEEE` ★ | Focus rings, active nav, links |
| `primary-400` | `#8CC5F5` | Link hover, emphasized accents |
| `on-primary` | `#081C33` | Text on sky-blue surfaces (buttons unchanged) |
| `bg-base` / `bg-subtle` | `#0A141E` / `#0F1E2C` | Page/sidebar backgrounds |
| `border-default` | `#1C3145` | Dividers, borders, inputs |
| `text-primary/secondary/muted` | `#E9F3FB` / `#A6BED4` / `#63809A` | Text tiers |
| `success` / `warning` / `danger` | `#4ADE80` / `#FFB380` / `#F87171` | Semantic brightened |
| `warning-bg` / `danger-bg` | `#3B241B` / `#3B1214` | Banner/error surfaces |
| `accent-lilac(-soft)` | `#FBD3FF` (`#37203B`) | Badges/highlights |
| `accent-peach(-soft)` | `#FFDBD0` (`#3B241B`) | Warm highlights |

### Theme Rules

- Theme is class-based: `.dark` on `<html>` toggles the palette (see issue #3); default is **light**.
- **Buttons stay identical across themes**: sky-blue bg + navy `on-primary` text — passes contrast in both.
- Never hardcode hex in components — tokens only; every component must define both themes.
- All neutrals carry the same hue family as the brand anchors; pure gray is forbidden.

## 3. Typography

Font: **Inter** (system fallback: `-apple-system, "Segoe UI", sans-serif`). Mono for URLs/code: **JetBrains Mono**.

| Role | Token | Size/Weight/Line-height |
|---|---|---|
| Display (page titles) | `text-2xl font-semibold tracking-tight` | 24px / 600 / 32px |
| Section heading | `text-lg font-semibold` | 18px / 600 / 28px |
| Body | `text-sm font-normal` | 14px / 400 / 20px |
| Card title (link title) | `text-sm font-medium truncate` | 14px / 500, single line ellipsis |
| Metadata/caption | `text-xs font-normal` | 12px / 400 / 16px |
| URL display | `text-xs text-muted truncate` + mono | 12px mono, ellipsis |

Rules:
- Max content measure ~72ch for description paragraphs.
- Never more than 2 weights visible per view (400 + 500/600).
- Link titles always `truncate`; full title shown via `title` attribute.

## 4. Shape & Elevation

### Border Radius

| Element | Radius | Token |
|---|---|---|
| Buttons, inputs, badges, tooltips | 8px | `rounded-lg` |
| Cards, dialogs, dropdown panels | 12px | `rounded-xl` |
| Avatars, favicons, thumbnails wrapper | 8px (`rounded-lg`) or full for avatars | `rounded-full` |
| Page-level containers | 0 (flush) | none |

Rule: nothing above 12px except circles; sharp corners nowhere inside content area.

### Shadows / Elevation

| Level | Shadow | Used by |
|---|---|---|
| 0 | none | Cards at rest (use border instead) |
| 1 | `0 1px 2px rgb(0 0 0 / 0.05)` | Hovered card, sticky header |
| 2 | `0 4px 12px rgb(0 0 0 / 0.10)` | Dropdowns, popovers |
| 3 | `0 16px 48px rgb(0 0 0 / 0.20)` | Dialogs, command palette |

Prefer borders over shadows for resting state; shadow communicates interactivity/elevation only.

## 5. Spacing & Grid

- Base unit: **4px**; use Tailwind scale (`gap-2` = 8px, `p-4` = 16px…).
- Layout: sidebar 256px fixed (collapsible ≤ 1024px → icon rail 56px); main content max-width 1200px centered with `px-4 md:px-8`.
- Vertical rhythm: page header → toolbar → content list, separated by 24px (`space-y-6`).
- Card internal padding 16px; list rows padding 12px vertical.
- Touch targets ≥ 40×40px on all interactive elements (mobile).

## 6. Iconography

- Library: **Lucide** (matches shadcn/ui ecosystem), stroke 1.5px, size 16px inline / 20px standalone.
- Icons always paired with a label in buttons; standalone icon-only buttons require `aria-label` + tooltip.
- Folder = `folder`/`folder-open`, link = favicon when available else `link`, share = `share-2`, delete = `trash-2`.

## 7. Core Components Spec

### Buttons

| Variant | Style |
|---|---|
| Primary | `primary-300` (baby blue) bg + `on-primary` navy text, radius 8px, height 36px (sm: 32px); hover `primary-400` |
| Secondary | `bg-base` bg, `border-default`, `text-primary`; `bg-subtle` on hover |
| Ghost | transparent, `text-secondary`; `bg-subtle` on hover (toolbar actions) |
| Danger | `danger` text/border ghost-style; solid red reserved for final confirm step |

States: hover darken one ramp step, active scale 0.98, focus-visible 2px `primary-300` ring offset 2px (dark: `primary-400`), disabled 50% opacity + `cursor-not-allowed`.

### Cards (link/folder item)

- White bg, 1px `border-default`, radius 12px, padding 16px, level-0 shadow.
- Contents: favicon/thumbnail (64px, rounded 8px, object-cover) · title (medium, truncate) · URL (mono muted, truncate) · description (2-line clamp).
- Hover: `bg-subtle` + level-1 shadow; click opens link (new tab) or folder.
- Row action menu (kebab) appears on hover/focus — never on touch (always visible there).

### Forms & Inputs

- Height 36px, radius 8px, 1px `border-default`, `bg-base`; focus ring `primary-300` (dark: `primary-400`).
- Labels above fields, 12px medium; helper text 12px muted; errors 12px `danger` with icon.
- Validation feedback inline on blur; server action errors mapped to fields where possible.
- The "Add link" form auto-fills after URL paste (task 005) — show skeleton shimmer in title/description while fetching; user edits remain authoritative.

### Navigation

- **Sidebar tree**: indent 16px per depth level, chevron rotate on expand, active folder `primary-100` bg + `on-primary` text (light) / `primary-100` bg + `primary-300` text (dark).
- **Breadcrumbs**: `/` separators, current crumb semibold non-link, overflow collapses middle crumbs ("…").
- **Toolbar**: breadcrumb left, primary actions right ("+ New folder", "+ Add link", Share).

### Feedback

| Pattern | Spec |
|---|---|
| Toast | Bottom-right, radius 12px, level-3 shadow, auto-dismiss 4 s; success/info/danger variants |
| Loading | Route-level skeletons matching card shapes (never spinners for lists) |
| Empty state | Centered illustration-lite (icon in `bg-subtle` circle), one-line message, one primary CTA |
| Destructive confirm | Dialog naming the item and stating cascade consequence explicitly ("This will delete 3 folders and 12 links") |
| Read-only banner (share view) | Full-width `info` strip top of content, dismissible, icon + "You're viewing a read-only shared folder" |

## 8. Motion

- Durations: 150 ms (hover/state), 200 ms (menus/popovers), 250 ms (dialogs/sheets).
- Easing: `ease-out` enter, `ease-in` exit.
- Allowed: opacity, transform (translate/scale). No layout-animating properties.
- Respect `prefers-reduced-motion`: reduce to instant/disabled transitions.

## 9. Accessibility Checklist

- [ ] Semantic landmarks: `nav`, `main`, `header`; skip-to-content link
- [ ] Full keyboard support: tree navigation (arrows), dialog focus trap, Esc closes
- [ ] Focus-visible ring on every interactive element
- [ ] AA contrast verified for both themes (tokens above pre-checked)
- [ ] Icon-only controls have accessible names
- [ ] Share view announces read-only status to screen readers (`role="status"`)

## 10. Asset & Content Rules

- Favicons/OG images: render remote URL directly; fallback chain favicon → `link` icon placeholder; never hotlink-broken images (onError swap).
- Date formatting: relative ("2h ago") under 7 days, absolute after.
- Empty URL thumbnails get deterministic tinted background derived from link id hash (subtle, from accent/neutrals only).
- Truncation policy: titles 1 line, descriptions 2 lines, URLs 1 line — all with tooltip fallback.
