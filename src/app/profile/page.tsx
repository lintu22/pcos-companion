"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStoredProfile } from "@/lib/storage";
import { CITATIONS, SYMPTOMS } from "@/lib/research-data";
import { COMMUNITY_BASELINES, COMMUNITY_STATS } from "@/lib/community-data";
import { Download, ExternalLink, ArrowRight, Users, Sparkles } from "lucide-react";

function labelFor(key: string) {
  return SYMPTOMS.find((s) => s.key === key)?.label ?? key;
}

export default function ProfilePage() {
  const profile = useStoredProfile();

  if (profile === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold">No profile yet</h1>
        <p className="mt-2 text-muted-foreground">
          Answer a few questions about your symptoms to build your evidence-based profile.
        </p>
        <Button render={<Link href="/intake" />} className="mt-6">
          Start intake <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const { analysis, source, createdAt } = profile;

  function downloadData() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pcos-companion-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
          <p className="text-sm text-muted-foreground">
            Built {new Date(createdAt).toLocaleDateString()} ·{" "}
            {source === "ai" ? "Claude-analyzed" : "Rule-based screening"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadData}>
            <Download className="mr-2 h-4 w-4" /> Download my data
          </Button>
          <Button render={<Link href="/intake" />} variant="outline">
            Retake intake
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row">
          <LikelihoodGauge percent={analysis.likelihoodPercent} />
          <div className="flex-1">
            <p className="text-lg font-medium">{analysis.summary}</p>
            <p className="mt-2 text-xs text-muted-foreground">{analysis.confidenceNote}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your dominant symptoms</CardTitle>
          <CardDescription>What stood out most in your answers.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {analysis.dominantSymptoms.map((s) => (
            <Badge key={s} variant="secondary" className="px-3 py-1 text-sm">
              {labelFor(s)}
            </Badge>
          ))}
          {analysis.dominantSymptoms.length === 0 && (
            <p className="text-sm text-muted-foreground">No dominant pattern detected yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What the research says</CardTitle>
          <CardDescription>
            Evidence-based statements tied to your symptoms, with sources you can check yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {analysis.insights.map((insight, i) => (
            <div key={i}>
              <p className="font-medium">{labelFor(insight.symptom)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.statement}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insight.citationIds.map((id) => {
                  const c = CITATIONS[id];
                  if (!c) return null;
                  return (
                    <a
                      key={id}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                      title={c.summary}
                    >
                      {c.authorsYear} <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                })}
              </div>
              {i < analysis.insights.length - 1 && <Separator className="mt-5" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> How you compare to the community
          </CardTitle>
          <CardDescription>
            Based on {COMMUNITY_STATS.totalUsers.toLocaleString()} anonymised community profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.dominantSymptoms.map((s) => {
            const baseline = COMMUNITY_BASELINES.find((b) => b.symptom === s);
            if (!baseline) return null;
            return (
              <div key={s} className="flex items-center justify-between gap-4 text-sm">
                <span>{labelFor(s)}</span>
                <span className="text-muted-foreground">
                  <strong className="text-foreground">
                    {baseline.percentOfCommunityReporting}%
                  </strong>{" "}
                  of community members also report this
                </span>
              </div>
            );
          })}
          <Separator />
          <p className="text-xs text-muted-foreground">
            On average, community members waited {COMMUNITY_STATS.avgMonthsToDiagnosis} months for a formal
            diagnosis, and {COMMUNITY_STATS.percentWhoTriedUnverifiedSupplements}% tried at least one
            supplement recommended online with no clinical backing before finding evidence-based info.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/checkin" />}>Do a check-in</Button>
        <Button render={<Link href="/community" />} variant="outline">
          Visit the community
        </Button>
      </div>
    </div>
  );
}

function LikelihoodGauge({ percent }: { percent: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} strokeWidth="8" className="fill-none stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          strokeLinecap="round"
          className="fill-none stroke-primary transition-all duration-700"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{percent}%</span>
        <span className="text-[10px] text-muted-foreground">screening signal</span>
      </div>
    </div>
  );
}
