# Vera

Vera turns a few minutes of questions about PMOS (polyendocrine metabolic
ovarian syndrome, formerly known as PCOS) symptoms into an evidence-based
profile: a symptom radar chart, citation-backed insights, "what might help"
suggestions, and community comparisons, all traceable back to real research
or real (mock, illustrative) community data. It never diagnoses.

For a full explanation of how the app works end to end (the AI prompt,
the anti-hallucination grounding, the dataset, the fallback scorer, and how
to edit the content), see [`HOW_IT_WORKS.md`](HOW_IT_WORKS.md).

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### AI analysis (optional)

The app works out of the box with no configuration: without an API key it
falls back to a deterministic, rule-based scorer (see `HOW_IT_WORKS.md` §4),
so the demo never breaks. To enable live Claude analysis instead, set one of
these environment variables (e.g. in `.env.local`):

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or, if using the Vercel AI Gateway
AI_GATEWAY_API_KEY=...
```

## Project structure

- `src/app/`: pages (landing, intake, profile, check-in, community) and the
  `/api/analyze` route
- `src/lib/`: the research/community datasets, the AI prompt schema, and the
  fallback scorer
- `src/components/`: shared UI, including the interactive symptom radar
  chart
- `pdf-sources/`: ingested research PDFs used to ground AI answers in real
  source text (see `HOW_IT_WORKS.md` §3.5)
- `scripts/ingest-pdf.mjs`: turns a PDF into searchable text chunks

## Learn more about Next.js

This project is built with [Next.js](https://nextjs.org). See the
[Next.js documentation](https://nextjs.org/docs) for framework-level
questions, or [Vercel](https://vercel.com/docs/app/building-your-application/deploying)
for deployment.
