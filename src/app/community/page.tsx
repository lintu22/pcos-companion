import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FORUM_POSTS } from "@/lib/community-data";
import { SYMPTOMS } from "@/lib/research-data";
import { COMMUNITY_STATS } from "@/lib/community-data";
import { MessageCircle, ThumbsUp } from "lucide-react";

function labelFor(key: string) {
  return SYMPTOMS.find((s) => s.key === key)?.label ?? key;
}

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="mt-1 text-muted-foreground">
          Real-world experiences from {COMMUNITY_STATS.totalUsers.toLocaleString()} members, shared
          alongside — never in place of — the evidence.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Members" value={COMMUNITY_STATS.totalUsers.toLocaleString()} />
        <Stat label="Avg. months to diagnosis" value={String(COMMUNITY_STATS.avgMonthsToDiagnosis)} />
        <Stat
          label="Undiagnosed after symptoms started"
          value={`${COMMUNITY_STATS.percentUndiagnosedAfterFirstSymptoms}%`}
        />
        <Stat
          label="Tried unverified supplements"
          value={`${COMMUNITY_STATS.percentWhoTriedUnverifiedSupplements}%`}
        />
      </div>

      <div className="space-y-4">
        {FORUM_POSTS.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{post.author.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{post.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {post.author} · {post.timeAgo}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{post.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {post.symptomTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {labelFor(tag)}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" /> {post.helpfulVotes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {post.replies} replies
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        This is a mocked forum for demo purposes — posts are illustrative, not real user submissions.
      </p>
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
