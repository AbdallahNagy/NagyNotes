# Handoff: Nagy Notes (blog by Abdallah Nagy)

## Overview
Nagy Notes is a personal technical blog (Dynamics 365, Power Platform, APIs, DevOps). Posts live in **nested folders of unlimited depth** and are browsed with a collapsible folder tree on the left. The top priority is a **comfortable, enjoyable reading experience**: a calm palette, a good line length, reader-controlled text settings and code blocks you can copy.

## About the design files
The files in `prototype/` are **design references built in HTML**. They show the intended look and behavior and are not production code. Rebuild them in **Astro** using its own patterns. Open `prototype/Blog App.dc.html` in a browser to click through the working prototype. It references a `_ds/…` stylesheet that is not included; that file only adds base fonts, so missing it is harmless.

- `Blog App.dc.html` is the **source of truth** (hi-fi, interactive).
- `Nagy Notes Logo.dc.html` shows the logo options; **1c was chosen**.
- `Blog Wireframes.dc.html` holds the earlier low-fi explorations, for context only.

## Fidelity
**High fidelity.** Colors, type, spacing and interactions are final. Recreate them closely.

## Decisions
| Topic | Decision |
|---|---|
| Framework | **Astro** (static output; add islands only for interactive parts) |
| Content | **Markdown/MDX files in real folders.** The folder tree is generated from the file system |
| Comments | **Supabase** (Postgres) |
| Search | **Full text**: titles, body text, headings and code |
| Hosting | Not decided. Keep the build static-host friendly (Vercel, Netlify, Cloudflare Pages and Azure SWA all work) |

---

## Content model

```
src/content/posts/
  apis/
    _folder.md                 # folder metadata (optional)
    authentication/
      _folder.md
      api-keys.md
      oauth-2-0/
        _folder.md
        what-oauth-solves.md
        client-credentials.md
  business-applications/
    microsoft-dynamics/
      custom-steps.md
      plugins/…
```

**Post front-matter**
```yaml
---
title: "The client credentials flow, end to end"
summary: "Machine-to-machine authentication: registering the client, requesting and caching tokens, and the errors you hit first."
date: 2026-10-18
order: 2            # position inside its folder (reading order); optional
tags: [oauth, security]   # optional
draft: false
---
```

**Folder metadata (`_folder.md`)**
```yaml
---
title: "OAuth 2.0"        # display name (falls back to the prettified folder name)
description: "The OAuth flows worth knowing. Read them in order."
order: 1                  # position among sibling folders
---
```

- URL = folder path + slug, e.g. `/apis/authentication/oauth-2-0/client-credentials`.
- A folder URL (e.g. `/apis/authentication`) renders the **Folder page**.
- **Read time** = word count ÷ 230 wpm, rounded up and computed at build time.
- Headings (`##`) feed the "On this page" list. Generate a slug id for each one.
- Use Astro Content Collections with a Zod schema for the front-matter above.

---

## Global layout (desktop ≥ 760px)

```
┌──────────────────────────── Header 56px ─────────────────────────────┐
├── 2px reading progress bar (post screen only) ───────────────────────┤
│ Sidebar 280px │ Main (scrolls)                        │ TOC 220px    │
│ (surface bg)  │ screen content                        │ (post only,  │
│               │ footer                                │ if room)     │
└───────────────┴───────────────────────────────────────┴──────────────┘
```
- The app is a full-viewport shell. Only **main** scrolls; header and sidebar stay fixed.
- The TOC column shows only when main is at least **1020px** wide. Otherwise it is hidden.
- **Mobile (< 760px):** no sidebar. The header gets a menu button that opens the sidebar as a **drawer** (300px, max 85% width, slides in from the left in 220ms ease, over a scrim). Posts get a fixed **bottom bar** (60px).

### Header
- 56px tall, bottom border `--line`, background `--bg`, padding `0 12px 0 16px`.
- Left: (mobile only) a 40×40 `list` icon button. Then the **logo wordmark** "Nagy Notes" in Source Serif 4, 19px, weight 600, letter-spacing −0.01em, `--ink`, followed by a period in `--accent`. Clicking it goes Home.
- Right: a **"Reading"** button (`text-aa` icon 19px + label 14px, `--ink-2`; icon only on mobile) that toggles the Reading settings popover. Then a 40×40 **theme cycle** button: icon `sun` (light), `coffee` (sepia) or `moon` (dark); clicking cycles light → sepia → dark.
- All header buttons: radius 8px, hover background `--hover`.

