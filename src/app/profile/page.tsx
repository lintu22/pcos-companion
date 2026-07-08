"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStoredProfile } from "@/lib/storage";
import { SYMPTOMS, SymptomKey, getSymptomInfo } from "@/lib/research-data";
import { ALL_CITATIONS } from "@/lib/pdf-sources";
import { COMMUNITY_BASELINES, COMMUNITY_STATS, COMMUNITY_RECOMMENDATIONS } from "@/lib/community-data";
import { SymptomRadarChart, RadarDatum } from "@/components/symptom-radar-chart";
import {
  Download,
  ExternalLink,
  ArrowRight,
  Users,
  Sparkles,
  Lightbulb,
  BookOpenCheck,
  MessagesSquare,
  Pill,
  X,
} from "lucide-react";

function labelFor(key: string) {
  return SYMPTOMS.find((s) => s.key === key)?.label ?? key;
}

export default function ProfilePage() {
  const profile = useStoredProfile();
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomKey | null>(null);

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

  const { analysis, source, createdAt, answers } = profile;

  function downloadData() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pmos-companion-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSymptom(key: SymptomKey) {
    setSelectedSymptom((prev) => (prev === key ? null : key));
  }

  const chartData: RadarDatum[] = SYMPTOMS.filter((s) => answers.frequencies[s.key] !== undefined).map((s) => ({
    symptom: s.key,
    label: s.label,
    value: answers.frequencies[s.key]!,
  }));

  const selectedInfo = selectedSymptom ? getSymptomInfo(selectedSymptom) : undefined;
  const overviewText = selectedSymptom
    ? analysis.symptomOverviews?.find((o) => o.symptom === selectedSymptom)?.overview ??
      selectedInfo?.insights[0] ??
      selectedInfo?.description ??
      "No additional detail available for this symptom yet."
    : analysis.summary;

  const rawVisibleInsights = selectedSymptom
    ? analysis.insights.filter((i) => i.symptom === selectedSymptom)
    : analysis.insights;
  const visibleInsights =
    selectedSymptom && rawVisibleInsights.length === 0 && selectedInfo
      ? [{ symptom: selectedSymptom, statement: selectedInfo.insights[0], citationIds: selectedInfo.citations }]
      : rawVisibleInsights;

  const visibleRecommendations = selectedSymptom
    ? (analysis.recommendations ?? []).filter((r) => r.symptom === selectedSymptom)
    : analysis.recommendations ?? [];

  const visibleSupplements = selectedSymptom
    ? (analysis.supplements ?? []).filter((s) => s.symptom === selectedSymptom)
    : analysis.supplements ?? [];

  const visibleCommunitySymptoms = selectedSymptom ? [selectedSymptom] : analysis.dominantSymptoms;

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
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 sm:items-center">
          <div>
            {chartData.length >= 3 ? (
              <SymptomRadarChart data={chartData} selected={selectedSymptom} onSelect={toggleSymptom} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough answered symptoms yet to draw a chart.
              </p>
            )}
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              Click a symptom to focus the profile below on just that symptom.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {analysis.likelihoodPercent}% screening signal
              </span>
              {selectedSymptom && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedSymptom(null)} className="h-7 px-2 text-xs">
                  <X className="mr-1 h-3 w-3" /> Show full profile
                </Button>
              )}
            </div>
            <p className="mt-3 text-lg font-medium">
              {selectedSymptom ? labelFor(selectedSymptom) : "Overview"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{overviewText}</p>
            {!selectedSymptom && <p className="mt-2 text-xs text-muted-foreground">{analysis.confidenceNote}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your dominant symptoms</CardTitle>
          <CardDescription>What stood out most in your answers. Click one to focus the profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {analysis.dominantSymptoms.map((s) => (
            <button key={s} type="button" onClick={() => toggleSymptom(s as SymptomKey)}>
              <Badge
                variant={selectedSymptom === s ? "default" : "secondary"}
                className="cursor-pointer px-3 py-1 text-sm"
              >
                {labelFor(s)}
              </Badge>
            </button>
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
          {visibleInsights.map((insight, i) => (
            <div key={i}>
              <p className="font-medium">{labelFor(insight.symptom)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.statement}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insight.citationIds.map((id) => {
                  const c = ALL_CITATIONS[id];
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
              {i < visibleInsights.length - 1 && <Separator className="mt-5" />}
            </div>
          ))}
          {visibleInsights.length === 0 && (
            <p className="text-sm text-muted-foreground">No specific research insight for this symptom yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" /> What might help
          </CardTitle>
          <CardDescription>
            Suggestions grounded in either the research or the community — never generic advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const grounded = visibleRecommendations
              .map((rec) => {
                if (rec.source === "research") {
                  const citations = rec.citationIds.map((id) => ALL_CITATIONS[id]).filter(Boolean);
                  if (citations.length === 0) return null; // ungrounded — never shown
                  return { rec, citations, community: null as (typeof COMMUNITY_RECOMMENDATIONS)[number] | null };
                }
                const community = COMMUNITY_RECOMMENDATIONS.find((c) => c.id === rec.communityRecommendationId);
                if (!community) return null; // ungrounded — never shown
                return { rec, citations: [], community };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);

            if (grounded.length === 0) {
              return <p className="text-sm text-muted-foreground">No specific suggestions for this profile yet.</p>;
            }

            return grounded.map(({ rec, citations, community }, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 text-xs font-medium">
                  {rec.source === "research" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      <BookOpenCheck className="h-3 w-3" /> Research-backed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                      <MessagesSquare className="h-3 w-3" /> From the community
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{rec.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {citations.map((c) => (
                    <a
                      key={c.id}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                      title={c.summary}
                    >
                      {c.authorsYear} <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                  {community && (
                    <span className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{community.percentReportingHelpful}%</strong> of community
                      members who tried this reported it helped
                    </span>
                  )}
                </div>
                {i < grounded.length - 1 && <Separator className="mt-4" />}
              </div>
            ));
          })()}
        </CardContent>
      </Card>

      {(() => {
        const groundedSupplements = visibleSupplements
          .map((sup) => {
            const citations = sup.citationIds.map((id) => ALL_CITATIONS[id]).filter(Boolean);
            if (citations.length === 0) return null; // ungrounded — never shown
            return { sup, citations };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);

        if (groundedSupplements.length === 0) return null;

        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" /> Supplements the research points to
              </CardTitle>
              <CardDescription>
                Dietary supplements with research evidence for your symptoms — not a recommendation to start
                taking anything without talking to a doctor or pharmacist first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groundedSupplements.map(({ sup, citations }, i) => (
                <div key={i}>
                  <p className="text-sm text-muted-foreground">{sup.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {citations.map((c) => (
                      <a
                        key={c.id}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                        title={c.summary}
                      >
                        {c.authorsYear} <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                  {i < groundedSupplements.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Supplements can interact with medicines and aren&apos;t regulated the way medicines are — check with a
                doctor or pharmacist before starting one, especially if you&apos;re pregnant, trying to conceive, or
                on other medication.
              </p>
            </CardContent>
          </Card>
        );
      })()}

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
          {visibleCommunitySymptoms.map((s) => {
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
