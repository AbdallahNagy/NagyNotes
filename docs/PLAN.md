# Nagy Notes — Implementation Plan

Source of truth for look and behaviour: [`docs/design/README.md`](design/README.md) and the
interactive prototype `docs/design/prototype/Blog App.dc.html` (open it in a browser; its data
and article copy live in the `<script type="text/x-dc">` block near line 352). This plan says
**how** to build it; the handoff says **what** it looks like. When the two disagree on a visual
detail, the handoff wins.

## 0. Decisions (confirmed with the owner)

| Topic | Decision |
|---|---|
| Framework | Astro (latest, currently 7.x), `output: 'static'` |
| Islands | **Preact** (`@astrojs/preact`) for stateful UI; shared client state via **nanostores** (`nanostores`, `@nanostores/preact`, `@nanostores/persistent`) |
| Navigation | Astro `<ClientRouter />` (view transitions) so the header and sidebar persist across pages |
| Content | Markdown in `src/content/posts/**`, nested folders, `_folder.md` metadata |
| Search | **Pagefind**, run after `astro build`; substring fallback in dev |
| Comments | **Supabase**, readers type a **name** (no sign-in). Anti-spam: honeypot field + DB-side rate limit. No Supabase project exists yet, so ship the migration + `.env.example`, and degrade gracefully when env vars are missing |
| Seed content | All 13 prototype posts in the prototype's folder tree. The 2 posts with full copy in the prototype are complete; the other 11 get short but real technical bodies (2–4 sections, ≥1 code block where natural) with a `<!-- seed content: replace before publishing -->` comment at the top of the body |
| Package manager | **pnpm** (pin via `"packageManager"` in package.json) |
| Styling | Plain CSS with custom properties. Global tokens + Astro scoped styles; CSS Modules for Preact components. No Tailwind |
| Fonts | Self-hosted via Fontsource (`@fontsource-variable/inter`, `@fontsource-variable/source-serif-4`, `@fontsource/jetbrains-mono` 400/500). No Google Fonts request |
| Icons | Phosphor, via a **generated** module (see §5) shared by `.astro` and Preact components |
| Hosting | Undecided → everything must be plain static files in `dist/` |

Verify Astro 7 APIs against the installed package (types in `node_modules/astro`) or the docs
(Context7 MCP if available) rather than memory — especially the Content Layer `glob()` loader,
`render()`, `getCollection()`, `<ClientRouter />` lifecycle events and `transition:persist`.

## 1. Repository layout

