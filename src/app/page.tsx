import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { COMMUNITY_STATS } from "@/lib/community-data";
import { ArrowRight, BookOpenCheck, Users, LineChart, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Understand your symptoms with <span className="text-primary">evidence</span>, not guesswork.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          PCOS Companion turns a few minutes of questions into a research-backed symptom profile —
          with citations, community comparisons, and a record you own.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button render={<Link href="/intake" />} size="lg">
            Start your profile <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button render={<Link href="/community" />} size="lg" variant="outline">
            See the community
          </Button>
        </div>
      </section>

      <section className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Community members" value={COMMUNITY_STATS.totalUsers.toLocaleString()} />
        <Stat label="Avg. months to diagnosis" value={String(COMMUNITY_STATS.avgMonthsToDiagnosis)} />
        <Stat
          label="Undiagnosed after symptoms"
          value={`${COMMUNITY_STATS.percentUndiagnosedAfterFirstSymptoms}%`}
        />
        <Stat
          label="Tried unverified supplements"
          value={`${COMMUNITY_STATS.percentWhoTriedUnverifiedSupplements}%`}
        />
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <Feature
          icon={BookOpenCheck}
          title="Research-backed, always cited"
          description="Every insight links back to a real study reference — no unverified influencer advice."
        />
        <Feature
          icon={Users}
          title="Community context"
          description="See what percentage of others share your symptom pattern, and read real experiences."
        />
        <Feature
          icon={LineChart}
          title="Ongoing check-ins"
          description="Weekly or monthly check-ins track whether the insights are actually helping over time."
        />
        <Feature
          icon={Download}
          title="Your data, exportable"
          description="Download your full profile and history any time — it's yours, not locked in."
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpenCheck;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
