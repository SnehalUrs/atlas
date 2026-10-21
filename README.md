# Atlas

**Find your way to what users want.** Atlas reads public feedback about a product (Reddit, App Store reviews, Hacker News), groups it into themes and ranks each one by emotional intensity, recurrence and the user segment it affects. Each report is drawn as a topographic map: the higher the peak, the sooner it needs fixing.

A project by Snehal N Urs.

## How analysis runs

- **Locally**, every analysis runs live against fresh public feedback (see below).
- **Online**, there's no AI model on the server, so the analysis page opens saved reports for 44 well-known products (`src/data/reports/`, generated with the local pipeline). Add `ANTHROPIC_API_KEY` in Vercel to analyze any product live there too.

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

Deploys to Vercel as-is, with no environment variables needed. Without an API key, live analysis is switched off online and saved reports are served instead.

## Regenerate saved reports

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

## License

Copyright © 2026 Snehal N Urs. All rights reserved. This code is shared for viewing as part of a portfolio only; you may not copy, modify, distribute or reuse it without written permission. See [LICENSE](LICENSE).
