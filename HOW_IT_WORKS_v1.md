# PCOS Companion — How It Works (Team Guide)

This doc explains the app in plain language: what happens when a user goes
through it, exactly what we tell the AI, where our "facts" come from, and how
anyone on the team — technical or not — can update the data.

No coding experience required to read this. A few sections show real code
snippets so you can see exactly what's running, but each one is explained in
words first.

---

## 1. The user journey, in one picture

```
User answers 5 symptom questions + 2 free-text questions  (the "Intake")
                        │
                        ▼
        We send those answers to our /api/analyze endpoint
                        │
                        ▼
   Do we have a Claude API key configured?
        │                                   │
       YES                                  NO
        │                                   │
        ▼                                   ▼
  Ask Claude to analyze          Use our own scoring formula
  the answers (see §2)           instead (see §4)
        │                                   │
        └───────────────┬───────────────────┘
                         ▼
      Either way, we get back the same shape of result:
      - a % likelihood score
      - the person's "dominant symptoms"
      - a few evidence-based insights, each with a citation
                         │
                         ▼
       Shown on the Profile page, saved on the user's device
```

The key design decision: **the app never breaks**, even with no API key, no
internet flakiness, or an AI error mid-demo. If anything goes wrong asking
Claude, we silently fall back to our own rule-based scorer. The user never
sees an error — they just get a slightly less nuanced (but still accurate)
profile.

---

## 2. What we actually ask Claude to do

