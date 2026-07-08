import { z } from "zod";
import { FrequencyValue } from "./questions";
import { SYMPTOMS, SymptomKey, getSymptomInfo } from "./research-data";
import { COMMUNITY_RECOMMENDATIONS } from "./community-data";

export const InsightSchema = z.object({
  symptom: z.string(),
  statement: z.string(),
  citationIds: z.array(z.string()),
});

// A recommendation must always be grounded in one of the two lists we hand the
// model — never a bare suggestion. "research" ones carry citationIds (same
// rule as insights); "community" ones carry a communityRecommendationId that
// must match a real entry, so the UI can show its real % and source posts.
export const RecommendationSchema = z.object({
  text: z.string(),
  source: z.enum(["research", "community"]),
  citationIds: z.array(z.string()).default([]),
  communityRecommendationId: z.string().optional(),
});

export const ProfileAnalysisSchema = z.object({
  likelihoodPercent: z
    .number()
    .min(0)
    .max(97)
    .describe(
      "Estimated likelihood the described symptom pattern is consistent with PCOS, as a screening signal only — never a diagnosis."
    ),
  confidenceNote: z
    .string()
    .describe("One sentence caveat that this is not a diagnosis and encourages clinical follow-up."),
  dominantSymptoms: z
    .array(z.string())
    .describe("2-4 symptom keys (from the provided list) that stand out most in this profile."),
  insights: z
    .array(InsightSchema)
    .describe("3-5 evidence-based statements tied to the user's dominant symptoms, each referencing citation ids from the provided research list."),
  recommendations: z
    .array(RecommendationSchema)
    .describe(
      "2-5 actionable suggestions for the user's dominant symptoms, each grounded in either the research recommendation list (source: research, with citationIds) or the community recommendation list (source: community, with communityRecommendationId). Never invent a suggestion beyond these two lists."
    ),
  summary: z.string().describe("A warm, empowering 2-3 sentence summary written directly to the user."),
});

export type ProfileAnalysis = z.infer<typeof ProfileAnalysisSchema>;

export interface IntakeAnswers {
  frequencies: Partial<Record<SymptomKey, FrequencyValue>>;
  triedSoFar: string;
  otherSymptoms: string;
}

const KEYWORD_MAP: { pattern: RegExp; symptom: SymptomKey; weight: FrequencyValue }[] = [
  { pattern: /tired|fatigue|exhaust|no energy|drained/i, symptom: "fatigue", weight: 3 },
  { pattern: /anxious|anxiety|mood|depress|low mood|irritable/i, symptom: "mood_changes", weight: 3 },
  { pattern: /hair (thin|loss|falling)|thinning|bald/i, symptom: "hair_loss", weight: 3 },
  { pattern: /conceiv|fertilit|pregnan|trying for a baby/i, symptom: "fertility_concerns", weight: 3 },
  { pattern: /pelvic|cramp|ovary pain|ovarian pain/i, symptom: "pelvic_pain", weight: 2 },
];

/**
 * Deterministic fallback scorer used when no LLM key is configured, so the demo
 * never breaks. Weighted toward the 3 Rotterdam-criteria-adjacent symptoms.
 */
export function computeFallbackAnalysis(answers: IntakeAnswers): ProfileAnalysis {
  const freq = answers.frequencies;
  const weights: Partial<Record<SymptomKey, number>> = {
    irregular_periods: 1.4,
    hair_growth: 1.2,
    acne: 0.9,
    weight_gain: 1.0,
    cravings_blood_sugar: 0.9,
  };

  const derivedFrequencies: Partial<Record<SymptomKey, number>> = { ...freq };
  const freeText = `${answers.triedSoFar} ${answers.otherSymptoms}`.toLowerCase();
  for (const { pattern, symptom, weight } of KEYWORD_MAP) {
    if (pattern.test(freeText)) {
      derivedFrequencies[symptom] = Math.max(derivedFrequencies[symptom] ?? 0, weight);
    }
  }

  let scoreSum = 0;
  let maxSum = 0;
  const symptomScores: { symptom: SymptomKey; score: number }[] = [];

  for (const [key, value] of Object.entries(derivedFrequencies)) {
    if (value === undefined) continue;
    const w = weights[key as SymptomKey] ?? 0.6;
    scoreSum += value * w;
    maxSum += 4 * w;
    symptomScores.push({ symptom: key as SymptomKey, score: value * w });
  }

  const likelihoodRaw = maxSum > 0 ? (scoreSum / maxSum) * 100 : 10;
  const likelihoodPercent = Math.min(95, Math.max(5, Math.round(likelihoodRaw)));

  const dominant = symptomScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .filter((s) => s.score > 0)
    .map((s) => s.symptom);

  const insights = dominant.slice(0, 5).map((symptomKey) => {
    const info = getSymptomInfo(symptomKey);
    const statement = info?.insights[0] ?? "This symptom is tracked in current PCOS literature.";
    const citationIds = info?.citations ?? [];
    return { symptom: symptomKey, statement, citationIds };
  });

  const recommendations: ProfileAnalysis["recommendations"] = [];
  for (const symptomKey of dominant) {
    const info = getSymptomInfo(symptomKey);
    for (const rec of info?.recommendations ?? []) {
      recommendations.push({ text: rec.text, source: "research", citationIds: rec.citations });
    }
    for (const rec of COMMUNITY_RECOMMENDATIONS.filter((r) => r.symptom === symptomKey)) {
      recommendations.push({ text: rec.suggestion, source: "community", citationIds: [], communityRecommendationId: rec.id });
    }
  }

  const dominantLabels = dominant
    .map((d) => SYMPTOMS.find((s) => s.key === d)?.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return {
    likelihoodPercent,
    confidenceNote:
      "This is a screening signal based on symptom patterns, not a diagnosis — please share this profile with a doctor for confirmation.",
    dominantSymptoms: dominant,
    insights,
    recommendations: recommendations.slice(0, 5),
    summary: dominantLabels
      ? `Your answers show a pattern most consistent with ${dominantLabels}. That combination shows up often in PCOS research, and there's solid evidence behind ways to understand and manage it.`
      : "Your answers don't show a strong symptom pattern yet — that's genuinely useful information too. Keep checking in as things change.",
  };
}
