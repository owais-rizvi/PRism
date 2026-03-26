import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRepos } from "@/lib/github";
import { RepoSelector } from "./repo-selector";
import { Suspense } from "react";

async function RepoList() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  let token = session.provider_token ?? null;
  if (!token) {
    const { data } = await supabase.from("user_tokens").select("github_token").single();
    token = data?.github_token ?? null;
  }

  if (!token) redirect("/auth/login");

  const [allRepos, { data: trackedRepos }] = await Promise.all([
    getUserRepos(token),
    supabase.from("tracked_repos").select("id, github_repo_id, repo_full_name"),
  ]);

  const githubRepos = allRepos.filter((r: { fork: boolean }) => !r.fork);

  return (
    <RepoSelector
      githubRepos={githubRepos}
      trackedRepos={trackedRepos ?? []}
    />
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Your Repositories</h1>
        <p className="text-sm text-muted-foreground mt-1">Select repos to track PR activity.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading repos...</p>}>
        <RepoList />
      </Suspense>
    </div>
  );
}
