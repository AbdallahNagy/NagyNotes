# Nagy Notes

A personal technical blog by Abdallah Nagy: notes on Dynamics 365, the Power Platform, APIs and
DevOps. Posts live in nested folders, are browsed with a collapsible, resizable folder tree (or a flat newest-first list), and are built
for comfortable reading: a calm palette, reader-controlled text settings and copyable code blocks.

Built with [Astro](https://astro.build) 7 (static output), [Preact](https://preactjs.com) islands
and [nanostores](https://github.com/nanostores/nanostores), searched with
[Pagefind](https://pagefind.app), with comments on [Supabase](https://supabase.com).

Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> (or the header's Search button) to open the
command palette: it searches post titles, body text, headings and code plus folder names, and
browsing into a folder lists its subfolders and posts (<kbd>Backspace</kbd> goes back up).

The design lives in [`docs/design`](docs/design/README.md) and the implementation plan in
[`docs/PLAN.md`](docs/PLAN.md).

## Getting started

Requirements: Node.js 22.23.4 or newer (CI uses Node 24, see `.nvmrc`) and [pnpm](https://pnpm.io) 10.

```sh
pnpm install
cp .env.example .env   # optional: site URL and Supabase settings
pnpm dev
```

| Script          | What it does                                                              |
| --------------- | ------------------------------------------------------------------------- |
| `pnpm dev`      | Dev server with hot reload (drafts included, search falls back to titles) |
| `pnpm build`    | Static site into `dist/`, then the Pagefind index into `dist/pagefind`    |
| `pnpm preview`  | Serves `dist/`                                                            |
| `pnpm check`    | Astro/TypeScript type check                                               |
| `pnpm lint`     | ESLint (typescript-eslint strict, Astro and jsx-a11y rules)               |
| `pnpm format`   | Prettier (`pnpm format:check` to verify)                                  |
| `pnpm test`     | Unit tests (Vitest)                                                       |
| `pnpm test:e2e` | End-to-end tests (Playwright, desktop and mobile)                         |
| `pnpm icons`    | Regenerates `src/lib/icons.generated.ts` from Phosphor                    |
| `pnpm favicons` | Regenerates the PNG favicons from the design asset                        |

The quality gate used for every change is `pnpm lint && pnpm check && pnpm test && pnpm build`.

### End-to-end tests

`pnpm test:e2e` builds the site, serves it with `astro preview` and runs the suite in Chromium
with a desktop and a phone viewport. Install the browser once with
`pnpm exec playwright install chromium`. If Chromium is already installed in a revision other than
the one Playwright expects, point `PW_CHROMIUM_PATH` at its executable instead.

## Writing posts

Posts are Markdown files under `src/content/posts/`. The folder tree is the folder structure:

```
src/content/posts/
  apis/
    _folder.md                  # optional folder metadata
    authentication/
      _folder.md
      api-keys.md               # -> /apis/authentication/api-keys
      oauth-2-0/
        _folder.md
        client-credentials.md
```

A post's front matter:

```yaml
---
title: 'The client credentials flow, end to end'
summary: 'One or two sentences shown in lists and search results.'
date: 2026-10-18
order: 2 # position inside its folder (reading order); optional
tags: [oauth, security] # optional
draft: false # drafts are shown in dev and left out of production builds
---
```

`_folder.md` sets the folder's display name, description and position among its siblings:

```yaml
---
title: 'OAuth 2.0' # defaults to the prettified folder name
description: 'The OAuth flows worth knowing. Read them in order.'
order: 1
---
```

- File and folder names may only use lowercase letters, digits, `-` and `_`; they become the URL and
  the key of a post's comments. The build fails with a clear message otherwise, or when a post has
  the same name as a folder next to it.
- Posts are ordered by `order`, then date (oldest first), then title; folders by `order`, then name.
- Reading time is words / 230, rounded up. Second-level headings (`##`) form "On this page".
- Fenced code blocks are highlighted by Shiki (three quiet themes, one per reading theme) and get a
  language label and a copy button. The label is the language exactly as written in the fence.
- The 13 posts shipped with the repository are seed content. Eleven of them carry
  `<!-- seed content: replace before publishing -->` at the top of the body; replace them.

## Comments (Supabase)

Readers comment by typing a name; there is no sign-in. Without configuration the comments section
shows "Comments aren't available yet." and everything else works.

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_comments.sql` (SQL editor, or `supabase db push`). It creates the
   `comments` table with row level security, column-level grants and a trigger that allows at most
   three comments per client IP in ten minutes (best effort, see the migration; only a SHA-256 of the IP is stored, and it is never
   readable through the public API).
3. Copy the project URL and the `anon` key into `.env` as `PUBLIC_SUPABASE_URL` and
   `PUBLIC_SUPABASE_ANON_KEY`, and set the same variables in your hosting provider's build settings.

Spam defences are a hidden honeypot field, client-side length limits (name 1-80, comment 1-4000), the
database checks and the rate limit. Comments are visible immediately; to moderate first, change the
default of `approved` to `false` in the migration and approve rows in the dashboard.

## Deploying

The build output is plain static files in `dist/`, so any static host works (Vercel, Netlify,
Cloudflare Pages, Azure Static Web Apps, GitHub Pages). Use `pnpm build` as the build command and
`dist` as the output directory, and set:

- `SITE_URL`: the public URL (canonical links, sitemap, RSS). Also update the `Sitemap:` line in
  `public/robots.txt`.
- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` for comments.

The build also produces `sitemap-index.xml`, `rss.xml` and the Pagefind index (`dist/pagefind`).
Unknown URLs are served `404.html` by most hosts.

### Cloudflare Pages (CI)

The `deploy` job in `.github/workflows/ci.yml` builds and deploys to Cloudflare Pages on every push
to `main`, once lint, tests and e2e pass. Pull requests never deploy. One-time setup:

1. Create a Pages project in Cloudflare (Workers & Pages → Create → Pages → Direct Upload), or run
   `pnpm dlx wrangler pages project create <name> --production-branch=main`.
2. Create an API token with the **Cloudflare Pages: Edit** permission.
3. In the GitHub repo (Settings → Secrets and variables → Actions) add:
   - Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - Variables: `CLOUDFLARE_PAGES_PROJECT` (the project name), `SITE_URL`, and optionally
     `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`

The job runs in a `production` GitHub environment, so you can add required reviewers there if you
want to approve each deploy.

## Project layout

```
src/content/posts/   Markdown posts and _folder.md metadata
src/lib/content/     Pure, unit-tested content logic: tree, navigation, paths, reading time
src/lib/client/      Browser-only state: stores, search, scroll and progress tracking
src/lib/markdown/    The Markdown plugin that builds code blocks
src/lib/supabase/    Comments client and model
src/layouts/         BaseLayout (head, prefs script, loader) and AppLayout (shell)
src/components/      Astro components and Preact islands, grouped by area
src/views/           Page bodies for posts and folders
src/pages/           Routes: home, [...path], 404, rss.xml
src/styles/          Design tokens, base styles and article typography
supabase/migrations/ Database schema for comments
tests/unit, tests/e2e
```

State that belongs to the reader (theme, reading settings, bookmarks, recently opened posts, read
progress, sidebar layout) is stored in `localStorage` on their device only; each key is declared in
`src/lib/client/storage-keys.ts`.
