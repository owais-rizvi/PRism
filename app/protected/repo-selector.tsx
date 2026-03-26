"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackRepo, untrackRepo } from "./actions";

type GithubRepo = { id: number; full_name: string };
type TrackedRepo = { id: string; github_repo_id: number; repo_full_name: string };

export function RepoSelector({
  githubRepos,
  trackedRepos,
}: {
  githubRepos: GithubRepo[];
  trackedRepos: TrackedRepo[];
}) {
  const [tracked, setTracked] = useState<TrackedRepo[]>(trackedRepos);
  const [loading, setLoading] = useState<number | null>(null);
  const router = useRouter();

  const trackedIds = new Set(tracked.map((r) => r.github_repo_id));

  async function handleTrack(repo: GithubRepo) {
    setLoading(repo.id);
    await trackRepo(repo.id, repo.full_name);
    setTracked((prev) => [...prev, { id: crypto.randomUUID(), github_repo_id: repo.id, repo_full_name: repo.full_name }]);
    setLoading(null);
    router.push("/dashboard");
  }

  async function handleUntrack(repo: GithubRepo) {
    setLoading(repo.id);
    const trackedRepo = tracked.find((r) => r.github_repo_id === repo.id);
    if (trackedRepo) {
      await untrackRepo(trackedRepo.id);
      setTracked((prev) => prev.filter((r) => r.github_repo_id !== repo.id));
    }
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {githubRepos.map((repo) => {
        const isTracked = trackedIds.has(repo.id);
        const isLoading = loading === repo.id;
        return (
          <div key={repo.id} className="flex items-center justify-between border rounded-md px-4 py-3">
            <span className="text-sm font-mono">{repo.full_name}</span>
            <Button
              size="sm"
              variant={isTracked ? "outline" : "default"}
              disabled={isLoading}
              onClick={() => isTracked ? handleUntrack(repo) : handleTrack(repo)}
            >
              {isLoading ? "..." : isTracked ? "Untrack" : "Track"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
