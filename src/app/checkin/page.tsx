"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { addCheckIn, useStoredCheckIns, CheckIn } from "@/lib/storage";
import { CalendarCheck, Frown, Meh, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CHANGE_OPTIONS: { value: CheckIn["moodOrSymptomChange"]; label: string; icon: typeof Smile }[] = [
  { value: "better", label: "Better", icon: Smile },
  { value: "same", label: "About the same", icon: Meh },
  { value: "worse", label: "Worse", icon: Frown },
];

export default function CheckInPage() {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [change, setChange] = useState<CheckIn["moodOrSymptomChange"] | null>(null);
  const [note, setNote] = useState("");
  const history = useStoredCheckIns();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (helpful === null || change === null) return;
    addCheckIn({ helpful, moodOrSymptomChange: change, note });
    setSubmitted(true);
    setHelpful(null);
    setChange(null);
    setNote("");
    setTimeout(() => setSubmitted(false), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <CalendarCheck className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Weekly check-in</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How has this week been?</CardTitle>
          <CardDescription>
            Two quick questions: this helps us understand whether the insights are actually useful, and
            builds a timeline you can look back on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">Has your profile/insights been helpful this week?</p>
            <div className="flex gap-2">
              <Button
                variant={helpful === true ? "default" : "outline"}
                onClick={() => setHelpful(true)}
                size="sm"
              >
                Yes
              </Button>
              <Button
                variant={helpful === false ? "default" : "outline"}
                onClick={() => setHelpful(false)}
                size="sm"
              >
                Not really
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">How do your symptoms feel compared to last check-in?</p>
            <div className="flex gap-2">
              {CHANGE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={change === value ? "default" : "outline"}
                  onClick={() => setChange(value)}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Icon className="h-4 w-4" /> {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Anything you want to note? (optional)</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Tried the sleep tips, cravings felt a bit better..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={helpful === null || change === null}>
            {submitted ? "Saved!" : "Submit check-in"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Your check-in history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins yet. Your first one will show up here.</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between pt-6 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.helpful ? "default" : "secondary"}>
                        {entry.helpful ? "Helpful" : "Not helpful"}
                      </Badge>
                      <Badge variant="outline">{entry.moodOrSymptomChange}</Badge>
                    </div>
                    {entry.note && <p className="mt-2 text-muted-foreground">{entry.note}</p>}
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                  </span>
                </CardContent>
                {i < history.length - 1 && <Separator />}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button render={<Link href="/profile" />} variant="outline">
          Back to profile
        </Button>
      </div>
    </div>
  );
}
