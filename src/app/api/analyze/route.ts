import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { ProfileAnalysisSchema, computeFallbackAnalysis, IntakeAnswers } from "@/lib/scoring";
import { SYMPTOMS, CITATIONS } from "@/lib/research-data";

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
      (s) => `- ${s.key} ("${s.label}"): citations available: ${s.citations.map((c) => c.id).join(", ")}`
    ).join("\n");
    const citationReference = Object.values(CITATIONS)
      .map((c) => `- ${c.id}: ${c.title} (${c.authorsYear}, ${c.journal})`)
      .join("\n");

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
        `Symptom keys:\n${symptomReference}\n\nCitation reference:\n${citationReference}`,
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