```
.
├─ .github/workflows/ci.yml          # lint, typecheck, unit tests, build (+ e2e)
├─ .env.example                       # PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SITE_URL
├─ astro.config.mjs
├─ eslint.config.js                   # flat config: typescript-eslint, eslint-plugin-astro, jsx-a11y
├─ .prettierrc  (+ prettier-plugin-astro)
├─ package.json / pnpm-lock.yaml
├─ playwright.config.ts
├─ vitest.config.ts                   # uses getViteConfig from astro/config
├─ tsconfig.json                      # extends astro/tsconfigs/strict, jsxImportSource preact, "@/*" → "src/*"
├─ README.md                          # setup, scripts, writing posts, Supabase setup, deploy notes
├─ docs/  (design handoff + this plan)
├─ public/
│  ├─ favicon.svg  favicon-32.png  apple-touch-icon.png   # PNGs generated once by scripts/generate-favicons.mjs (sharp)
│  └─ robots.txt
├─ scripts/
│  ├─ generate-icons.mjs              # writes src/lib/icons.generated.ts
│  └─ generate-favicons.mjs
├─ supabase/migrations/0001_comments.sql
├─ src/
│  ├─ content.config.ts               # collections: posts, folders (Zod schemas)
│  ├─ content/posts/**                # seed content
│  ├─ config/site.ts                  # site name, author, tagline, intro copy, nav constants
│  ├─ lib/
│  │  ├─ content/                     # PURE build-time logic (unit tested, no astro: imports)
│  │  │  ├─ types.ts                  # PostMeta, FolderNode, PostIndexEntry, …
│  │  │  ├─ paths.ts                  # id ↔ segments ↔ URL, prettifyFolderName
│  │  │  ├─ reading-time.ts           # words ÷ 230, ceil, min 1
│  │  │  ├─ tree.ts                   # buildLibrary(posts, folders) → tree + lookup maps
│  │  │  └─ navigation.ts             # breadcrumbs, prev/next, descendants, latest, counts
│  │  ├─ content/load.ts              # the ONLY module that calls getCollection(); memoised; returns Library
│  │  ├─ markdown/rehype-code-block.ts# wraps Shiki <pre> in figure + header + copy button
│  │  ├─ format.ts                    # formatDate (Intl, en-US, timeZone UTC), formatCount
│  │  ├─ icons.generated.ts           # generated, committed
│  │  ├─ supabase/                    # client.ts (lazy singleton, null when unconfigured), comments.ts (list/add, typed)
│  │  └─ client/                      # BROWSER-ONLY modules
│  │     ├─ storage-keys.ts           # every localStorage/sessionStorage key in one place
│  │     ├─ prefs.ts                  # $prefs store + applyPrefs(html) (theme, size, measure, font)
│  │     ├─ library-state.ts          # $bookmarks, $recent, $progress, $sidebar (persistent atoms) + actions
│  │     ├─ reading-progress.ts       # scroll tracking on <main>, $scrollProgress, $activeHeading
│  │     ├─ ui-state.ts               # $drawerOpen, $settingsOpen, $commentCount (non-persistent)
│  │     ├─ search.ts                 # Pagefind loader + substring fallback, returns post ids
│  │     └─ code-copy.ts              # delegated click handler for copy buttons
│  ├─ layouts/
│  │  ├─ BaseLayout.astro             # <html>, head/SEO, fonts, inline prefs script, ClientRouter, loader
│  │  └─ AppLayout.astro              # header, progress bar slot, sidebar, <main>, footer
│  ├─ components/
│  │  ├─ ui/        Icon.astro, Icon.tsx, IconButton.tsx, SegmentedControl.tsx
│  │  ├─ shell/     Header.astro, Logo.astro, Footer.astro, Loader.astro, ProgressBar.tsx,
│  │  │             ThemeButton.tsx, ReadingSettings.tsx, Sidebar.tsx, FolderTree.tsx, SidebarFilter.tsx
│  │  ├─ post/      Breadcrumb.astro, PostHeader.astro, BookmarkButton.tsx, CommentCount.tsx,
│  │  │             PrevNext.astro, Toc.tsx, MobileBottomBar.tsx, Comments.tsx
│  │  ├─ folder/    FolderGrid.astro, FolderPostList.tsx
│  │  └─ home/      HomePersonal.tsx (Continue reading + Bookmarks), BrowseFolders.astro, LatestPosts.astro
│  ├─ views/        PostView.astro, FolderView.astro   # page bodies, keep pages thin
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ [...path].astro              # getStaticPaths → folder AND post routes (discriminated props)
│  │  ├─ 404.astro
│  │  ├─ rss.xml.ts                   # @astrojs/rss
│  │  └─ (sitemap via @astrojs/sitemap integration)
│  └─ styles/       tokens.css (themes), base.css (reset, focus, selection), prose.css (article body + code)
└─ tests/
   ├─ unit/   *.test.ts   (lib/content, format, storage helpers)
   └─ e2e/    *.spec.ts   (Playwright against `astro preview`)
```

Principles:
- **Pure core, thin shell.** All content logic (tree, ordering, prev/next, breadcrumbs, counts,
  reading time) lives in `src/lib/content/*` as pure functions over plain data, fully unit tested.
  `load.ts` adapts Astro collections into that data; pages/components only consume it.
- **One owner per piece of state.** Persistent client state lives in `src/lib/client/*` stores;
  components never touch `localStorage` directly. All storage access is wrapped in try/catch.
- Islands get **minimal serialisable props** (ids, the compact post index), never whole entries.
- Strict TypeScript, no `any`. Named exports for lib modules. Files ≤ ~200 lines; split otherwise.

## 2. Content model

`src/content.config.ts`:

```ts
const base = './src/content/posts';
const posts = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_folder.md'], base,
                 generateId: ({ entry }) => entry.replace(/\.mdx?$/, '') }),
  schema: z.object({
    title: z.string(), summary: z.string(), date: z.coerce.date(),
    order: z.number().int().optional(), tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
const folders = defineCollection({
  loader: glob({ pattern: '**/_folder.md', base,
                 generateId: ({ entry }) => path.posix.dirname(entry) }),
  schema: z.object({ title: z.string().optional(), description: z.string().optional(),
                     order: z.number().int().optional() }),
});
```

