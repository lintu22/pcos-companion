"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { INTAKE_QUESTIONS, FREE_TEXT_PROMPTS, FREQUENCY_LABELS, FrequencyValue } from "@/lib/questions";
import { SymptomKey } from "@/lib/research-data";
import { IntakeAnswers } from "@/lib/scoring";
import { saveProfile } from "@/lib/storage";
import { Loader2, Sparkles } from "lucide-react";

const TOTAL_STEPS = INTAKE_QUESTIONS.length + FREE_TEXT_PROMPTS.length;

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [frequencies, setFrequencies] = useState<Partial<Record<SymptomKey, FrequencyValue>>>({});
  const [triedSoFar, setTriedSoFar] = useState("");
  const [otherSymptoms, setOtherSymptoms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFrequencyStep = step < INTAKE_QUESTIONS.length;
  const freeTextStep = step - INTAKE_QUESTIONS.length;

  const canAdvance = isFrequencyStep
    ? frequencies[INTAKE_QUESTIONS[step].id] !== undefined
    : freeTextStep === 0
      ? true // optional
      : true;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const answers: IntakeAnswers = { frequencies, triedSoFar, otherSymptoms };
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error("Analysis request failed");
      const data = await res.json();
      const { source, ...analysis } = data;
      saveProfile({
        analysis,
        answers,
        source: source ?? "fallback",
        createdAt: new Date().toISOString(),
      });
      router.push("/profile");
    } catch (e) {
      console.error(e);
      setError("Something went wrong generating your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (step === TOTAL_STEPS - 1) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Building your profile
          </span>
        </div>
        <Progress value={((step + 1) / TOTAL_STEPS) * 100} />
      </div>

      {isFrequencyStep ? (
        <FrequencyStep
          question={INTAKE_QUESTIONS[step]}
          value={frequencies[INTAKE_QUESTIONS[step].id]}
          onChange={(v) =>
            setFrequencies((prev) => ({ ...prev, [INTAKE_QUESTIONS[step].id]: v }))
          }
        />
      ) : (
        <FreeTextStep
          prompt={FREE_TEXT_PROMPTS[freeTextStep]}
          value={freeTextStep === 0 ? triedSoFar : otherSymptoms}
          onChange={(v) => (freeTextStep === 0 ? setTriedSoFar(v) : setOtherSymptoms(v))}
        />
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
        >
          Back
        </Button>
        <Button onClick={next} disabled={!canAdvance || submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
            </>
          ) : step === TOTAL_STEPS - 1 ? (
            "Build my profile"
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}

function FrequencyStep({
  question,
  value,
  onChange,
}: {
  question: (typeof INTAKE_QUESTIONS)[number];
  value: FrequencyValue | undefined;
  onChange: (v: FrequencyValue) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl leading-snug">{question.prompt}</CardTitle>
        <CardDescription>{question.helper}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {([0, 1, 2, 3, 4] as FrequencyValue[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`rounded-lg border px-3 py-4 text-center text-sm transition-colors ${
                value === v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="text-lg font-semibold">{v}</div>
              <div className="mt-1 text-xs opacity-80">{FREQUENCY_LABELS[v]}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FreeTextStep({
  prompt,
  value,
  onChange,
}: {
  prompt: (typeof FREE_TEXT_PROMPTS)[number];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl leading-snug">{prompt.prompt}</CardTitle>
        <CardDescription>Optional, but helps sharpen your profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={prompt.placeholder}
          rows={5}
        />
      </CardContent>
    </Card>
  );
}
