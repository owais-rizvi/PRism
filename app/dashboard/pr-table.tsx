"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { syncRepo } from "@/app/protected/actions";
import { useRouter } from "next/navigation";

type Repo = { id: string; repo_full_name: string };
type PREvent = { actor: string; created_at: string };
type PR = {
  id: string;
  pr_number: number;
  title: string;
  author: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  assignees: string[];
  repo_id: string;
  pr_events: PREvent[];
};

function ageLabel(date: string) {
  const hours = (Date.now() - new Date(date).getTime()) / 36e5;
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

function stalenessColor(pr_events: PREvent[], updated_at: string) {
  const times = pr_events.map((e) => new Date(e.created_at).getTime());
  const last = times.length ? Math.max(...times) : new Date(updated_at).getTime();
  const hoursAgo = (Date.now() - last) / 36e5;
  if (hoursAgo < 24) return "bg-green-500";
  if (hoursAgo < 72) return "bg-yellow-500";
  return "bg-red-500";
}

function lastTouchedLabel(pr_events: PREvent[], updated_at: string) {
  const times = pr_events.map((e) => new Date(e.created_at).getTime());
  const last = times.length ? Math.max(...times) : new Date(updated_at).getTime();
  return ageLabel(new Date(last).toISOString()) + " ago";
}

function PRRow({ pr, repoFullName }: { pr: PR; repoFullName: string }) {
  const isMerged = !!pr.merged_at;
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {!isMerged && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${stalenessColor(pr.pr_events, pr.updated_at)}`}
        />
      )}
      {isMerged && <span className="w-2 h-2 rounded-full shrink-0 bg-purple-500" />}
      <div className="flex-1 min-w-0">
        <a
          href={`https://github.com/${repoFullName}/pull/${pr.pr_number}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium hover:underline truncate block"
        >
          #{pr.pr_number} {pr.title}
        </a>
        <p className="text-xs text-muted-foreground">
          by {pr.author}
          {pr.assignees?.length > 0 && ` · assigned to ${pr.assignees.join(", ")}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        {isMerged ? (
          <p className="text-xs text-muted-foreground">Merged {ageLabel(pr.merged_at!)} ago</p>
        ) : (
          <>
            <p className="text-xs font-medium">Age: {ageLabel(pr.created_at)}</p>
            <p className="text-xs text-muted-foreground">Last activity: {lastTouchedLabel(pr.pr_events, pr.updated_at)}</p>
          </>
        )}
      </div>
    </div>
  );
}

function RepoSection({ repo, prs }: { repo: Repo; prs: PR[] }) {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const open = prs.filter((pr) => pr.state === "open");
  const merged = prs.filter((pr) => !!pr.merged_at);

  async function handleSync() {
    setSyncing(true);
    await syncRepo(repo.id, repo.repo_full_name);
    router.refresh();
    setSyncing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{repo.repo_full_name}</h2>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync"}
        </Button>
      </div>

      {open.length > 0 && (
        <div className="border rounded-md divide-y mb-3">
          {open.map((pr) => <PRRow key={pr.id} pr={pr} repoFullName={repo.repo_full_name} />)}
        </div>
      )}

      {merged.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-1">Recently merged</p>
          <div className="border rounded-md divide-y opacity-70">
            {merged.map((pr) => <PRRow key={pr.id} pr={pr} repoFullName={repo.repo_full_name} />)}
          </div>
        </>
      )}

      {!open.length && !merged.length && (
        <p className="text-sm text-muted-foreground">No PRs found.</p>
      )}
    </div>
  );
}

export function PRTable({ repos, prs }: { repos: Repo[]; prs: PR[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-4 text-xs text-muted-foreground items-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Active &lt;24h</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Slow 24–72h</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Stale &gt;72h</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Merged</span>
      </div>
      {repos.map((repo) => (
        <RepoSection
          key={repo.id}
          repo={repo}
          prs={prs.filter((pr) => pr.repo_id === repo.id)}
        />
      ))}
    </div>
  );
}