(Confirm the `generateId` signature against Astro 7; the goal is ids equal to the
repo-relative path without extension, e.g. `apis/authentication/oauth-2-0/client-credentials`.)

Library rules (`tree.ts`, `navigation.ts`):
- Folders are derived from post paths **and** `_folder.md` files (a folder may exist with only
  metadata). Name = `title` ?? `prettifyFolderName(segment)` (`oauth-2-0` → `Oauth 2 0`
  is acceptable; just title-case words split on `-`/`_`).
- Sort: subfolders first by `order` (missing = +∞), then name; posts by `order`, then date asc, then title.
- Drafts: excluded when `import.meta.env.PROD`, included in dev (pass a flag into the pure function).
- Descendant post count per folder; "N posts · M folders" counts for home cards.
- Prev/next = siblings in the same folder by the sort above (null at the ends).
- Breadcrumb = Home + every ancestor folder (label + URL).
- Latest = all posts by date desc. Folder "3 newest" = descendants by date desc.
- Build must **throw** a clear error if a post slug collides with a sibling folder name.
- Reading time = `ceil(words / 230)`, min 1, computed from `entry.body` with Markdown syntax
  and fences stripped of their markers (code words count). Headings come from `render(entry).headings`
  filtered to `depth === 2` (Astro already slugifies ids).
- **PostIndexEntry** (compact, serialised to islands):
  `{ id, url, title, summary, date (ISO), readTime, folderId, folderPath: string[] /* display names */ }`.

URLs: `/` + id (no trailing slash); folder URL = `/` + folder id. Keep Astro's default
`trailingSlash: 'ignore'` and `build.format: 'directory'`.

Seed tree (folder slug → display title, `order`):

```
apis/ "APIs" 1 — "Designing, securing and consuming HTTP APIs."
  authentication/ "Authentication" 1
    oauth-2-0/ "OAuth 2.0" 1: what-oauth-solves(1), client-credentials(2), auth-code-pkce(3)
    api-keys(1), basic-vs-bearer(2)
  rate-limiting/ "Rate limiting" 2: rate-limiting-basics(1), retry-policies-with-backoff(2)
business-applications/ "Business Applications" 2
  microsoft-dynamics/ "Microsoft Dynamics" 1
    plugins/ "Plugins" 1: plugins-the-basics(1), pre-vs-post-operation(2)
    custom-steps(1), web-resources(2)
  power-platform/ "Power Platform" 2: calling-apis-from-power-automate(1)
devops/ "DevOps" 3
  pipelines/ "Pipelines" 1: deploying-solutions-with-pipelines(1)
```

Titles, summaries, dates and folder descriptions come verbatim from the prototype's `FOLDERS`
/ `POSTS` arrays; bodies for `client-credentials` and `custom-steps` from `BODIES` (convert to
Markdown; prototype heading ids should fall out of Astro's slugger naturally — exact ids don't matter).

## 3. Layout & routing

- `BaseLayout.astro`: `<html lang="en">`, charset/viewport, `<title>` (`{page} · Nagy Notes`),
  description, canonical (`Astro.site`), OG tags, favicons, RSS `<link rel="alternate">`,
  Fontsource imports, global CSS, `<ClientRouter />`, the **inline prefs script** and the Loader.
- **Inline prefs script** (`<script is:inline define:vars={{ KEYS }}>` in `<head>`): reads saved
  prefs (fallback: theme from `prefers-color-scheme` → `dark` else `light`; size `m`, measure
  `normal`, font `serif`) and sets `data-theme`, `data-size`, `data-measure`, `data-font` on
  `<html>`; adds `data-loaded` if `sessionStorage` says the loader already ran this session.
  The same logic lives in `prefs.ts#applyPrefs(el)` and runs on `astro:before-swap` against
  `event.newDocument.documentElement` so client navigation never flashes. Keep key names
  imported from `storage-keys.ts` (passed via `define:vars`) so they can't drift.
- CSS keys off those attributes: `[data-size="s"] .prose{font-size:16.5px}` etc.; mobile −1px.
- `AppLayout.astro` grid: header (56px) / progress bar (post only) / [sidebar | main].
  `body` is `height: 100dvh; overflow: hidden`; **only `<main id="main">` scrolls**.
  Header and Sidebar island carry `transition:persist`. `<main>` is `container-type: inline-size`
  with `container-name: main`; the post TOC column appears via `@container main (min-width: 1020px)`.
  Footer lives at the end of `<main>`.
