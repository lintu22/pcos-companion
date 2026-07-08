import { SymptomKey } from "./research-data";

export type FrequencyValue = 0 | 1 | 2 | 3 | 4;

export const FREQUENCY_LABELS: Record<FrequencyValue, string> = {
  0: "Never",
  1: "Rarely",
  2: "Sometimes",
  3: "Often",
  4: "Almost always",
};

export interface IntakeQuestion {
  id: SymptomKey;
  prompt: string;
  helper: string;
}

// 5 core symptom-frequency questions (kept to 5 per the brief; remaining SYMPTOMS
// entries are used for richer profile/insight matching once we have free-text too).
export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "irregular_periods",
    prompt: "How often are your periods irregular, unpredictable, or absent?",
    helper: "Think about the last 6 months of cycles.",
  },
  {
    id: "weight_gain",
    prompt: "How often do you experience weight gain or difficulty losing weight, especially around your midsection?",
    helper: "Even with consistent diet/exercise.",
  },
  {
    id: "hair_growth",
    prompt: "How often do you notice excess hair growth on your face, chest, or back?",
    helper: "Coarse, dark hair rather than fine/vellus hair.",
  },
  {
    id: "acne",
    prompt: "How often do you get adult acne, especially along the jawline or chin?",
    helper: "Persistent breakouts that don't follow typical teenage patterns.",
  },
  {
    id: "cravings_blood_sugar",
    prompt: "How often do you get intense sugar/carb cravings or energy crashes after eating?",
    helper: "Shakiness, crashes, or strong cravings between meals.",
  },
];

export interface FreeTextPrompt {
  id: "tried_so_far" | "other_symptoms";
  prompt: string;
  placeholder: string;
}

export const FREE_TEXT_PROMPTS: FreeTextPrompt[] = [
  {
    id: "tried_so_far",
    prompt: "What have you already tried (supplements, diets, medication, doctors) and how did it go?",
    placeholder: "e.g. Cut out sugar for a month, tried inositol, saw a GP who said it's normal...",
  },
  {
    id: "other_symptoms",
    prompt: "Anything else going on that we haven't asked about? (fatigue, mood, hair thinning, fertility, pain, etc.)",
    placeholder: "e.g. Also very tired all the time, some hair thinning at my part...",
  },
];
