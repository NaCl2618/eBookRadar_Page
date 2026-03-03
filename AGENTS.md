# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-03 21:41:33 KST
**Commit:** 2f0f917
**Branch:** main

## OVERVIEW

Static newsletter archive site (HTML/CSS/JS only). No backend, no build step; content is Markdown + JSON index fetched at runtime.

## STRUCTURE

```text
eBookRadar_Page/
|- index.html              # home (recent 7)
|- newsletters.html        # archive list
|- newsletter.html         # detail page by ?date=
|- assets/
|  |- app.js               # page router + fetch/render logic
|  `- styles.css           # shared styles
|- content/
|  |- index.json           # newsletter metadata index (source of truth)
|  `- YYYY-MM-DD.md        # daily newsletter markdown
`- images/                 # static images for content/pages
```

## WHERE TO LOOK

| Task                       | Location                                | Notes                                      |
| -------------------------- | --------------------------------------- | ------------------------------------------ |
| Home list not rendering    | `index.html`, `assets/app.js`       | `renderHome()` + `#recent-newsletters` |
| Archive list issues        | `newsletters.html`, `assets/app.js` | `renderArchive()` + `#all-newsletters` |
| Detail page issues         | `newsletter.html`, `assets/app.js`  | `renderDetail()` depends on `?date=`   |
| Missing newsletter         | `content/index.json`                  | Entry must exist and point to `.md` file |
| Markdown display quirks    | `newsletter.html`, `assets/app.js`  | Uses CDN `marked` when available         |
| Styling/layout regressions | `assets/styles.css`                   | Single stylesheet for all pages            |

## CODE MAP

LSP unavailable in this environment; map derived from AST/file inspection.

| Symbol                     | Type           | Location          | Role                                          |
| -------------------------- | -------------- | ----------------- | --------------------------------------------- |
| `loadNewsletterIndex`    | async function | `assets/app.js` | Fetches and date-sorts `content/index.json` |
| `createNewsletterItem`   | function       | `assets/app.js` | Builds list item link/date nodes              |
| `renderHome`             | async function | `assets/app.js` | Renders recent 7 newsletters                  |
| `renderArchive`          | async function | `assets/app.js` | Renders full newsletter list                  |
| `renderDetail`           | async function | `assets/app.js` | Loads and renders one markdown file           |
| `setPagerLink`           | function       | `assets/app.js` | Enables/disables prev/next links              |
| `parseTitleFromMarkdown` | function       | `assets/app.js` | Extracts first `#` heading as title         |
| `init`                   | function       | `assets/app.js` | Routes by `body[data-page]`                 |

## CONVENTIONS

- Frontend-only: plain HTML + one shared JS/CSS bundle in `assets/`.
- Page routing is attribute-driven (`body[data-page]`), not framework/router-driven.
- Newsletter ordering is always descending by `date` string (`YYYY-MM-DD`).
- Detail page URL contract: `newsletter.html?date=YYYY-MM-DD`.
- Markdown rendering prefers `window.marked`; fallback is raw markdown text.

## ANTI-PATTERNS (THIS PROJECT)

- Adding `content/YYYY-MM-DD.md` without matching `content/index.json` entry.
- Renaming/removing IDs expected by JS (`recent-newsletters`, `all-newsletters`, `newsletter-content`, pager IDs).
- Breaking date format contract in `content/index.json` (`YYYY-MM-DD` required for lexical sort).
- Assuming directory auto-scan for content on static hosting (project explicitly uses manual index file).

## UNIQUE STYLES

- Korean-first copy and labels across UI and runtime errors.
- Static-first architecture: content management via JSON index + markdown files.
- Three-page structure shares one runtime script rather than per-page bundles.

## COMMANDS

```bash
# local static preview (required for fetch to work)
python3 -m http.server 4173

# open in browser
http://localhost:4173
```

## NOTES

- If `marked` CDN fails, detail page still renders raw markdown text.
- No CI/build/test config detected in repo root at generation time.
- Keep this file high-level; add nested `AGENTS.md` only when subdirectory complexity grows.
- 진행상황과 결과는 한국어로 표시
- 모든 소스코드에 한국어 주석 필수
