// Mock evidence base. In production these would be pulled from a live literature
// database (PubMed/Semantic Scholar) — for this demo they are curated, illustrative
// entries loosely reflecting real PCOS literature themes, not verbatim quotes.

export type SymptomKey =
  | "irregular_periods"
  | "acne"
  | "hair_growth"
  | "hair_loss"
  | "weight_gain"
  | "fatigue"
  | "mood_changes"
  | "cravings_blood_sugar"
  | "fertility_concerns"
  | "pelvic_pain";

export interface Citation {
  id: string;
  title: string;
  authorsYear: string;
  journal: string;
  url: string;
  summary: string;
}

export interface SymptomInfo {
  key: SymptomKey;
  label: string;
  description: string;
  citations: Citation[];
  insights: string[]; // evidence-based statements, paired 1:1 with citations by index where possible
}

export const CITATIONS: Record<string, Citation> = {
  teede2018: {
    id: "teede2018",
    title: "Recommendations from the international evidence-based guideline for the assessment and management of PCOS",
    authorsYear: "Teede et al., 2018",
    journal: "Human Reproduction",
    url: "https://doi.org/10.1093/humrep/dey256",
    summary:
      "International guideline synthesizing evidence on diagnosis, lifestyle management, and treatment priorities for PCOS.",
  },
  azziz2016: {
    id: "azziz2016",
    title: "Polycystic ovary syndrome",
    authorsYear: "Azziz et al., 2016",
    journal: "Nature Reviews Disease Primers",
    url: "https://doi.org/10.1038/nrdp.2016.57",
    summary:
      "Comprehensive review of PCOS pathophysiology, including insulin resistance and hyperandrogenism mechanisms.",
  },
  escobarmorreale2018: {
    id: "escobarmorreale2018",
    title: "Polycystic ovary syndrome: definition, aetiology, diagnosis and treatment",
    authorsYear: "Escobar-Morreale, 2018",
    journal: "Nature Reviews Endocrinology",
    url: "https://doi.org/10.1038/nrendo.2018.24",
    summary:
      "Review covering hyperandrogenic symptoms (acne, hirsutism, alopecia) and their hormonal drivers in PCOS.",
  },
  legro2013: {
    id: "legro2013",
    title: "Diagnosis and treatment of polycystic ovary syndrome: an Endocrine Society clinical practice guideline",
    authorsYear: "Legro et al., 2013",
    journal: "Journal of Clinical Endocrinology & Metabolism",
    url: "https://doi.org/10.1210/jc.2013-2350",
    summary:
      "Clinical guideline on diagnostic criteria and management, including metabolic and fertility considerations.",
  },
  moran2013: {
    id: "moran2013",
    title: "Lifestyle changes in women with polycystic ovary syndrome (Cochrane review)",
    authorsYear: "Moran et al., 2013",
    journal: "Cochrane Database of Systematic Reviews",
    url: "https://doi.org/10.1002/14651858.CD007506.pub3",
    summary:
      "Systematic review of lifestyle intervention trials (diet, exercise) and their effect on PCOS symptoms.",
  },
  cooney2017: {
    id: "cooney2017",
    title: "High prevalence of moderate and severe depressive and anxiety symptoms in PCOS: a systematic review and meta-analysis",
    authorsYear: "Cooney et al., 2017",
    journal: "Human Reproduction",
    url: "https://doi.org/10.1093/humrep/dex044",
    summary:
      "Meta-analysis finding significantly elevated rates of depression and anxiety symptoms among people with PCOS.",
  },
  lim2012: {
    id: "lim2012",
    title: "Overweight, obesity and central obesity in women with polycystic ovary syndrome: a systematic review and meta-analysis",
    authorsYear: "Lim et al., 2012",
    journal: "Human Reproduction Update",
    url: "https://doi.org/10.1093/humupd/dms030",
    summary:
      "Meta-analysis quantifying the increased prevalence of overweight/obesity and central adiposity in PCOS.",
  },
  stepto2013: {
    id: "stepto2013",
    title: "Women with PCOS have intrinsic insulin resistance on euglycaemic-hyperinsulaemic clamp",
    authorsYear: "Stepto et al., 2013",
    journal: "Human Reproduction",
    url: "https://doi.org/10.1093/humrep/det278",
    summary:
      "Clamp-study evidence that insulin resistance in PCOS is intrinsic, independent of body weight, in many patients.",
  },
  balen2016: {
    id: "balen2016",
    title: "The management of anovulatory infertility in women with polycystic ovary syndrome",
    authorsYear: "Balen et al., 2016",
    journal: "Human Reproduction Update",
    url: "https://doi.org/10.1093/humupd/dmw012",
    summary:
      "ESHRE guideline review on ovulatory dysfunction and fertility management approaches in PCOS.",
  },
  gibsonhelm2017: {
    id: "gibsonhelm2017",
    title: "Delayed diagnosis and a lack of information associated with dissatisfaction in women with PCOS",
    authorsYear: "Gibson-Helm et al., 2017",
    journal: "Journal of Clinical Endocrinology & Metabolism",
    url: "https://doi.org/10.1210/jc.2016-2963",
    summary:
      "Survey study documenting average diagnostic delay and patient dissatisfaction with information received.",
  },
};

