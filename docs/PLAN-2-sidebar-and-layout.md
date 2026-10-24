# Plan 2 — Sidebar fixes, resizable sidebar, centred pages, scrollbars

Follow-up to [`PLAN.md`](PLAN.md). Requested by the owner after using the site. Each item lists
the root cause (where known), the change, and how to verify it.

## 1. Bug: the folder tree duplicates rows and trailing marks

**Root cause (confirmed).** The Sidebar island is `transition:persist="sidebar"`. Astro's
ClientRouter copies the *new page's* props onto a persisted island unless
`transition:persist-props` is set (`shouldCopyProps` in
`node_modules/astro/dist/transitions/swap-functions.js`). The Sidebar's `initialPath` prop
differs on every page, so on each client navigation the island is re-hydrated: Preact runs
`hydrate()` against DOM that no longer matches the server state (folders the reader expanded or
collapsed, bookmark / read marks), and appends nodes instead of reusing them. Result: repeated
post rows (owner's screenshot: "Rate limiting basics / Retry policies…" ×10) and two bookmark
icons on one row.

Repro (dev or build): open a post, click "Collapse all", go Home, click a post link in the main
content (client navigation). The Folders nav now has duplicate links.

**Fix.**
- Add `transition:persist-props` to the Sidebar island in `AppLayout.astro` (it already follows
  the URL itself on `astro:page-load`). Do the same for any other persisted island that takes
  props, and audit the header islands.
- Add an e2e regression test with that exact repro, asserting the Folders nav has no duplicate
  link texts and each post row has at most one trailing mark, after several client navigations
  (home → post, post → folder via breadcrumb, folder → post via list, plus a bookmark toggle).

## 2. Resizable sidebar (desktop ≥ 760px only)

Owner decision: **drag handle; dragging narrow snaps to the existing 52px icon rail.**

> **Superseded:** the owner later dropped the icon rail. Dragging below 160px (or the hide
> button) now closes the sidebar completely, and a header button brings it back.
- A vertical drag handle on the sidebar's right edge (6–8px hit area over the 1px border;
  `cursor: col-resize`; accent-coloured line on hover/drag). `role="separator"`,
  `aria-orientation="vertical"`, `aria-valuenow/min/max`, focusable; ← / → change width by 16px,
  Home resets.
- Width range **220–480px**, default **280px**. Releasing below **180px** collapses to the rail
  (the existing `rail` state) and keeps the last valid width for when it is expanded again.
  Double-click the handle resets to 280px.
- Use pointer events with `setPointerCapture`; update a CSS custom property
  (`--sidebar-width` on `<html>`) during the drag, persist on release. No layout thrash: no React
  state updates per pointermove beyond what's needed.
- Persist width in `$sidebar` (`width: number`, validated in `parseSidebar`, clamped). The inline
  head script must apply the saved width before first paint (same as `data-rail`), and
  `document-state.ts` must carry it across swaps. Keep storage keys in `storage-keys.ts`.
- Disable the 200ms width transition while dragging.
- Hidden on mobile (drawer keeps its fixed 300px / 85vw).

## 3. Sidebar never scrolls horizontally

Owner screenshot shows a horizontal scrollbar under the tree. Make every sidebar region
`overflow-x: hidden` / `min-width: 0` so long titles always ellipsize, at any width
(including 220px), in tree, flat, Recent and search lists. Add an e2e assertion:
`scrollWidth <= clientWidth` for the sidebar scroll area at 220px and 280px.

## 4. Tree controls: Expand one level / Collapse all / Flat view

Owner decisions: **two buttons** and **flat list newest first with folder label**.

Replace the single "Collapse all" text button in the FOLDERS section row with a small group of
32px icon buttons (with `aria-label` + `title`), right-aligned:
- **Expand one level** (`arrows-out-simple` or `caret-circle-down`; pick a Phosphor icon and add
  it to `scripts/generate-icons.mjs`, then regenerate). Opens every folder at the shallowest
  depth that still has a closed folder (i.e. depth 0 first, then depth 1, …). Disabled when
  everything is open.
- **Collapse all** (`arrows-in-simple` or similar). Disabled when nothing is open.
- **View toggle: Tree | Flat** (`tree-structure` / `list` icons, `aria-pressed`). Persisted in
  `$sidebar` (`view: 'tree' | 'flat'`). In Flat view the section label reads "ALL POSTS · N",
  expand/collapse buttons are hidden, and every post is listed newest first with its top-level
  folder name on the right (reuse the SearchResults row styling/component; extract a shared
  `PostListRow` if that keeps things DRY). Active row, bookmark/read marks work the same as in
  the tree. While filtering, the controls are hidden (as now).
- Pure logic goes in `src/lib/content/sidebar-tree.ts` with unit tests:
  `folderIdsAtDepth(tree, depth)`, `nextExpandDepth(tree, expanded) → number | null`,
  `flatPostsNewestFirst(index)`. Store actions in `library-state.ts`
  (`expandNextLevel(tree)`, `setSidebarView(view)`), unit-tested.

## 5. Centre the Home and Folder pages

Home (max 880px) and Folder (max 780px) containers are currently left-aligned inside `<main>`.
Centre them with `margin-inline: auto` like the article column (keep the existing paddings and
content-box sizing). Same for 404. Update screenshots/e2e if any assert positions.

## 6. Themed scrollbars (all themes)

Scrollbars are unstyled (bright white track in sepia on code blocks and the sidebar). Add to
`tokens.css` a per-theme `--scrollbar-thumb` / `--scrollbar-track` (derive from existing tokens:
thumb ≈ `--line` darkened / `--ink-3` at low alpha, track transparent) and in `base.css`:
- `* { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track); }`
- a `::-webkit-scrollbar*` fallback (8px, rounded thumb, transparent track) for older engines.
Verify visually for code blocks, sidebar and main in light, sepia and dark.

## Process

- Gate after the work: `pnpm lint && pnpm format:check && pnpm check && pnpm test && pnpm build`,
  then the full e2e suite (desktop + mobile). Update existing tests that reference
  "Collapse all" text.
- Small focused commits (`fix:` for 1 and 3, `feat:` for 2 and 4, `style:` for 5 and 6).
- Update the README "Writing posts"/features notes only where behaviour is user-visible.