- Below 760px viewport: sidebar becomes a drawer (300px, max 85vw, 220ms slide, scrim, Esc and
  scrim click close it, `inert` on the rest while open, focus moved into it and restored on close).
- After each navigation (`astro:page-load`): reset `#main` scrollTop to 0 (unless hash), close
  the drawer, sidebar recomputes the active row from `location.pathname`.
- `[...path].astro`: `getStaticPaths` returns `{ params: { path: id }, props: { kind: 'post', id } }`
  for posts and `{ kind: 'folder', id }` for folders; renders `PostView` or `FolderView`.
- `404.astro` uses the shell with a short message and a link Home.

## 4. Screens & islands

Hydration directives: `client:load` for shell islands (Sidebar, ThemeButton, ReadingSettings,
ProgressBar) and post controls (Toc, BookmarkButton, MobileBottomBar); `client:idle` for Comments
and CommentCount (count must appear without scrolling to the bottom); `client:load` for
FolderPostList and HomePersonal. Islands render a stable SSR fallback and fill in local data
after mount (avoid hydration mismatches: read persistent stores in effects / after mount).

**Header** (Header.astro): menu button (mobile), Logo → `/`, "Reading" button (icon-only on
mobile) toggling ReadingSettings, ThemeButton cycling light → sepia → dark (icons sun/coffee/moon).

**ReadingSettings**: 300px popover anchored under the header right; four SegmentedControls
(Text size A−/A/A+, Line width Narrow/Normal/Wide, Font Serif/Sans, Theme Light/Sepia/Dark),
close ×, "Saved on this device." Closes on Esc, outside click, and navigation. Use
`role="dialog"` + `aria-labelledby`; SegmentedControl is a radiogroup with arrow-key support.

**Sidebar** (Sidebar + FolderTree + SidebarFilter): exactly per handoff (LIBRARY label,
collapse → 52px rail with expand/search/home, filter input, RECENT (last 3, hidden while
filtering), FOLDERS/MATCHES + "Collapse all", tree rows with depth padding, counts, trailing
bookmark/check marks, active row). Caret button toggles (`aria-expanded`); label is a link to
the folder page; clicking the label of the already-open folder toggles it. Opening a post
expands its ancestors. Expanded set + rail state persist in `$sidebar`. Filter: debounce 150ms,
`search.ts` → Pagefind (`/pagefind/pagefind.js`, dynamic import with `/* @vite-ignore */`) when
available, else case-insensitive substring over title + summary; results = flat list with the
top-level folder name on the right, or `No posts match “…”.`

**Post (PostView)**: article column with measure/size/font from html data attributes, Breadcrumb,
h1, meta row (read time, date, CommentCount button scrolling to `#comments`, BookmarkButton),
`<div class="prose" data-pagefind-body>` body, PrevNext, Comments; TOC column (Toc island:
"ON THIS PAGE", active item = last h2 whose top ≤ 140px from `#main` top, click smooth-scrolls
to 24px offset, "N min left" = `max(1, ceil(readTime × (1 − progress)))`, "↑ Back to top").
`reading-progress.ts` owns the scroll listener (passive, rAF-throttled) and exposes
`$scrollProgress`; ProgressBar, Toc and MobileBottomBar subscribe; it also records
`max(progress)` into `$progress[postId]` (throttled writes) and pushes the post to `$recent`
(unique, max 3) on open. Mobile: MobileBottomBar (prev ←, "Contents · N min left" opening a
bottom sheet TOC with handle + scrim, next →; 30% opacity when no target).
Pagefind: put `data-pagefind-body` only on the article; add `data-pagefind-meta="title"` on h1 and
`data-pagefind-ignore` on breadcrumb/meta/prev-next/comments.

**Code blocks**: Shiki via `markdown.shikiConfig` with three themes
(`themes: { light: …, sepia: …, dark: … }`, `defaultColor: false`) — pick quiet ones
(e.g. `min-light`/`github-light`, `solarized-light`, `github-dark-dimmed`) and map
`[data-theme=x] .shiki span { color: var(--shiki-x) }`; background is always `var(--code)`.
`rehype-code-block.ts` (registered in `markdown.rehypePlugins`) wraps each `pre` into
`<figure class="code-block"><div class="code-block__header"><span>{lang}</span><button
type="button" class="code-copy" aria-label="Copy code">…</button></div>{pre}</figure>`.
Language label = fence lang as written (e.g. `c#`, `json`). `code-copy.ts` adds one delegated
listener on `document` (idempotent across navigations) using `navigator.clipboard.writeText`,
swaps to check + "Copied" for 1.6s, and announces via `aria-live`.

