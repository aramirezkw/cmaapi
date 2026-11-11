# KWIQ CMA prototype

Command dashboard with the KWIQ AI assistant, including the auto-built CMA flow.

## Run it

```bash
node server.js
```

Then open http://localhost:8907. Reload after editing any file in `js/`, `css/`, or `index.html`; restart the server after editing `.env` or `server.js`.

`server.js` serves the prototype and proxies listing searches to KW's Unified Listing Service (ULS), so the client secret and access token never reach the browser. Without credentials, or if ULS fails, the CMA falls back to the sample homes.

### ULS credentials

1. Copy `.env.example` to `.env` (already done locally).
2. Paste the client secret from Launchpad (app **CMA for PX**, ID 5201, Credentials tab) into `ULS_CLIENT_SECRET`.
3. `ULS_ENV=qa` uses `qa.partners.api.kw.com`; `ULS_ENV=prod` uses `partners.api.kw.com`. QA rejects App 5201's credentials (it was created on Launchpad production), so `.env` is set to `prod`. That's real production data, read-only.
4. Check it: http://localhost:8907/api/uls/status should return `{"ok":true}`.

Tokens are cached in the server. Each app can hold only one token at a time, so a new token cancels the old one; avoid running two copies of the server with the same credentials.

`.env` is git-ignored and the server refuses to serve dotfiles or `server.js`. Locally it listens on `127.0.0.1` only, so other machines can't reach it.

To host it for other people, see [DEPLOY.md](DEPLOY.md).

## Where things live

| Path | What it is |
|---|---|
| `index.html` | Page markup: top bar, dashboard, KWIQ drawer, CMA preview overlay |
| `js/kwiq.js` | All behavior — the `Component` class (chat, intents, CMA builder, auto-built CMA, report) |
| `css/colors_and_type.css` | XDS tokens: colors, type, spacing, radius, shadows, Mulish font faces |
| `css/kwiq.css` | Prototype-specific styles (animations, hover states, sliders) |
| `assets/` | Icons, logos, fonts, and the downloadable `Rollingwood CMA.pdf` |
| `server.js` | Local server: static files + ULS proxy (`/api/uls/search`, `/api/uls/status`) |
| `.env` / `.env.example` | ULS credentials (local only) and the template |
| `vendor/` | Design-tool runtime that renders the page with React. Generated — don't edit |
| `bundled/` | The original single-file exports, kept as backups |

## Finding your way around `js/kwiq.js`

- `kwiqSend` — routes a chat message to the right flow
- `kwiqCmaAsk` → `kwiqCmaAutoBuild` — the best-practice CMA draft
- `kwiqCmaAutoSettings` — the widening search (6 mo / 1 mi / ±20% size, then looser)
- `kwiqCmaPractices` — the "How I built this" explanations
- `kwiqUlsLoad` / `kwiqUlsMap` — fetch the subject and comps from ULS and translate them to the CMA's shape
- `kwiqCmaData` — sample listings and map data (the fallback)
- `kwiqCmaAdjust` / `kwiqCmaValue` — adjustment model shared by the draft card and the report
- `kwiqCmaBuilderRender` — the 5-step builder used for tweaking
- `kwiqCmaReportHTML` — the on-screen CMA report
- `kwiqSiteOffer` → `kwiqSiteBuild` → `kwiqSiteHTML` — the seller website offered after a CMA (self-contained HTML; preview and Download)

## How the page boots

The runtime in `vendor/dc-runtime.js` expects the component code inside the `<script data-dc-script>` tag in `index.html`. A small loader at the bottom of `index.html` fetches `js/kwiq.js`, puts it in that tag, then starts the runtime. The runtime also loads React 18.3.1 from unpkg, so the page needs an internet connection.

Re-exporting from the design tool produces a new single-file bundle and won't include changes made here. Treat these files as the master copy.