### Progress bar
2px tall, directly under the header, fill `--accent`. Width = scroll progress of main (0–100%). Visible on posts only; `transition: width .1s linear`.

### Sidebar ("Library")
Background `--surface`, right border `--line`.
1. **Top block** (padding 14px 12px 8px, gap 10px):
   - Row: "LIBRARY" label (11px, weight 500, letter-spacing .08em, uppercase, `--ink-3`), then a 32×32 collapse button (`caret-double-left`; on mobile `x` closes the drawer).
   - **Filter input**: 36px tall, 1px `--line` border, radius 8px, background `--bg`, `magnifying-glass` icon 15px, placeholder "Filter posts…", 14px.
2. **Scroll area** (padding 0 8px 24px):
   - **RECENT**: the last 3 opened posts (`clock-counter-clockwise` icon, title ellipsized, 14px, `--ink-2`). Hidden while filtering.
   - Section row: "FOLDERS" (or "MATCHES" while filtering) + a "Collapse all" text button (12px, `--ink-3`).
   - **Tree rows**:
     - Row: flex, gap 6px, padding `6px 8px 6px (4 + depth×16)px`, radius 6px, 14px / 1.35, hover background `--hover`.
     - Folder row: caret icon (`caret-right` closed, `caret-down` open; 12px, 16px wide, `--ink-3`), name in weight 500 `--ink`, and a **descendant post count** on the right (12px, `--ink-3`, tabular numbers).
     - Post row: blank 16px icon slot, title in `--ink-2`, weight 400. Trailing mark: filled `bookmark-simple` if bookmarked, else `check` if read ≥ 95%. Mark colour `--accent`.
     - **Active** row (the current post or folder): background `--accent-soft`, colour `--accent`.
     - Inside each folder, subfolders come first (by `order`), then posts (by `order`).
   - Filtering: a case-insensitive substring match on title + summary (in the prototype). In the real app, use the full-text search index (see Search). Results show as a flat list with the top-level folder name as the right-hand label, or "No posts match “…”." when nothing matches.
3. **Focus mode (rail):** the collapse button shrinks the sidebar to a **52px rail** (width transition 200ms) holding 36×36 icon buttons: `sidebar-simple` (expand), `magnifying-glass` (expand and focus the filter), `house` (Home).

### Footer (end of main, every screen)
Top border `--line`, padding `28px clamp(20px,5vw,56px) 40px`, 13px `--ink-3`. Contents: the **"nn." mark** (Source Serif 4, 26px, weight 500, letter-spacing −0.04em, `--ink`, period in `--accent`), "Written by Abdallah Nagy", then a right-aligned "↑ Back to top" button.

---

## Screens

### 1. Article reader (`/[...folders]/[slug]`)
**Article column**
- Centered, `max-width: calc(<measure> + 96px)` (mobile: + 40px), `box-sizing: border-box`, padding `56px 48px 96px` (mobile `32px 20px 48px`).
- Measure: Narrow **58ch**, Normal **66ch** (default), Wide **76ch**.
- Body font: **Serif** = Source Serif 4 (default), line-height 1.72. **Sans** = Inter, line-height 1.68.
- Base size: S **16.5px**, M **18px** (default), L **20px**. Mobile uses 1px less.
- Text colour `--ink`; paragraphs `margin: 0 0 1.15em`, `text-wrap: pretty`.

