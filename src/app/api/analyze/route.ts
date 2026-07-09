import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { ProfileAnalysisSchema, computeFallbackAnalysis, IntakeAnswers } from "@/lib/scoring";
import { SYMPTOMS } from "@/lib/research-data";
import { ALL_CITATIONS, findRelevantChunks } from "@/lib/pdf-sources";
import { COMMUNITY_RECOMMENDATIONS } from "@/lib/community-data";

export const maxDuration = 60;

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

    // Two more reference lists, same "never invent, only pick from what's given" rule as
    // citations: what the research suggests helps, and what the community reports helped.
    const researchRecommendationReference = SYMPTOMS.filter((s) => s.recommendations?.length)
      .flatMap((s) => s.recommendations!.map((r) => `- (${s.key}) "${r.text}" (citations: ${r.citations.join(", ")})`))
      .join("\n");
    const communityRecommendationReference = COMMUNITY_RECOMMENDATIONS.map(
      (r) =>
        `- id=${r.id} (${r.symptom}): "${r.suggestion}" (${r.percentReportingHelpful}% of community members who tried this reported it helped)`
    ).join("\n");
    const supplementReference = SYMPTOMS.filter((s) => s.supplements?.length)
      .flatMap((s) => s.supplements!.map((r) => `- (${s.key}) "${r.text}" (citations: ${r.citations.join(", ")})`))
      .join("\n");

    const answeredFrequencies = Object.entries(body.frequencies)
      .map(([k, v]) => `${k}: ${v}/4`)
      .join(", ");

    const { object } = await generateObject({
      model,
      schema: ProfileAnalysisSchema,
      // Abort well before Vercel's own function timeout (maxDuration above) so a
      // slow/unresponsive provider hits our catch block and returns the fallback
      // analysis, rather than the whole function being killed with an opaque 504
      // that skips the catch entirely. Keep at least ~15s of headroom below
      // maxDuration for the fallback computation + response to complete.
      maxRetries: 1,
      timeout: 45_000,
      system:
        "You are a careful, evidence-based PMOS (polyendocrine metabolic ovarian syndrome, formerly known as PCOS, " +
        "renamed in 2026) symptom triage assistant. You never diagnose. " +
        "You only cite from the provided citation list by id, never invent studies or links. " +
        "Every insight's citationIds must come from the reference list below. " +
        "Symptom keys in dominantSymptoms and insights[].symptom must be chosen from the provided symptom key list exactly as written.\n\n" +
        "For each insight's `meaning`, write 1-2 sentences addressed directly to this specific person, explaining " +
        "what the `statement` means for them given their own answers, e.g. reference the severity they rated " +
        "this symptom (0-4) or something they mentioned in free text, and add relevant context (what it commonly " +
        "feels like, why it happens) so it reads as genuinely useful information, not just an acknowledgement. " +
        "Vary the phrasing across insights: do not default to a generic closing line like 'raise this with a " +
        "clinician' on every single one; that caveat is already covered once in `confidenceNote`. Do not " +
        "introduce any new research claim, citation, or study here, only interpret/personalize the statement " +
        "you already wrote.\n\n" +
        "For `recommendations`, only ever pick from the two reference lists below, never invent a suggestion, " +
        "a percentage, or a study that isn't listed. Set `symptom` to the exact symptom key shown in parentheses " +
        "next to the entry you picked. For a research-backed suggestion, set source='research' and " +
        "citationIds to (a subset of) that suggestion's listed citations. For a community-backed suggestion, set " +
        "source='community' and communityRecommendationId to the exact id shown, never make up a percentage " +
        "yourself. Always phrase community suggestions as what other members report trying, not as medical advice. " +
        "If neither list has anything relevant to this person's dominant symptoms, return an empty recommendations array.\n\n" +
        "For `supplements`, only ever pick from the supplement reference list below, never invent a supplement, " +
        "a study, or a health claim beyond what's listed. Set `symptom` to the exact symptom key shown in " +
        "parentheses next to the entry you picked. Always frame these as things to discuss with a doctor " +
        "or pharmacist before starting, not as a standalone recommendation. If nothing in the list is relevant to " +
        "this person's dominant symptoms, return an empty supplements array.\n\n" +
        "For `symptomOverviews`, produce exactly one entry per symptom key in `dominantSymptoms`, each a 1-2 " +
        "sentence synthesis based only on the insights/recommendations/supplements you already produced for that " +
        "symptom elsewhere in this same response, do not introduce any new claim, study, or citation here.\n\n" +
        `Symptom keys:\n${symptomReference}\n\nCitation reference:\n${citationReference}${excerptsBlock}\n\n` +
        `Research-backed recommendations available:\n${researchRecommendationReference || "(none)"}\n\n` +
        `Community-reported recommendations available:\n${communityRecommendationReference || "(none)"}\n\n` +
        `Supplement suggestions available:\n${supplementReference || "(none)"}`,
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
