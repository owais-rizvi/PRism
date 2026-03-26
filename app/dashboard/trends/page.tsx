import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { TrendsView } from "./trends-view";

type PREvent = { type: string; actor: string; created_at: string };
type PR = {
  id: string;
  created_at: string;
  merged_at: string | null;
  repo_id: string;
  pr_events: PREvent[];
};

function computeTrends(repos: { id: string; repo_full_name: string }[], prs: PR[]) {
  // 1. Avg review wait time per repo (created_at -> first approval)
  const repoWaitTimes: Record<string, number[]> = {};
  for (const pr of prs) {
    const approval = pr.pr_events
      .filter((e) => e.type === "approved")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    if (!approval) continue;
    const wait = (new Date(approval.created_at).getTime() - new Date(pr.created_at).getTime()) / 36e5;
    if (!repoWaitTimes[pr.repo_id]) repoWaitTimes[pr.repo_id] = [];
    repoWaitTimes[pr.repo_id].push(wait);
  }

  const avgWaitByRepo = repos.map((r) => ({
    repo: r.repo_full_name,
    avgHours: repoWaitTimes[r.id]?.length
      ? repoWaitTimes[r.id].reduce((a, b) => a + b, 0) / repoWaitTimes[r.id].length
      : null,
  }));

  // 2. Per-reviewer speed (review_requested -> their approval)
  const reviewerTimes: Record<string, number[]> = {};
  for (const pr of prs) {
    const requests = pr.pr_events.filter((e) => e.type === "review_requested");
    const approvals = pr.pr_events.filter((e) => e.type === "approved");
    for (const approval of approvals) {
      const request = requests
        .filter((r) => r.actor === approval.actor)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const start = request
        ? new Date(request.created_at).getTime()
        : new Date(pr.created_at).getTime();
      const hours = (new Date(approval.created_at).getTime() - start) / 36e5;
      if (hours < 0) continue;
      if (!reviewerTimes[approval.actor]) reviewerTimes[approval.actor] = [];
      reviewerTimes[approval.actor].push(hours);
    }
  }

  const overallAvg =
    Object.values(reviewerTimes).flat().reduce((a, b) => a + b, 0) /
    (Object.values(reviewerTimes).flat().length || 1);

  const reviewerSpeed = Object.entries(reviewerTimes)
    .map(([reviewer, times]) => ({
      reviewer,
      avgHours: times.reduce((a, b) => a + b, 0) / times.length,
      count: times.length,
    }))
    .sort((a, b) => a.avgHours - b.avgHours);

  // 3. Merge rate by day of week
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mergesByDay: Record<number, number> = {};
  const prsByDay: Record<number, number> = {};
  for (const pr of prs) {
    const day = new Date(pr.created_at).getDay();
    prsByDay[day] = (prsByDay[day] ?? 0) + 1;
    if (pr.merged_at) {
      const mergeDay = new Date(pr.merged_at).getDay();
      mergesByDay[mergeDay] = (mergesByDay[mergeDay] ?? 0) + 1;
    }
  }

  const mergeRateByDay = days.map((label, i) => ({
    day: label,
    rate: prsByDay[i] ? Math.round((mergesByDay[i] ?? 0) / prsByDay[i] * 100) : null,
    merged: mergesByDay[i] ?? 0,
    total: prsByDay[i] ?? 0,
  }));

  return { avgWaitByRepo, reviewerSpeed, mergeRateByDay, overallAvg };
}

async function Trends() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: repos } = await supabase
    .from("tracked_repos")
    .select("id, repo_full_name");

  if (!repos?.length) redirect("/protected");

  const { data: prs } = await supabase
    .from("pull_requests")
    .select("id, created_at, merged_at, repo_id, pr_events ( type, actor, created_at )")
    .in("repo_id", repos.map((r) => r.id));

  const trends = computeTrends(repos, prs ?? []);

  return <TrendsView trends={trends} />;
}

export default function TrendsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Trends</h1>
        <p className="text-sm text-muted-foreground mt-1">Historical intelligence across your tracked repos.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Computing trends...</p>}>
        <Trends />
      </Suspense>
    </div>
  );
}