**Comments**: list (avatar initial, name · date, text) + composer (Name input — remembered in
localStorage — textarea 3 rows "Add a comment…", hidden honeypot input, "Post comment" disabled at
45% opacity until name and body are non-empty). On submit: client-side length validation
(name 1–80, body 1–4000), insert, append optimistically, update `$commentCount`; show inline error
on failure (including the rate-limit error). Loading/empty/error/unconfigured states:
unconfigured → "Comments aren't available yet." and CommentCount hidden.

**Folder (FolderView)**: breadcrumb, h1, description, FOLDERS grid (FolderGrid), POSTS · N with
FolderPostList island (Reading order | Newest segmented control, numbered rows, title link,
summary, meta "8 min · Oct 12, 2026 · 40% read"/"Read", bookmark toggle). No own posts →
"All posts · N" with descendants and sub-path in meta.

**Home**: h1 + intro (copy from handoff, in `config/site.ts`), HomePersonal island (Continue
reading — most recent post with 0 < progress < 95% — and Bookmarks · N, up to 4, empty text),
BROWSE FOLDERS (top-level cards), LATEST (5 newest).

**Loader** (Loader.astro): full-screen `--bg` overlay with "nn." and bouncing dot; hidden
immediately when `html[data-loaded]`; otherwise fades out (400ms) on `window.load` or after
1.1s max, then sets the sessionStorage flag. Never shown on client navigation.
`prefers-reduced-motion: reduce` → no bounce (and no smooth scrolling / drawer slide).

**Footer**: "nn." mark, "Written by Abdallah Nagy", "↑ Back to top" (scrolls `#main`).

## 5. Supporting pieces

- **Icons**: `scripts/generate-icons.mjs` reads `@iconify-json/ph` (dev dependency), extracts the
  ~25 icons listed in the handoff (regular + `bookmark-simple-fill`, `list-bullets`, etc.), writes
  `src/lib/icons.generated.ts` (`export const icons = { name: { body, width, height } } as const;
  export type IconName = keyof typeof icons`). `Icon.astro` and `Icon.tsx` render inline SVG with
  `fill="currentColor"`, `aria-hidden="true"` by default, `size` prop. Add `pnpm icons` script.
- **Tokens**: `tokens.css` copies the handoff table exactly into `:root, [data-theme=light]`,
  `[data-theme=sepia]`, `[data-theme=dark]` and sets `color-scheme` per theme. Also radius,
  spacing, font-family and motion custom properties. `base.css`: minimal reset, button/input
  inheritance, `:focus-visible` outline, `::selection` accent tint, reduced-motion overrides.
- **Supabase** (`supabase/migrations/0001_comments.sql`):
  - `comments` table exactly as the handoff (+ `author_name` check 1–80 chars,
    `post_slug` check `~ '^[a-z0-9/_-]+$'`) and a private `client_hash text` column.
  - Index on `(post_slug, created_at)`.
  - RLS on. `select` policy for `anon, authenticated` `using (approved)`; `insert` policy
    `with check (approved is not distinct from true … )` — simplest: insert allowed, column
    `approved` not grantable to anon so the default applies. Column privileges: grant `select
    (id, post_slug, author_name, body, created_at)` and `insert (post_slug, author_name, body)`
    to `anon`; no update/delete grants (owner uses dashboard / service role).
  - `before insert` trigger (security definer, `search_path` pinned) that sets `client_hash`
    = sha256 of the first `x-forwarded-for` IP from `current_setting('request.headers', true)`
    and raises `'rate_limited'` if that hash inserted ≥ 3 comments in the last 10 minutes.
  - Client (`lib/supabase/comments.ts`): `listComments(slug)`, `addComment({slug,name,body})`,
    typed rows, maps the `rate_limited` error to a friendly message. Don't request `.select()`
    after insert beyond allowed columns.
- **SEO/feeds**: `@astrojs/sitemap`, `rss.xml.ts` (all published posts, newest first). `site`
  from `SITE_URL` env with a placeholder default; `robots.txt` pointing at the sitemap.
