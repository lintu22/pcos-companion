import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { ProfileAnalysisSchema, computeFallbackAnalysis, IntakeAnswers } from "@/lib/scoring";
import { SYMPTOMS } from "@/lib/research-data";
import { ALL_CITATIONS, findRelevantChunks } from "@/lib/pdf-sources";

export const maxDuration = 30;

// Direct Anthropic key takes precedence (no Gateway account needed); otherwise use
// the AI Gateway model string, which also works via Vercel's OIDC token when deployed.
const model = process.env.ANTHROPIC_API_KEY ? anthropic("claude-sonnet-5") : "anthropic/claude-sonnet-5";
const hasLiveKey = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.VERCEL_OIDC_TOKEN);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as IntakeAnswers;

  if (!hasLiveKey) {
    const fallback = computeFallbackAnalysis(body);
    return NextResponse.json({ ...fallback, source: "fallback" });
  }

  try {
    const symptomReference = SYMPTOMS.map(
      (s) => `- ${s.key} ("${s.label}"): citations available: ${s.citations.join(", ")}`
    ).join("\n");
    const citationReference = Object.values(ALL_CITATIONS)
      .map((c) => `- ${c.id}: ${c.title} (${c.authorsYear}, ${c.journal})`)
      .join("\n");

    // Pull a few real excerpts from ingested PDFs that match this person's answers,
    // so Claude can ground insights in actual source text, not just our paraphrases.
    const mentionedSymptomLabels = Object.entries(body.frequencies)
      .filter(([, v]) => (v ?? 0) >= 2)
      .map(([key]) => SYMPTOMS.find((s) => s.key === key)?.label ?? key);
    const freeTextWords = `${body.triedSoFar} ${body.otherSymptoms}`
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const relevantExcerpts = findRelevantChunks([...mentionedSymptomLabels, ...freeTextWords], 4);
    const excerptsBlock = relevantExcerpts.length
      ? "\n\nSupporting excerpts from source documents (you may quote or paraphrase these, but must " +
        "cite using the matching id, exactly as shown in brackets):\n" +
        relevantExcerpts
          .map((r) => `- [${r.docId}] (p.${r.chunk.page}) "${r.chunk.text}"`)
          .join("\n")
      : "";

    const answeredFrequencies = Object.entries(body.frequencies)
      .map(([k, v]) => `${k}: ${v}/4`)
      .join(", ");

    const { object } = await generateObject({
      model,
      schema: ProfileAnalysisSchema,
      system:
        "You are a careful, evidence-based PCOS symptom triage assistant. You never diagnose. " +
        "You only cite from the provided citation list by id — never invent studies or links. " +
        "Every insight's citationIds must come from the reference list below. " +
        "Symptom keys in dominantSymptoms and insights[].symptom must be chosen from the provided symptom key list exactly as written.\n\n" +
        `Symptom keys:\n${symptomReference}\n\nCitation reference:\n${citationReference}${excerptsBlock}`,
      prompt:
        `Frequency answers (0=never,4=almost always): ${answeredFrequencies || "none provided"}\n` +
        `What they've tried so far: ${body.triedSoFar || "(nothing shared)"}\n` +
        `Other symptoms mentioned: ${body.otherSymptoms || "(none)"}\n\n` +
        "Analyze this and produce the structured profile.",
    });

    return NextResponse.json({ ...object, source: "ai" });
  } catch (err) {
    console.error("AI analysis failed, using fallback:", err);
    const fallback = computeFallbackAnalysis(body);
    return NextResponse.json({ ...fallback, source: "fallback" });
  }
}