**Contents, top to bottom**
1. **Breadcrumb**: Inter 13px, `--ink-3`, "Home / APIs / Authentication / OAuth 2.0 /". Each part links to its folder; hover `--accent`; separators in `--line`. 18px below.
2. **Title (h1)**: 2.05em, line-height 1.15, weight 500, letter-spacing −0.015em, `text-wrap: balance`.
3. **Meta row** (Inter 13.5px, `--ink-3`, gap 8/16px, margin 18px 0 36px): "11 min read", "Oct 18, 2026", a comments count (`chat-circle` icon; scrolls to comments), then on the right a **Bookmark** button (32px tall, padding 0 12px, radius 8px, 1px border `--line`, `--ink-2`). When bookmarked: border and text `--accent`, filled icon, label "Bookmarked".
4. **Body**
   - `h2`: 1.32em, line-height 1.3, weight 500, letter-spacing −0.01em, margin 1.9em 0 .55em, scroll-margin-top 24px.
   - **Code block**: margin 1.3em 0 1.6em, 1px border `--line`, radius 8px, background `--code`.
     - Header bar: 36px tall, bottom border `--line`, language label (Inter 12px, `--ink-3`, letter-spacing .04em), and a right-aligned **Copy** button (28px, `copy` icon + "Copy"; after a click it shows `check` + "Copied" for 1.6s and copies to the clipboard).
     - `pre`: JetBrains Mono 13.5px / 1.65, padding 14px 16px 16px, horizontal scroll, tab-size 4. Syntax highlighting is not in the prototype. Add it with Shiki (built into Astro) using a quiet theme for each reading theme.
5. **Prev / Next** (Inter, margin-top 56px): a grid `repeat(auto-fit, minmax(220px,1fr))` with gap 12px. Each card has padding 14px 16px, 1px `--line` border and radius 10px; hover border `--accent`. Small label (12px `--ink-3`): "← Previous in {Folder}" / "Next in {Folder} →". Title 15px weight 500. Next is right-aligned and always sits in the right column. Order follows siblings in the same folder by `order`.
6. **Comments** (margin-top 64px): heading "Comments · N" (17px, weight 500). Each comment: a 32px circle with the initial (background `--hover`), name (weight 500) · date (`--ink-3`), text 15px / 1.6 in `--ink-2`; 22px gap between comments.
   - Composer: a box with 1px `--line` border and radius 10px; textarea (3 rows, 15px, placeholder "Add a comment…"); footer bar with a top border and a right-aligned **"Post comment"** button (34px, outlined in `--accent`, 45% opacity while empty).

**TOC column** (sticky, padding-top 64px): "ON THIS PAGE" label, then a list with a 1px left border in `--line`. Each item is 13.5px, padding 5px 0 5px 14px, colour `--ink-3`. The **active** item has a 2px `--accent` left border and `--accent` text. Below the list: "N min left" and "↑ Back to top".
- Active heading = the last `h2` whose top is ≤ 140px from the top of the scroll container.
- Clicking an item smooth-scrolls so the heading sits 24px from the top.
- "Min left" = ceil(readTime × (1 − progress)), with a minimum of 1.

**Mobile bottom bar**: 60px, top border. Contains ← (previous), "Contents · N min left" (opens a **bottom sheet** with the TOC: 16px items with dividers, radius 16px 16px 0 0, a grab handle and a scrim), and → (next). The prev/next arrows sit at 30% opacity when there is no target.

### 2. Folder page (`/[...folders]`)
Container max-width 780px, padding `56px clamp(20px,5vw,56px) 96px`.
- Breadcrumb of the ancestors (same style as on posts).
- **h1** folder title: 34px / 1.15, weight 500, letter-spacing −0.02em.
- Description: 17px / 1.6, `--ink-2`, max-width 60ch.
- **FOLDERS** (if there are subfolders; label margin 40px 0 12px): a grid `repeat(auto-fill,minmax(200px,1fr))` with gap 12px. Each card: `folder-simple` icon 20px `--accent`, name 15px weight 500, "N posts" 13px `--ink-3`; padding 14px 16px, 1px border, radius 10px, hover border `--accent`.
- **POSTS · N** row: on the right, a segmented control (1px border, radius 8px, padding 2px) with **Reading order** | **Newest**. The active segment has background `--accent-soft` and colour `--accent`, weight 500; each segment is 30px tall, 13px.
- Post list: each row has padding 20px 0 and a bottom border `--line`.
  - Number "01" (13px, `--ink-3`, tabular, 20px wide).
  - Title 18px / 1.3, weight 500 (hover `--accent`); summary 15px / 1.55 `--ink-2`; meta 13px `--ink-3`: "8 min · Oct 12, 2026 · 40% read" (or "Read").
  - A 36×36 bookmark toggle on the right.
