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

Brand color: **Baby Blue** (`#89CFF0`) — a soft, calm pastel. Because baby blue is light, primary surfaces pair it with **deep navy text** (`#0C2D42`) instead of white to keep AA+ contrast. The full ramp below supports hover/active states in both themes.

### Brand / Accent — Light Theme

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#EFF9FE` | Subtle highlights, badges, empty-state icon circles |
| `primary-100` | `#D9F0FB` | Selected row/card background |
| `primary-200` | `#BCE3F7` | Hover on selected items, soft borders |
| `primary-300` | `#89CFF0` ★ brand core | Primary button bg, active nav bg, focus rings |
| `primary-400` | `#5FB4E0` | Primary button hover, links on light bg |
| `primary-500` | `#3E97C9` | Active/pressed states |
| `primary-600` | `#2C7CAD` | Text links (AA on white), strong accents |
| `primary-700` | `#1F6188` | Deep accent text, pressed link states |
| `on-primary` | `#0C2D42` | Text/icons on any baby-blue surface (contrast ≈ 9:1) |

### Neutrals — Light Theme

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#FFFFFF` | Page background |
| `bg-subtle` | `#F5FAFD` (blue-tinted) | Sidebar, cards-on-hover, section backgrounds |
| `border-default` | `#DBE7EF` (blue-tinted) | Dividers, card borders, inputs |
| `text-primary` | `#10222E` (navy-tinted) | Headings, primary text |
| `text-secondary` | `#43586A` | Descriptions, metadata |
| `text-muted` | `#8CA3B5` | Placeholders, timestamps, disabled |

### Semantic Colors — Light Theme

| Token | Hex | Usage |
|---|---|---|
| `success` | `#15803D` | Saved/toast confirmations |
| `warning` | `#B45309` | Destructive-confirm banners, expiring share notice |
| `danger` | `#DC2626` | Delete buttons, destructive hover, error text |
| `danger-bg` | `#FEF2F2` | Danger hover surfaces |
| `info` | `primary-600` (`#2C7CAD`) | Read-only banner, informational toasts |

### Dark Theme

Blue-tinted charcoal surfaces; the baby-blue core stays as accent and gains contrast against dark backgrounds.

**Brand / Accent — Dark**

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#12283A` | Subtle highlights, badges |
| `primary-100` | `#17334A` | Selected row/card background |
| `primary-200` | `#1E425E` | Hover on selected items, soft borders |
| `primary-300` | `#89CFF0` ★ brand core | Focus rings, active nav text/icons, links |
| `primary-400` | `#A6DCF6` | Link hover, emphasized accents |
| `on-primary` | `#082136` | Text/icons on baby-blue surfaces (buttons unchanged) |

**Neutrals & Semantics — Dark**

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#0A141D` | Page background |
| `bg-subtle` | `#101E2B` | Sidebar, cards-on-hover |
| `border-default` | `#1D3346` | Dividers, card borders, inputs |
| `text-primary` | `#E8F3FB` | Headings, primary text |
| `text-secondary` | `#A9C2D4` | Descriptions, metadata |
| `text-muted` | `#64829A` | Placeholders, timestamps, disabled |
| `success` | `#4ADE80` | Confirmations |
| `warning` | `#FBBF24` | Warning banners |
| `danger` | `#F87171` | Delete actions, error text |
| `danger-bg` | `#3B1214` | Danger hover surfaces |
| `info` | `#89CFF0` | Read-only banner, info toasts |

### Theme Rules

- Toggle via class strategy (`dark:` variants); default follows `prefers-color-scheme`, manual toggle post-MVP.
- **Buttons stay identical across themes**: baby-blue bg + navy `on-primary` text — passes contrast in both.
- Never hardcode hex in components — tokens only; every component must define both themes.
- Blue-tinted neutrals are mandatory: pure gray (`#F9FAFB`, `#E5E7EB`) is forbidden — all neutrals carry the same hue family as baby blue for cohesion.

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
