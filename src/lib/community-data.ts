// Mock aggregated community data. In production this would come from anonymised,
// opted-in user profile stats. Numbers are illustrative for the demo.

import { SymptomKey } from "./research-data";

export interface CommunityBaseline {
  symptom: SymptomKey;
  percentOfCommunityReporting: number; // of all app users
  percentOfDiagnosedReporting: number; // of users who report a formal PCOS diagnosis
}

export const COMMUNITY_BASELINES: CommunityBaseline[] = [
  { symptom: "irregular_periods", percentOfCommunityReporting: 78, percentOfDiagnosedReporting: 91 },
  { symptom: "weight_gain", percentOfCommunityReporting: 71, percentOfDiagnosedReporting: 80 },
  { symptom: "fatigue", percentOfCommunityReporting: 66, percentOfDiagnosedReporting: 74 },
  { symptom: "hair_growth", percentOfCommunityReporting: 58, percentOfDiagnosedReporting: 69 },
  { symptom: "cravings_blood_sugar", percentOfCommunityReporting: 55, percentOfDiagnosedReporting: 63 },
  { symptom: "mood_changes", percentOfCommunityReporting: 52, percentOfDiagnosedReporting: 61 },
  { symptom: "acne", percentOfCommunityReporting: 47, percentOfDiagnosedReporting: 54 },
  { symptom: "hair_loss", percentOfCommunityReporting: 34, percentOfDiagnosedReporting: 41 },
  { symptom: "fertility_concerns", percentOfCommunityReporting: 29, percentOfDiagnosedReporting: 45 },
  { symptom: "pelvic_pain", percentOfCommunityReporting: 22, percentOfDiagnosedReporting: 27 },
];

export const COMMUNITY_STATS = {
  totalUsers: 14_820,
  avgMonthsToDiagnosis: 27,
  percentUndiagnosedAfterFirstSymptoms: 63,
  percentWhoTriedUnverifiedSupplements: 58,
};

export interface ForumPost {
  id: string;
  author: string;
  symptomTags: SymptomKey[];
  title: string;
  body: string;
  replies: number;
  helpfulVotes: number;
  timeAgo: string;
}

export const FORUM_POSTS: ForumPost[] = [
  {
    id: "p1",
    author: "quietmoon22",
    symptomTags: ["cravings_blood_sugar", "fatigue"],
    title: "Inositol + protein-first breakfasts actually helped my crashes",
    body: "Took about 6 weeks before my 3pm energy crash got noticeably better. Not a cure, but pairing it with the blood-sugar info from the research tab made it click for me.",
    replies: 34,
    helpfulVotes: 212,
    timeAgo: "2d ago",
  },
  {
    id: "p2",
    author: "hedgehog_hanna",
    symptomTags: ["irregular_periods"],
    title: "It took me 3 years and 4 doctors to get diagnosed",
    body: "Wish I'd had something like this to track patterns earlier — kept getting told 'irregular periods are normal for some people.' Bring data next time, it changes the conversation.",
    replies: 58,
    helpfulVotes: 340,
    timeAgo: "5d ago",
  },
  {
    id: "p3",
    author: "sea.glass.sam",
    symptomTags: ["hair_growth", "acne"],
    title: "Be careful with TikTok supplement stacks",
    body: "Tried a 6-supplement stack an influencer swore by, no science behind half of them, spent £90/month. Ask your GP or check the evidence tab before buying anything.",
    replies: 41,
    helpfulVotes: 289,
    timeAgo: "1w ago",
  },
  {
    id: "p4",
    author: "mkultra_matcha",
    symptomTags: ["mood_changes"],
    title: "Anxiety spikes around ovulation window — anyone else?",
    body: "Didn't realise this was a documented pattern until I saw the research citations here. Made me feel a lot less like I was overreacting.",
    replies: 22,
    helpfulVotes: 150,
    timeAgo: "3d ago",
  },
  {
    id: "p5",
    author: "riverstone_rae",
    symptomTags: ["weight_gain", "cravings_blood_sugar"],
    title: "Strength training > cardio for my symptoms, personally",
    body: "Not medical advice, just sharing — resistance training 3x/week moved the needle on cravings more than the running ever did.",
    replies: 19,
    helpfulVotes: 98,
    timeAgo: "6d ago",
  },
];
