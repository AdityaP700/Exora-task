# Exora 
<img width="1916" height="937" alt="image" src="https://github.com/user-attachments/assets/2e577a12-5331-4363-97f2-9c29ffe8dcd4" />

A Next.js app that streams a VC-grade competitive briefing progressively: instant company overview and founders, followed by news, competitor updates, sentiment analysis, and an executive summary. All external API calls are globally rate-limited to respect provider constraints.

## Why this architecture

- Progressive delivery: Users see value immediately (overview + founders/socials) while deeper analysis loads in the background.
- Global rate limiting: A shared concurrency limiter guarantees no more than 5 external requests run in parallel, preventing API 429s and smoothing load.
- Resilient providers: Exa (news/mentions) + Groq/OpenAI/Gemini (LLMs) with clean fallbacks ensure reliable results.
- Familiar, fast stack: Next.js App Router, React, TypeScript, Tailwind, and Recharts provide great DX and performance.

## Tech stack and rationale

- Next.js (App Router): Serverless API routes and React Server/Client components with great DX, edge-friendly primitives, and streaming support.
- React + TypeScript: Strong typing and component ergonomics for complex UI flow and staged data.
- Tailwind CSS: Rapid iteration for premium, dark-themed UI.
- Recharts: Reliable charts for sentiment, momentum, and pulse comparisons.
- Exa API: High-signal mentions/signals for news; optional NewsAPI fallback available in the standard route.
- Groq/OpenAI/Gemini: LLMs for TL;DR, competitor discovery, sentiment scoring, and summary. We prefer Groq for speed and cost, Gemini for fast summaries, OpenAI as a quality fallback.
- Global Concurrency Limiter: `lib/limiter.ts` enforces a 5-concurrent cap across all external calls.

## Progressive data flow

1. Company Overview (instant): One-sentence TL;DR.
2. Founders + Socials (immediate): Key people and profile links.
3. Company News (early): Top 3 latest relevant headlines for the company.
4. Competitor News (next): Latest 4 headlines across competitors.
5. Sentiment & Metrics (later): Momentum, sentiment, pulse indices for all domains.
6. Executive Summary (last): 3 concise, executive-level insights.

## Backend architecture

- Standard route (batch): `app/api/briefing/route.ts` builds the full briefing response at once (kept for back-compat).
- Streaming route (progressive): `app/api/briefing/stream/route.ts` emits Server-Sent Events (SSE) in stages:
	- `overview`, `founders`, `socials`, `competitors`, `company-news`, `competitor-news`, `sentiment`, `summary`, `done`.
- Rate limiting: `lib/limiter.ts` exposes a shared limiter used by:
	- `lib/exa-service.ts`: all Exa requests
	- `lib/llm-service.ts`: Groq/OpenAI/Gemini calls

## Frontend architecture

- Main page `app/page.tsx` subscribes to SSE and updates the UI per event.
- Overview view: `CompanyOverviewCard` + `NewsFeed` + `CompetitorNews` show progressively.
- Analysis view: Shows `CompetitorBarChart` and charts once `sentiment` arrives; displays loaders otherwise.
- Summary view: Shows TL;DR immediately and fills executive bullets after `summary`.

## Rate limit strategy

- Hard cap: At most 5 concurrent external calls at any moment across the app.
- Batched calls: Competitor news are fetched concurrently but pass through the limiter.
- LLM calls: Always scheduled through the same limiter to avoid spikes.

## Env configuration

Create `.env.local` with keys (only read server-side):

- `EXA_API_KEY` (required)
- `GROQ_API_KEY` (optional but recommended)
- `OPENAI_API_KEY` (optional)
- `GEMINI_API_KEY` (optional)
- `NEWS_API_KEY` (optional; used by batch route as fallback)

## Run locally

- Install deps
- Start dev server

```powershell
# From the exora folder
npm install
npm run dev
```

Open http://localhost:3000 and enter a company domain (e.g., stripe.com).

## Try the streaming route directly

Use your browser’s devtools or curl-like tools to hit:

```
GET /api/briefing/stream?domain=stripe.com
```

You’ll receive events like:

```
event: overview
{ "domain": "stripe.com", "overview": "Stripe is a payments platform..." }
```

## Files of interest

- `app/api/briefing/stream/route.ts` - SSE endpoint, orchestrates staged work.
- `lib/limiter.ts` - Global concurrency limiter.
- `lib/exa-service.ts` - Exa calls, rate-limited.
- `lib/llm-service.ts` - Groq/OpenAI/Gemini calls, rate-limited.
- `app/page.tsx` - Consumes the stream and renders progressively.

## Notes & future improvements

- Add source badges (Exa/NewsAPI) to news cards for transparency.
- Cache competitor discovery per domain to reduce LLM calls.
- Persist partial results to localStorage during streaming for refresh resilience.
- Optional: WebSocket transport for bi-directional interactions; SSE suffices for unidirectional streams.

---

Built for fast, progressive intelligence with a premium UX.
