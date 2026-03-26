import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { PRTable } from "./pr-table";

async function Dashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: repos } = await supabase
    .from("tracked_repos")
    .select("id, repo_full_name");

  if (!repos?.length) redirect("/protected");

  const repoIds = repos.map((r) => r.id);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: prs } = await supabase
    .from("pull_requests")
    .select(`
      id, pr_number, title, author, state, created_at, updated_at, merged_at, assignees,
      repo_id,
      pr_events ( actor, created_at )
    `)
    .in("repo_id", repoIds)
    .or(`state.eq.open,and(state.eq.closed,merged_at.gte.${twoWeeksAgo})`)
    .order("created_at", { ascending: true });

  return <PRTable repos={repos} prs={prs ?? []} />;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">PR Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Open and recently merged pull requests across your tracked repos.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading PRs...</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