- **Favicons**: copy `docs/design/assets/favicon.svg` to `public/`; generate 32px and 180px PNGs
  once with `scripts/generate-favicons.mjs` (sharp) and commit them.

## 6. Tooling, scripts, CI

`package.json` scripts:
```
dev            astro dev
build          astro build && pagefind --site dist
preview        astro preview
check          astro check
lint           eslint .
format         prettier --write .
format:check   prettier --check .
test           vitest run
test:e2e       playwright test
icons          node scripts/generate-icons.mjs
```
- Vitest: `getViteConfig` from `astro/config`, `environment: 'node'` by default; `happy-dom`
  only for client-store tests that need `localStorage`.
- Playwright: `webServer` = `pnpm build && pnpm preview` on port 4321; projects desktop-chromium
  and mobile (`devices['Pixel 7']`). The container has Chromium at `/opt/pw-browsers`
  (`PLAYWRIGHT_BROWSERS_PATH` is set). **Never run `playwright install`.** If the pinned
  `@playwright/test` expects a different browser revision, set
  `launchOptions.executablePath` from an env var (`PW_CHROMIUM_PATH`) in the config.
- CI (`.github/workflows/ci.yml`): pnpm + Node 22, `pnpm install --frozen-lockfile`, lint,
  format:check, check, test, build; e2e job installs browsers with `playwright install --with-deps chromium`.
- `.gitignore`: node_modules, dist, .astro, .env, test-results, playwright-report.
- `.editorconfig`, `.nvmrc` (22).

## 7. Tests (minimum)

Unit (`tests/unit`):
- `paths`: id ↔ URL, prettify.
- `reading-time`: empty, short, fence handling, rounding.
- `tree`: folder inference without `_folder.md`, metadata merge, ordering rules, descendant counts,
  drafts on/off, slug/folder collision throws.
- `navigation`: breadcrumbs, prev/next at both ends, latest, folder-with-no-own-posts descendants.
- `format`: dates are UTC-stable.
- `library-state`: recent is unique and capped at 3; progress keeps the max; bookmarks toggle.
- `rehype-code-block`: wraps `pre`, keeps lang label.

E2E (`tests/e2e`):
- Home renders h1, browse folders, latest 5; folder card navigates to folder page.
- Post page: breadcrumb, title, TOC items = h2s, clicking TOC scrolls, progress bar grows on scroll.
- Theme button cycles and survives reload with no flash (`data-theme` present in initial HTML
  after first set).
- Bookmark on post → appears on Home Bookmarks card and as a tree mark.
- Copy button shows "Copied".
- Folder page sort toggle reorders.
- Sidebar filter finds a post by body text (run against the built site so Pagefind exists).
- Mobile project: menu opens drawer, link navigates and closes it; bottom bar opens the TOC sheet.
- Comments section shows the unconfigured state when env vars are absent.

## 8. Phases & gates

Commit after each phase with a conventional message (`feat: …`, `chore: …`, `test: …`).
Each gate must pass before moving on: `pnpm lint && pnpm check && pnpm test && pnpm build`.

1. **Scaffold** — Astro + Preact + MDX(optional) + sitemap, TS strict, ESLint/Prettier, Vitest,
   scripts, `.gitignore`, `.env.example`, tokens/base CSS, fonts, icons generator, favicons.
2. **Content core** — collections, seed content (13 posts, 10 folders), `lib/content/*` + unit tests.
3. **Shell** — BaseLayout (inline prefs script, ClientRouter, loader), AppLayout, Header,
   ThemeButton, ReadingSettings, Sidebar/FolderTree (no search yet), Footer, drawer.
4. **Pages** — Home, Folder, Post (prose styles, Shiki themes, code block plugin + copy, TOC,
   progress, prev/next, bookmark, mobile bottom bar), 404, RSS.
5. **Search** — Pagefind attributes, `search.ts`, sidebar filter.
6. **Comments** — migration, Supabase client, Comments + CommentCount islands.
7. **Polish & e2e** — a11y pass (keyboard through tree, popover, drawer; labels; contrast is
   given), reduced motion, Playwright suite green on desktop + mobile, README, CI workflow.

Visual check: run the built site and compare screenshots (desktop 1440×900 and mobile 390×844,
all three themes, post/folder/home) against the prototype before declaring done.

## 9. Out of scope (do not build)

⌘K search dialog, GitHub sign-in, comment moderation UI, tags pages, analytics, i18n.