This lives in [`src/app/api/analyze/route.ts`](src/app/api/analyze/route.ts).
Here is the real prompt, in two parts: a **system prompt** (the standing
instructions/rules) and a **user prompt** (this specific person's answers).

### System prompt (the rules Claude must always follow)

> You are a careful, evidence-based PCOS symptom triage assistant. You never
> diagnose. You only cite from the provided citation list by id — never
> invent studies or links. Every insight's citationIds must come from the
> reference list below. Symptom keys in dominantSymptoms and insights[].symptom
> must be chosen from the provided symptom key list exactly as written.
>
> *(followed by the full list of symptom keys and the full list of allowed
> citations — see §3 below for what that list actually contains)*

**Why it's written this way:**
- *"You never diagnose"* — this is a legal/ethical guardrail. The app is a
  screening/education tool, not a medical device.
- *"You only cite from the provided citation list... never invent"* — this is
  the single most important line in the whole app. It stops Claude from
  hallucinating a fake study. It can only ever point to the ~10 real citations
  we've curated ourselves (§3). If Claude can't find a good match, it should
  still only pick from that list, not make one up.
- *"must be chosen from the provided symptom key list exactly as written"* —
  this keeps Claude's answer in a format our UI code already knows how to
  display (so a symptom name always matches a real entry in our data, and
  never a typo or synonym the UI wouldn't recognise).

### User prompt (built fresh for each person)

```
Frequency answers (0=never,4=almost always): irregular_periods: 3/4, weight_gain: 2/4, ...
What they've tried so far: <whatever the user typed>
Other symptoms mentioned: <whatever the user typed>

Analyze this and produce the structured profile.
```

### The shape of the answer we require

We don't just ask Claude to "write something back" — we force its answer into
a strict template (technically: a schema) so the app always knows exactly
what fields to expect. It must always return:

| Field | What it is |
|---|---|
| `likelihoodPercent` | A number 0–97 (never 100, because this is never a diagnosis) |
| `confidenceNote` | One sentence reminding the user this isn't a diagnosis |
| `dominantSymptoms` | The 2–4 symptoms that stood out most |
| `insights` | 3–5 evidence statements, each tagged with which citation(s) back it up |
| `summary` | A warm, 2–3 sentence summary written to the user |

This template lives in [`src/lib/scoring.ts`](src/lib/scoring.ts) as
`ProfileAnalysisSchema`.

---

## 2.5. How the AI's answer is actually "grounded" — and why it can't fake a source

People often ask: *"couldn't Claude just make up a citation?"* Here's exactly
how we stop that, in three layers — and it's important to know that only the
**last layer is a hard guarantee**. The first two are just strong instructions.

**Layer 1 — we hand Claude the whole allowed list, every single time.**
There's no hidden database Claude is "reading" from. On every request, our
code pulls the full symptom list and full citation list straight out of
[`src/lib/research-data.ts`](src/lib/research-data.ts) and pastes them as
plain text into the system prompt (`route.ts` lines 22–28, 42). Claude
literally cannot see anything beyond what we paste in for that one request —
there's no wider internet or paper archive it's pulling from.

**Layer 2 — we tell it firmly to stick to that list.**
The system prompt says: *"You only cite from the provided citation list by
id — never invent studies or links."* This is a strong nudge, and Claude
follows instructions like this very reliably in practice — but it's still
just an instruction. Nothing in the code physically stops the model from
writing an id that isn't real, the same way nothing stops a person from
ignoring an instruction.

**Layer 3 — the part that makes it structurally impossible for a fake
citation to reach the screen.**
This is the actual safety net, and it lives in the display code, not the AI
call. In [`src/app/profile/page.tsx`](src/app/profile/page.tsx), when we go
to show a citation link, we do this:

```ts
const c = CITATIONS[id];   // look the id up in OUR dictionary, not Claude's answer
if (!c) return null;       // if it's not a real entry, show nothing
```

`CITATIONS` is our own file — Claude has no way to add to it or change it.
So even in the unlikely event Claude *did* invent an id like `"smith2024"`,
the lookup simply returns nothing, and that citation badge silently doesn't
render. There is no code path that can turn an AI-invented id into a
clickable link or a fake DOI. Worst case, an insight shows up with no source
badge next to it — it can never show a *wrong* one.

**In short:** Layers 1–2 make hallucination unlikely (Claude is only ever
shown real sources and told firmly to stay within them). Layer 3 is what
makes it actually impossible for a fabricated source to be presented to the
user as real — because rendering a citation depends on matching *our* data,
not on trusting the AI's output.

---

## 3. Our current dataset — where the "facts" come from

Everything the AI (and the fallback scorer) is allowed to say is grounded in
one file: [`src/lib/research-data.ts`](src/lib/research-data.ts). Nothing on
the Profile page is made up on the spot — it always traces back to an entry
in this file.

It has two parts:

### A) The citation library (`CITATIONS`)

A list of ~10 real, published PCOS studies/guidelines. Each one looks like
this:

```ts
teede2018: {
  id: "teede2018",
  title: "Recommendations from the international evidence-based guideline...",
  authorsYear: "Teede et al., 2018",
  journal: "Human Reproduction",
  url: "https://doi.org/10.1093/humrep/dey256",
  summary: "International guideline synthesizing evidence on diagnosis...",
},
```

This is what turns into the clickable citation links on the Profile page.

> ⚠️ **Demo disclaimer**: for hackathon speed, these citations are curated to
> reflect real, well-known PCOS research themes, but the `summary` text is our
> own paraphrase, not a verbatim quote. Before using this beyond a demo, each
> entry should be checked against the actual paper by someone with
> literature-review experience.

### B) The symptom list (`SYMPTOMS`)

Ten symptoms (irregular periods, acne, excess hair growth, hair loss, weight
gain, fatigue, mood changes, cravings/blood sugar, fertility concerns, pelvic
pain). Each symptom links to 1–2 citations from above, plus one or two
plain-English "insight" sentences — these are the evidence-based statements
that show up on the Profile page.

```ts
{
  key: "irregular_periods",
  label: "Irregular or absent periods",
  description: "Cycles longer than 35 days, unpredictable timing, or missed periods.",
  citations: [CITATIONS.teede2018, CITATIONS.legro2013],
  insights: [
    "Irregular ovulation is one of the three core diagnostic criteria for PCOS...",
  ],
},
```

### C) Community data (`src/lib/community-data.ts`)

This is **entirely mock/illustrative data** for the demo — a stand-in for
what would eventually be real, anonymised, opted-in user statistics. It has:
- `COMMUNITY_BASELINES` — e.g. "78% of community members also report
  irregular periods"
- `COMMUNITY_STATS` — headline numbers like "27 months average time to
  diagnosis"
- `FORUM_POSTS` — five sample forum posts with fake authors, used on the
  Community page

---

## 4. What happens with no AI key (the fallback scorer)

Lives in [`src/lib/scoring.ts`](src/lib/scoring.ts) as
`computeFallbackAnalysis`. In plain terms:

1. Each symptom question has a "how much does this matter" weight (e.g.
   irregular periods and hair growth count for more than acne, because
   they're closer to the official diagnostic criteria).
2. We also scan the free-text answers for keywords (e.g. "tired" → boosts
   fatigue, "anxious"/"mood" → boosts mood changes) so the two open-ended
   questions still influence the result even without AI.
3. We add up (frequency × weight) across all symptoms, turn that into a 5–95%
   score, and pick the top 2–4 scoring symptoms as "dominant."
4. For each dominant symptom, we just pull its first pre-written insight and
   citations straight out of the dataset in §3 — no generation happening,
   just a lookup.

This is why the fallback and the AI path always look the same shape on
screen: they're both just filling in the same template, one with a formula,
one with Claude.

---

## 5. How to modify the dataset (no coding needed beyond editing text)

All of the files below are plain TypeScript, but the actual **content** you'd
want to change is just text and numbers inside `{ }` blocks — you don't need
to understand the code around it.

### To add or edit a research citation
Open `src/lib/research-data.ts` → find the `CITATIONS` object → copy an
existing entry's shape, paste it as a new one, and fill in the real title,
authors/year, journal, link, and a short summary in your own words.

### To add or edit a symptom (and its insight statements)
Same file → find the `SYMPTOMS` list → copy an existing entry, change the
`label`, `description`, which `citations` it points to (must match an `id`
from `CITATIONS`), and the `insights` sentences.

### To change the 5 intake questions
Open `src/lib/questions.ts` → `INTAKE_QUESTIONS` → edit the `prompt` (the
question text) or `helper` (the small grey subtext) for any of the 5
questions. The `id` must match a symptom key from `research-data.ts`.

### To change community stats or forum posts
Open `src/lib/community-data.ts`:
- `COMMUNITY_BASELINES` — change the percentages per symptom
- `COMMUNITY_STATS` — change the headline numbers (total users, months to
  diagnosis, etc.)
- `FORUM_POSTS` — add/edit/remove sample posts (author name, title, body,
  which symptoms it's tagged with)

### To change what Claude is told (the prompt itself)
Open `src/app/api/analyze/route.ts` → the `system` and `prompt` strings
described in §2. Editing the wording here changes the AI's tone and rules
directly — useful if we want it to sound more clinical, more casual, ask
about different things, etc.

---

## 6. Quick file map

| File | What it controls |
|---|---|
| `src/app/api/analyze/route.ts` | The AI prompt + fallback trigger logic |
| `src/lib/scoring.ts` | The answer template (schema) + fallback scoring formula |
| `src/lib/research-data.ts` | **The dataset**: citations + symptoms + insights |
| `src/lib/community-data.ts` | **Mock dataset**: community stats + forum posts |
| `src/lib/questions.ts` | The 5 intake questions + 2 free-text prompts |
| `src/lib/storage.ts` | Saves the user's profile/check-ins on their own device |
| `src/app/intake/page.tsx` | The question-by-question intake screen |
| `src/app/profile/page.tsx` | The results screen (score, insights, citations, community) |
| `src/app/checkin/page.tsx` | The weekly check-in screen |
| `src/app/community/page.tsx` | The mock forum screen |