- If the folder has no posts of its own, the list shows **all descendant posts** labelled "All posts · N", and the meta line adds the sub-path.

### 3. Home (`/`)
Container max-width 880px, padding `64px clamp(20px,5vw,56px) 96px`.
- **h1** "Notes on business apps and APIs": Source Serif 4 40px / 1.12, weight 500, letter-spacing −0.015em, max-width 18ch, balance.
- Intro (17px / 1.6, `--ink-2`, max 56ch): "By Abdallah Nagy. Practical write-ups from building on Dynamics 365, the Power Platform and REST APIs. Browse by folder on the left, or start with the latest below."
- Two cards (grid `repeat(auto-fit,minmax(260px,1fr))`, gap 12px, margin-top 40px; padding 18px, 1px border, radius 12px):
  - **Continue reading** (only if a recent post is 0–95% read): `book-open` label, title 17px weight 500, "Folder / path · N min left", and a 3px progress bar (track `--line`, fill `--accent`).
  - **Bookmarks · N**: up to 4 titles (15px). When empty: "Bookmark a post to keep it here."
- **BROWSE FOLDERS** (margin-top 56px): a grid `repeat(auto-fill,minmax(240px,1fr))` of the top-level folders. Each card shows the name (17px, 500), "N posts · M folders", its 3 newest post titles (14px `--ink-2`) and "Open folder →" in `--accent`.
- **LATEST**: the 5 newest posts. Each row shows the title (17px, 500), the folder path (13px `--ink-3`) and, on the right, "N min · Oct 18, 2026", with a bottom border.

---

## Interactions & behavior
- **Navigation:** opening a post expands its folder ancestors in the tree, pushes it to Recent (unique, max 3), resets scroll to the top and closes the drawer.
- **Folder rows:** clicking the caret toggles expansion only; clicking the label opens the folder page. Clicking the label of the already-open folder toggles it.
- **Reading settings popover** (anchored top-right under the header, 300px wide, radius 12px, 1px border, shadow `0 10px 32px var(--shadow)`, padding 16px, gap 16px):
  - Title "Reading settings" and a close (×) button.
  - Four segmented groups: **Text size** (A− / A / A+), **Line width** (Narrow / Normal / Wide), **Font** (Serif / Sans), **Theme** (Light / Sepia / Dark).
  - Footnote "Saved on this device."
- **Persistence (localStorage):** reading prefs, bookmarks, recent posts and per-post read % (the maximum reached). Theme default: respect `prefers-color-scheme` on first visit (dark → Dark, else **Light**), then the saved choice.
- **Avoid a theme flash:** set `data-theme` on `<html>` with an inline script in `<head>` before first paint.
- **Loader:** on the first page load, a full-screen `--bg` overlay shows a centered "nn." (Source Serif 4, 72px, weight 500, letter-spacing −0.04em) with the period bouncing (`nnDot`: 1s ease-in-out infinite; at 50% opacity .25 and translateY(−6px)). It fades out (opacity, .4s) after content is ready, with a maximum of about 1.1s. Show it only on the first visit of a session, never on client-side navigation. Respect `prefers-reduced-motion` by skipping the bounce.
- **Focus states:** `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`. Text selection uses an accent tint.
- **Hover:** buttons and rows use the `--hover` background; cards change to an `--accent` border; titles change to `--accent` text.
- **Responsive:** the TOC is hidden below 1020px of main width; below 760px viewport you get the drawer, bottom bar and mobile paddings.

## Comments (Supabase)
Table `comments`:
```sql
id uuid primary key default gen_random_uuid(),
post_slug text not null,          -- full path slug
author_name text not null,
body text not null check (char_length(body) between 1 and 4000),
created_at timestamptz default now(),
approved boolean default true     -- set the default to false if you want moderation
```
- RLS: anyone can `select` where `approved`; anyone can `insert` (rate-limit via an edge function or captcha); only the owner can `update`/`delete`.
- The prototype uses "You" as the author name. In production, ask for a name (optionally sign in with GitHub through Supabase Auth to cut spam).
- Load comments client-side in an Astro island on the post page; show "Comments · N" in the meta row once loaded.

