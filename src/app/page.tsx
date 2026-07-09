import Link from "next/link";
import { Button } from "@/components/ui/button";
import { COMMUNITY_STATS } from "@/lib/community-data";
import { AppPreviewChart } from "@/components/app-preview-chart";
import { BookOpenCheck } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-accent/40">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-16 sm:grid-cols-2 sm:py-20">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Make sense of your PMOS symptoms with confidence
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Vera turns a few minutes of questions into a research-backed symptom profile, with
              citations, community comparisons, and a record you own.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              PMOS (polyendocrine metabolic ovarian syndrome) is the new name for PCOS, renamed in 2026.
            </p>
            <div className="mt-8">
              <Button render={<Link href="/intake" />} size="lg" className="h-14 px-8 text-base">
                Understand your symptoms
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* What can you do with Vera */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid items-center gap-8 rounded-2xl border bg-card p-8 sm:grid-cols-2">
          <div className="order-2 flex justify-center sm:order-1">
            <AppMockup />
          </div>
          <div className="order-1 sm:order-2">
            <h2 className="text-2xl font-bold tracking-tight">What can you do with Vera?</h2>
            <p className="mt-1 text-sm font-medium text-primary">Backed by science</p>
            <p className="mt-4 text-muted-foreground">
              Every insight on your profile links back to a real study, graded by how strong the
              evidence is, so you can tell a guideline-backed fact from a promising early finding, and
              bring both to your next appointment.
            </p>
            <div className="mt-6">
              <Button render={<Link href="/community" />} variant="outline" size="lg" className="h-14 px-8 text-base">
                <BookOpenCheck className="mr-2 h-5 w-5" /> Explore research
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose Vera */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">Why choose Vera?</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Community members" value={COMMUNITY_STATS.totalUsers.toLocaleString()} />
          <Stat
            label="Tried unverified supplements"
            value={`${COMMUNITY_STATS.percentWhoTriedUnverifiedSupplements}%`}
          />
          <Stat
            label="Undiagnosed after symptoms"
            value={`${COMMUNITY_STATS.percentUndiagnosedAfterFirstSymptoms}%`}
          />
          <Stat label="Avg. months to diagnosis" value={String(COMMUNITY_STATS.avgMonthsToDiagnosis)} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-accent/40 p-5 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// Product preview shown in the landing mockups: a real, editable radar.
function AppMockup() {
  return (
    <div className="w-full max-w-md rounded-3xl border bg-background p-4">
      <AppPreviewChart />
    </div>
  );
}
