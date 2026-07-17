# Creator Earnings Calculator

A production-ready **Next.js 15** app that lets anyone search a public YouTube
channel and get an **independent** estimate of what its ad revenue might
look like — using only the **official YouTube Data API v3**.

- 🔎 Search by channel name, `@handle`, channel URL, or channel ID
- 📊 Recent performance analysis (avg / median views, upload cadence,
  Shorts vs. long-form mix, monthly view band)
- 💰 Configurable earnings estimator (country RPM, niche, content type,
  monetized-share, currency, and additional monthly income streams)
- 🔒 API key is server-side only — never exposed to the browser
- 🧱 App Router + React Server Components + TypeScript + Tailwind CSS + Zod
- ♿ Keyboard-navigable search, visible focus states, semantic HTML
- 🔎 SEO: metadata, OG/Twitter, `robots.ts`, `sitemap.ts`, JSON-LD

> ⚠️ This is an **independent** tool. It is not affiliated with, endorsed
> by, or verified by YouTube or Google. All revenue figures are estimates.

---

## Table of contents

- [Quick start](#quick-start)
- [Google Cloud & YouTube API setup](#google-cloud--youtube-api-setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How the estimator works](#how-the-estimator-works)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick start

```bash
git clone <this-repo>
cd creator-earnings-calculator

cp .env.example .env.local
# open .env.local and paste your YouTube Data API key

npm install
npm run dev
```

Open <http://localhost:3000>.

---

## Google Cloud & YouTube API setup

You need a Google Cloud project with the YouTube Data API v3 enabled and an
API key.

1. Go to <https://console.cloud.google.com/> and either create a new project
   or select an existing one.
2. Navigate to **APIs & Services → Library**, find **YouTube Data API v3**,
   and click **Enable**.
3. Go to **APIs & Services → Credentials → Create credentials → API key**.
4. Copy the generated key.
5. Recommended — click the new key, then under **Application restrictions**
   restrict it to your production domain, and under **API restrictions**
   restrict it to **YouTube Data API v3** only.

The free tier gives you a generous daily quota (10,000 units/day). This app
is quota-frugal: a full channel view (search → channel → recent videos)
costs roughly ~100–120 quota units.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
YOUTUBE_API_KEY=your-key-here

NEXT_PUBLIC_SITE_NAME=Creator Earnings Calculator
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `YOUTUBE_API_KEY` — **server-only**. Never exposed to the client. All
  YouTube requests originate from the Next.js server.
- `NEXT_PUBLIC_SITE_NAME` — display name used in header, footer, metadata.
- `NEXT_PUBLIC_SITE_URL` — canonical base URL used for OG images, sitemap,
  and JSON-LD. Set this to your production URL when deploying.

---

## Scripts

| Command         | What it does                              |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the dev server on port 3000         |
| `npm run build` | Production build                          |
| `npm run start` | Serve the production build                |
| `npm run lint`  | Run ESLint (Next config + TypeScript)     |

---

## Project structure

```
src/
  app/
    api/
      channel/route.ts     # GET /api/channel?channelId=UC...
      search/route.ts      # GET /api/search?q=...
      videos/route.ts      # GET /api/videos?playlistId=UU...
    about/page.tsx
    disclaimer/page.tsx
    methodology/page.tsx
    privacy/page.tsx
    terms/page.tsx
    layout.tsx             # Root layout, header/footer, metadata, JSON-LD
    page.tsx               # Landing page — hero + search + workspace
    robots.ts
    sitemap.ts
    error.tsx / not-found.tsx
    globals.css
  components/
    ChannelSearch.tsx      # Debounced search + accessible combobox
    ChannelWorkspace.tsx   # Client orchestrator (fetch channel + videos)
    EarningsCalculator.tsx # Interactive earnings estimator
    Footer.tsx / Header.tsx
    PerformanceCard.tsx    # Recent-uploads performance analysis
    ProfileCard.tsx        # Channel identity + KPIs
    StaticPage.tsx
    TransparencyBanner.tsx
    VideosGrid.tsx
    icons.tsx
  lib/
    config.ts              # publicConfig + serverEnv
    earnings.ts            # calculateEarnings()
    format.ts              # Number, currency, date, duration helpers
    parseQuery.ts          # Channel-id / handle / URL / name detection
    performance.ts         # analyzePerformance()
    rpmData.ts             # Country RPM tiers, niches, currencies
    schemas.ts             # Zod schemas for API routes + inputs
    youtube.ts             # Server-only YouTube Data API v3 wrapper
  types/
    youtube.ts             # Domain DTOs used across the app
```

---

## How the estimator works

The performance snapshot and the earnings estimate are two independent
layers you can tune. Full detail lives at `/methodology` in the running app.

### Performance snapshot

1. Fetch up to 12 recent uploads via `playlistItems` + `videos`.
2. Compute average / median view counts, upload cadence in the last 30 &
   90 days, and Shorts (`duration ≤ 60s`) vs. long-form share.
3. Estimate a monthly-view point value:
   - Prefer the 30-day sum if we have ≥ 3 recent uploads.
   - Otherwise scale 90 days → 30 days.
   - Otherwise average across the observed sample window.
4. Emit a low / expected / high band around that point estimate.

### Earnings

```
adRevenue = (monthlyViews × monetized%) × RPM / 1000
total     = adRevenue + sponsorships + affiliate + memberships
```

`RPM` is derived from `country baseRpm × niche multiplier × contentType
multiplier`, unless you provide an explicit RPM override. The final total
is converted to your chosen display currency using a static approximate
rate.

You get low / expected / high bands, and daily / weekly / monthly / annual
breakdowns.

---

## Deployment

Any Node-compatible host works. The recommended path is Vercel:

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add environment variables — at minimum `YOUTUBE_API_KEY` and
   `NEXT_PUBLIC_SITE_URL` (set to your deployed URL).
4. Deploy.

For Docker / self-hosting:

```bash
npm run build
npm run start
```

---

## Troubleshooting

- **`YOUTUBE_API_KEY is not configured on the server`** — you didn&apos;t
  set the key. Copy `.env.example` to `.env.local` and restart `npm run dev`.
- **`quotaExceeded`** — you burned through your daily quota. Wait for the
  daily reset or request more quota from Google Cloud.
- **`API key not valid`** — the key is wrong, disabled, or your project
  doesn&apos;t have YouTube Data API v3 enabled.
- **`referer restrictions`** — your key has a referrer/HTTP restriction
  that doesn&apos;t match your server. Requests are made server-to-server,
  so use IP-based or unrestricted keys, or remove the referrer restriction.

---

## License

MIT. See `LICENSE` if provided, otherwise treat as MIT-style permissive.
