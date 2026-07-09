"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Carousel } from "@/components/carousel";
import { PercentRing } from "@/components/percent-ring";
import { useStoredProfile } from "@/lib/storage";
import {
  SYMPTOMS,
  SymptomKey,
  getSymptomInfo,
  EVIDENCE_LABEL,
  EVIDENCE_RANK,
  EVIDENCE_INFO,
  EvidenceLevel,
} from "@/lib/research-data";
import { ALL_CITATIONS, bestEvidenceLevel } from "@/lib/pdf-sources";
import { COMMUNITY_BASELINES, COMMUNITY_STATS, COMMUNITY_RECOMMENDATIONS } from "@/lib/community-data";
import { SymptomRadarChart, RadarDatum } from "@/components/symptom-radar-chart";
import {
  Download,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Users,
  Sparkles,
  Lightbulb,
  Pill,
  MessagesSquare,
  Info,
  BookOpenCheck,
} from "lucide-react";

const EVIDENCE_BADGE_CLASS: Record<EvidenceLevel, string> = {
  strong: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  limited: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  low: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
};

function labelFor(key: string) {
  return SYMPTOMS.find((s) => s.key === key)?.label ?? key;
}

function SectionHeading({
  icon,
  title,
  description,
  size = "default",
  noBorder = false,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  size?: "default" | "large";
  noBorder?: boolean;
}) {
  return (
    <div
      className={`mb-3 mt-10 flex items-start gap-3 pb-3 first:mt-0 ${noBorder ? "" : "border-b"}`}
    >
      <span
        className={`mt-0.5 flex shrink-0 items-center justify-center text-primary [&_svg]:h-full [&_svg]:w-full ${
          size === "large" ? "h-10 w-10" : "h-5 w-5"
        }`}
      >
        {icon}
      </span>
      <div>
        <h2 className={`font-bold tracking-tight ${size === "large" ? "text-3xl" : "text-xl"}`}>{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function EvidenceInfoButton() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="What do the evidence levels mean?"
            className="text-muted-foreground hover:text-primary"
          />
        }
      >
        <Info className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How we grade evidence</DialogTitle>
          <DialogDescription>
            Each badge reflects our own read of the underlying study design, not a rating the
            researchers assigned themselves.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {(Object.keys(EVIDENCE_INFO) as EvidenceLevel[]).map((level) => {
            const info = EVIDENCE_INFO[level];
            return (
              <div key={level} className="flex gap-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${info.dot}`} />
                <div>
                  <p className="text-sm font-semibold">{info.title}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const profile = useStoredProfile();
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomKey | null>(null);
  const [scienceSort, setScienceSort] = useState<"relevant" | "evidence">("relevant");

  if (profile === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold">No profile yet</h1>
        <p className="mt-2 text-muted-foreground">
          Answer a few questions about your symptoms to build your evidence-based profile.
        </p>
        <Button render={<Link href="/intake" />} className="mt-6">
          Create your Profile <ArrowRight className="ml-1 h-4 w-4" />
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
    a.download = `vera-profile-${new Date().toISOString().slice(0, 10)}.json`;
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
  const fallbackInsights =
    selectedSymptom && rawVisibleInsights.length === 0 && selectedInfo
      ? [
          {
            symptom: selectedSymptom,
            statement: selectedInfo.insights[0],
            citationIds: selectedInfo.citations,
            meaning: "This is based on the pattern in your answers overall.",
          },
        ]
      : rawVisibleInsights;
  const visibleInsights =
    scienceSort === "evidence"
      ? [...fallbackInsights].sort(
          (a, b) =>
            (EVIDENCE_RANK[bestEvidenceLevel(b.citationIds) ?? "limited"] ?? 0) -
            (EVIDENCE_RANK[bestEvidenceLevel(a.citationIds) ?? "limited"] ?? 0)
        )
      : fallbackInsights;

  const scopedRecommendations = selectedSymptom
    ? (analysis.recommendations ?? []).filter((r) => r.symptom === selectedSymptom)
    : analysis.recommendations ?? [];
  const researchRecommendations = scopedRecommendations.filter((r) => r.source === "research");
  const communityRecommendations = scopedRecommendations.filter((r) => r.source === "community");

  const visibleSupplements = selectedSymptom
    ? (analysis.supplements ?? []).filter((s) => s.symptom === selectedSymptom)
    : analysis.supplements ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your PMOS symptoms at a glance</h1>
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
            Retake the quiz
          </Button>
        </div>
      </div>

      {/* Chart + overview */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {selectedSymptom && (
            <button
              type="button"
              onClick={() => setSelectedSymptom(null)}
              className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all symptoms
            </button>
          )}
          {chartData.length >= 3 ? (
            <SymptomRadarChart
              data={chartData}
              selected={selectedSymptom}
              onSelect={toggleSymptom}
              onReset={() => setSelectedSymptom(null)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Not enough answered symptoms yet to draw a chart.</p>
          )}
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {selectedSymptom
              ? "Tap the centre of the chart to return to all symptoms."
              : "Tap a symptom to focus your profile on just that one."}
          </p>

          <Separator className="my-5" />

          {selectedSymptom ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Your most prominent focus
              </p>
              <p className="mt-1.5 text-2xl font-bold">{labelFor(selectedSymptom)}</p>
              <p className="mt-2 text-base text-muted-foreground">{overviewText}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-2xl font-bold">Your chart overview</p>
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                  {analysis.likelihoodPercent}% screening signal
                </span>
              </div>
              <p className="mt-2 text-base text-muted-foreground">{overviewText}</p>
              <p className="mt-3 text-xs text-muted-foreground">{analysis.confidenceNote}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dominant symptom chips */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your dominant symptoms</CardTitle>
          <CardDescription>What stood out most in your answers. Tap one to focus the profile.</CardDescription>
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

      <SectionHeading
        icon={<BookOpenCheck />}
        title="Backed by science"
        description="Insights, suggestions, and supplements grounded in published research."
        size="large"
        noBorder
      />

      {/* What science says */}
      <Card className="mb-6">
        <CardHeader className="border-b pb-6">
          <CardTitle className="text-2xl font-bold">What science says</CardTitle>
          <CardDescription>
            Each statement links to a real study, graded by how strong the evidence type is.
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
            <SortTab active={scienceSort === "relevant"} onClick={() => setScienceSort("relevant")}>
              Most relevant to me
            </SortTab>
            <SortTab active={scienceSort === "evidence"} onClick={() => setScienceSort("evidence")}>
              Strongest evidence first
            </SortTab>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion key={`${selectedSymptom ?? "all"}-${scienceSort}`} defaultValue={[0]}>
            {visibleInsights.map((insight, i) => {
              const level = bestEvidenceLevel(insight.citationIds);
              return (
                <AccordionItem key={i} value={i}>
                  <div className="flex items-start justify-between gap-2">
                    <AccordionTrigger className="flex-1 py-4">
                      <div>
                        <p className="text-base font-semibold">{labelFor(insight.symptom)}</p>
                        {level && (
                          <span
                            className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVIDENCE_BADGE_CLASS[level]}`}
                          >
                            {EVIDENCE_LABEL[level]}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    {level && (
                      <div className="pt-4">
                        <EvidenceInfoButton />
                      </div>
                    )}
                  </div>
                  <AccordionContent>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.statement}</p>
                    {insight.meaning && (
                      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">What this means for you: </span>
                        {insight.meaning}
                      </div>
                    )}
                    <div className="mt-4 flex flex-col gap-2">
                      {insight.citationIds.map((id) => {
                        const c = ALL_CITATIONS[id];
                        if (!c) return null;
                        return (
                          <a
                            key={id}
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                            title={c.summary}
                          >
                            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                              <span className="block font-medium text-foreground">{c.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.authorsYear} · {c.journal}
                              </span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          {visibleInsights.length === 0 && (
            <p className="text-sm text-muted-foreground">No specific research insight for this symptom yet.</p>
          )}
        </CardContent>
      </Card>

      {/* What might help (research-backed) */}
      {(() => {
        const grounded = researchRecommendations
          .map((rec) => {
            const citations = rec.citationIds.map((id) => ALL_CITATIONS[id]).filter(Boolean);
            return citations.length ? { rec, citations } : null;
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        if (grounded.length === 0) return null;
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" /> What might help
              </CardTitle>
              <CardDescription>Research-backed suggestions tied to your symptoms, never generic advice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {grounded.map(({ rec, citations }, i) => (
                <div key={i}>
                  <p className="text-sm text-muted-foreground">{rec.text}</p>
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
                        View study · {c.authorsYear} <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                  {i < grounded.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* Supplements */}
      {(() => {
        const groundedSupplements = visibleSupplements
          .map((sup) => {
            const citations = sup.citationIds.map((id) => ALL_CITATIONS[id]).filter(Boolean);
            return citations.length ? { sup, citations } : null;
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
                Dietary supplements with research evidence for your symptoms, not a recommendation to start
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
                        View study · {c.authorsYear} <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                  {i < groundedSupplements.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Supplements can interact with medicines and aren&apos;t regulated the way medicines are, so check with a
                doctor or pharmacist before starting one, especially if you&apos;re pregnant, trying to conceive, or
                on other medication.
              </p>
            </CardContent>
          </Card>
        );
      })()}

      <div className="relative left-1/2 right-1/2 -mx-[50vw] mb-6 w-screen bg-[#EDE4DB] py-8">
        <div className="mx-auto max-w-3xl space-y-6 px-4">
          <SectionHeading
            icon={<Users />}
            title="From the community"
            description="What other members report trying and experiencing, shared anonymously, not medical advice."
            size="large"
            noBorder
          />

          {/* What women with PMOS are trying (community) */}
          {(() => {
            const grounded = communityRecommendations
              .map((rec) => {
                const community = COMMUNITY_RECOMMENDATIONS.find((c) => c.id === rec.communityRecommendationId);
                return community ? { rec, community } : null;
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessagesSquare className="h-5 w-5" /> What women with PMOS are trying
                  </CardTitle>
                  <CardDescription>
                    Shared by other members: what they report trying, not medical advice.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {grounded.length > 0 ? (
                    <>
                      <Carousel
                        items={grounded}
                        autoplayMs={5000}
                        renderItem={({ rec, community }) => (
                          <div className="rounded-lg border bg-accent/30 p-6">
                            <p className="text-base">{rec.text}</p>
                            <p className="mt-3 text-sm text-muted-foreground">
                              Backed by{" "}
                              <strong className="text-foreground">{community.percentReportingHelpful}%</strong> of
                              members who tried it
                            </p>
                          </div>
                        )}
                      />
                      <Button render={<Link href="/community" />} variant="outline" className="mt-4">
                        Go to community <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-dashed bg-accent/10 p-6 text-sm text-muted-foreground">
                        No community data available at the moment that relates to{" "}
                        {selectedSymptom ? labelFor(selectedSymptom) : "your current profile"}. Check back as more
                        members share what they&apos;ve tried.
                      </div>
                      <Button render={<Link href="/community" />} variant="outline" className="mt-4">
                        Go to community <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Community comparison: always shows the full dominant-symptom set, never filtered by the selected symptom */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> How you compare to the community
              </CardTitle>
              <CardDescription>
                Based on {COMMUNITY_STATS.totalUsers.toLocaleString()} anonymised community profiles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {analysis.dominantSymptoms.map((s) => {
                  const baseline = COMMUNITY_BASELINES.find((b) => b.symptom === s);
                  if (!baseline) return null;
                  return (
                    <div key={s} className="flex items-center gap-4 rounded-lg border bg-accent/20 p-4">
                      <span className="flex-1 text-sm font-medium">{labelFor(s)}</span>
                      <PercentRing percent={baseline.percentOfCommunityReporting} />
                    </div>
                  );
                })}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                On average, community members waited {COMMUNITY_STATS.avgMonthsToDiagnosis} months for a formal
                diagnosis, and {COMMUNITY_STATS.percentWhoTriedUnverifiedSupplements}% tried at least one
                supplement recommended online with no clinical backing before finding evidence-based info.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/checkin" />}>Do a check-in</Button>
        <Button render={<Link href="/community" />} variant="outline">
          Visit the community
        </Button>
      </div>
    </div>
  );
}

function SortTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
