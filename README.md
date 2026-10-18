# Atlas

**Find your way to what users want.** Atlas reads public feedback about any product (Reddit, App Store reviews, Hacker News) and ranks the friction underneath it by emotional intensity, recurrence and segment impact.

Designed & built by Snehal N Urs.

## Run locally (free, no API key)

```bash
brew install ollama && brew services start ollama
ollama pull qwen3:8b
ollama pull nomic-embed-text
npm install
npm run dev
```

Open http://localhost:3000. A full analysis takes a few minutes on a 16 GB Mac. `/experience?sample=1` shows a sample report instantly.

## Optional: use Claude instead

Put `ANTHROPIC_API_KEY=...` in `.env.local` (see `.env.local.example`). With a key set, analysis runs on Claude, which is faster and labels every signal directly. Set `LLM_PROVIDER=ollama` to force the local path.

## How it works

- `src/lib/sources.ts` collects signals. Reddit uses the official API when `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET` are set, otherwise its public RSS feeds (rate-limited).
- `src/lib/local.ts` is the free path: a local LLM names and scores themes from a sample, then embeddings assign every signal to its nearest theme and estimate sentiment.
- `src/lib/analyze.ts` is the Claude path, using structured outputs; counts come from the signal ids Claude assigns.
- `src/app/api/analyze/route.ts` streams progress and the final report as NDJSON to `/experience`.
- Brand name, tagline and author live in `src/lib/brand.ts`.
