# Atlas

**Find your way to what users want.** Atlas reads public feedback about a product (Reddit, App Store reviews, Hacker News), groups it into themes and ranks each one by emotional intensity, recurrence and the user segment it affects. Each report is drawn as a topographic map: the higher the peak, the sooner it needs fixing.

A project by Snehal N Urs.

## What's in it

- **Report library** (`/reports`): 44 real products analyzed from public feedback, with search and categories.
- **Live analysis** (`/experience`): analyze any product on demand. Runs when an AI model is available (see below); the hosted site falls back to searching the library.

## Run locally

```bash
brew install ollama && brew services start ollama
ollama pull qwen3:8b
ollama pull nomic-embed-text
npm install
npm run dev
```

Open http://localhost:3000. A live analysis takes a few minutes on a laptop.

Optional settings go in `.env.local` (see `.env.local.example`):

- `ANTHROPIC_API_KEY`: analyze with Claude instead of the local model (faster, sharper).
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`: use the official Reddit API instead of its public feeds.
- `LIVE_ANALYSIS=on|off`: force live analysis on or off.

## Deploy

Deploys to Vercel as-is. Without an API key there's no model on the server, so live analysis is switched off and the site serves the report library. Add `ANTHROPIC_API_KEY` in Vercel to enable live analysis there.

## Regenerate the library

With the app running locally, add products to `src/data/catalog.json` and run:

```bash
node scripts/generate-reports.mjs http://localhost:3000
```

Existing reports are skipped; delete a file in `src/data/reports/` to redo it.

## How it works

- `src/lib/sources.ts` collects signals from Reddit (RSS feeds or the official API), the App Store reviews feed and Hacker News search.
- `src/lib/local.ts` is the local path: a small LLM names and scores themes from a sample, then embeddings assign every signal to its nearest theme and estimate sentiment.
- `src/lib/analyze.ts` is the Claude path, using structured outputs.
- `src/lib/terrain.ts` turns ranked themes into contour-map peaks.
- `src/app/api/analyze/route.ts` streams progress and the final report to the browser.