export const SYMPTOMS: SymptomInfo[] = [
  {
    key: "irregular_periods",
    label: "Irregular or absent periods",
    description: "Cycles longer than 35 days, unpredictable timing, or missed periods.",
    citations: [CITATIONS.teede2018, CITATIONS.legro2013],
    insights: [
      "Irregular ovulation is one of the three core diagnostic criteria for PCOS under the Rotterdam consensus, alongside hyperandrogenism and polycystic ovarian morphology.",
      "Cycle irregularity in PCOS is driven by disrupted LH pulsatility and anovulation, not just 'stress' — guidelines recommend it as a primary red flag to raise with a clinician.",
    ],
  },
  {
    key: "acne",
    label: "Persistent or adult-onset acne",
    description: "Acne along the jawline, chin, or chest that doesn't respond to typical skincare.",
    citations: [CITATIONS.escobarmorreale2018],
    insights: [
      "Jawline/chin acne in adults is a recognised sign of hyperandrogenism, one of the three Rotterdam diagnostic criteria for PCOS.",
    ],
  },
  {
    key: "hair_growth",
    label: "Excess facial/body hair (hirsutism)",
    description: "Coarse hair growth on the face, chest, or back.",
    citations: [CITATIONS.escobarmorreale2018, CITATIONS.legro2013],
    insights: [
      "Hirsutism affects up to 70% of people with PCOS and is directly linked to elevated androgen levels, making it one of the most specific visible symptoms.",
    ],
  },
  {
    key: "hair_loss",
    label: "Scalp hair thinning",
    description: "Thinning at the crown or widening part line.",
    citations: [CITATIONS.escobarmorreale2018],
    insights: [
      "Androgenic alopecia (scalp thinning) shares the same hormonal driver as hirsutism and acne in PCOS — elevated free androgens acting on hair follicles.",
    ],
  },
  {
    key: "weight_gain",
    label: "Weight gain or difficulty losing weight",
    description: "Weight gain, especially around the abdomen, that feels disproportionate to diet/exercise changes.",
    citations: [CITATIONS.lim2012, CITATIONS.stepto2013],
    insights: [
      "A meta-analysis of over 30 studies found women with PCOS have significantly higher rates of overweight, obesity, and central (abdominal) adiposity than the general population.",
      "Clamp studies show insulin resistance in PCOS is often intrinsic — present independent of body weight — which is why weight alone isn't a reliable marker and diet-only advice can be frustrating and incomplete.",
    ],
  },
  {
    key: "fatigue",
    label: "Persistent fatigue",
    description: "Low energy that doesn't improve with rest.",
    citations: [CITATIONS.stepto2013],
    insights: [
      "Fatigue in PCOS is frequently linked to underlying insulin resistance and blood-sugar volatility rather than sleep quantity alone.",
    ],
  },
  {
    key: "mood_changes",
    label: "Anxiety or low mood",
    description: "Increased anxiety, low mood, or mood swings.",
    citations: [CITATIONS.cooney2017],
    insights: [
      "A meta-analysis found significantly elevated rates of moderate-to-severe depressive and anxiety symptoms in people with PCOS compared to controls — this is a recognised part of the condition, not 'just stress'.",
    ],
  },
  {
    key: "cravings_blood_sugar",
    label: "Strong sugar/carb cravings or energy crashes",
    description: "Intense cravings, energy crashes after meals, or shakiness between meals.",
    citations: [CITATIONS.stepto2013, CITATIONS.moran2013],
    insights: [
      "Insulin resistance — present in a majority of PCOS cases regardless of weight — can drive blood-sugar swings that manifest as cravings and post-meal energy crashes.",
      "Cochrane review evidence shows structured lifestyle/dietary approaches (not necessarily weight loss) can meaningfully improve insulin sensitivity and related symptoms.",
    ],
  },
  {
    key: "fertility_concerns",
    label: "Difficulty conceiving",
    description: "Trying to conceive for 6+ months without success, or concerns about future fertility.",
    citations: [CITATIONS.balen2016],
    insights: [
      "PCOS is the leading cause of anovulatory infertility, but ESHRE guidelines note the large majority of cases respond well to first-line ovulation induction treatment.",
    ],
  },
  {
    key: "pelvic_pain",
    label: "Pelvic pain or ovarian discomfort",
    description: "Cramping or discomfort not tied to your period.",
    citations: [CITATIONS.teede2018],
    insights: [
      "Pelvic discomfort is a less specific PCOS symptom and guidelines recommend it be evaluated to rule out overlapping conditions like endometriosis.",
    ],
  },
];

export const GENERAL_CITATIONS: Citation[] = [
  CITATIONS.gibsonhelm2017,
  CITATIONS.azziz2016,
  CITATIONS.teede2018,
];

export function getSymptomInfo(key: SymptomKey): SymptomInfo | undefined {
  return SYMPTOMS.find((s) => s.key === key);
}