## Search (full text)
- At build time, index the title, summary, headings, body text **and code blocks**. **Pagefind** fits a static Astro site; alternatively, use Postgres full-text search in Supabase.
- The sidebar filter input queries the index. Results show as a flat list (title + top-level folder); optionally add a ⌘K dialog with result snippets and matches highlighted.

---

## Design tokens

### Themes (apply via `[data-theme]` on `<html>`)
| Token | Light (default) | Sepia | Dark |
|---|---|---|---|
| `--bg` (page/article) | `#FAF8F3` | `#F4ECD8` | `#1E1F24` |
| `--surface` (sidebar) | `#F4F1E9` | `#EEE4CD` | `#1A1B20` |
| `--ink` (body text) | `#2B2B2B` | `#3B3026` | `#D6D6D6` |
| `--ink-2` (secondary) | `#55524C` | `#5A4C3E` | `#B0B0B8` |
| `--ink-3` (meta/labels) | `#716E67` | `#6E5F4B` | `#8E8E97` |
| `--line` (borders) | `#E4DFD4` | `#DCCFB2` | `#32333A` |
| `--code` (code bg) | `#F2EFE7` | `#EBE0C8` | `#26272E` |
| `--accent` | `#3A5BA0` | `#8A4B2A` | `#A9B4F5` |
| `--accent-soft` | `#E5EBF6` | `#EADAC3` | `#2C3150` |
| `--hover` | `#ECE8DF` | `#E7DBC1` | `#2A2B32` |
| `--shadow` | `rgba(60,45,20,.14)` | `rgba(70,45,15,.16)` | `rgba(0,0,0,.45)` |
| `--scrim` | `rgba(30,25,15,.28)` | `rgba(40,25,10,.3)` | `rgba(0,0,0,.5)` |

No pure black or white. Body text passes WCAG AA in every theme.

### Typography
- **Source Serif 4** (400/500/600): article body (default), titles, logo.
- **Inter** (400/500/600): UI, meta, sans reading option.
- **JetBrains Mono** (400/500): code.
- UI scale: 11px uppercase labels (letter-spacing .08em, weight 500) · 12–13px meta · 14px UI and tree · 15px card titles · 17–18px list titles · 34px folder h1 · 40px home h1.
- Heading weight is **500** throughout (no bold headings).

### Radius, spacing, motion
- Radius: 6px (rows, small buttons) · 8px (buttons, inputs, code blocks) · 10px (cards, list cards) · 12px (home cards, popover) · 16px (mobile sheet top).
- Common spacing: 4 / 6 / 8 / 12 / 16 / 20 / 24 / 40 / 56 / 64px.
- Motion: sidebar width 200ms ease · drawer 220ms ease · loader fade 400ms · copy confirmation 1.6s.

## Assets
- **Logo (chosen option 1c):** text wordmark, no image needed.
  - Header: "Nagy Notes" + "." in `--accent` (Source Serif 4, 600).
  - Mark: "nn." (Source Serif 4, 500, letter-spacing −0.04em, period in `--accent`), used in the footer and the loader.
- **Favicon:** `assets/favicon.svg`. Export PNG fallbacks (32, 180 apple-touch) during the build.
- **Icons:** Phosphor Icons (`@phosphor-icons/web` or `astro-icon` with the `ph` set). Used: list, text-aa, sun, coffee, moon, caret-right, caret-down, caret-double-left, x, magnifying-glass, clock-counter-clockwise, bookmark-simple (regular and fill), check, sidebar-simple, house, chat-circle, copy, arrow-left, arrow-right, arrow-up, folder-simple, book-open, list-bullets.
- Sample article copy in the prototype ("The client credentials flow, end to end", "Writing custom workflow steps") can be used as seed content.

## Files
- `prototype/Blog App.dc.html`: interactive hi-fi prototype (open in a browser; `support.js` must sit next to it). Tweaks: theme, layout (desktop/mobile), start screen, loader on/off.
- `prototype/Nagy Notes Logo.dc.html`: logo options (1c chosen).
- `prototype/Blog Wireframes.dc.html`: low-fi explorations (context only).
- `assets/favicon.svg`: favicon.
