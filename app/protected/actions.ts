"use server";

import { createClient } from "@/lib/supabase/server";
import { getRepoPRs, getPREvents } from "@/lib/github";

async function getToken() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token
    ?? (await supabase.from("user_tokens").select("github_token").single()).data?.github_token
    ?? null;
  return { supabase, token, user: session?.user ?? null };
}

export async function trackRepo(githubRepoId: number, repoFullName: string) {
  const { supabase, token, user } = await getToken();
  if (!user || !token) throw new Error("Unauthenticated");

  const { data: repo, error } = await supabase
    .from("tracked_repos")
    .upsert(
      { user_id: user.id, github_repo_id: githubRepoId, repo_full_name: repoFullName },
      { onConflict: "user_id,github_repo_id" }
    )
    .select()
    .single();

  if (error) throw error;

  const prs = await getRepoPRs(token, repoFullName);
  for (const pr of prs) {
    const { data: prRow } = await supabase
      .from("pull_requests")
      .upsert({
        repo_id: repo.id,
        pr_number: pr.number,
        title: pr.title,
        author: pr.user.login,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        merged_at: pr.merged_at ?? null,
        assignees: pr.assignees?.map((a: { login: string }) => a.login) ?? [],
      }, { onConflict: "repo_id,pr_number" })
      .select()
      .single();

    if (!prRow) continue;

    const events = await getPREvents(token, repoFullName, pr.number);
    if (events.length > 0) {
      await supabase.from("pr_events").insert(
        events.map((e) => ({ pr_id: prRow.id, ...e }))
      );
    }
  }
}

export async function untrackRepo(repoId: string) {
  const supabase = await createClient();
  await supabase.from("tracked_repos").delete().eq("id", repoId);
}

export async function syncRepo(repoId: string, repoFullName: string) {
  const { supabase, token } = await getToken();
  if (!token) throw new Error("Unauthenticated");

  const prs = await getRepoPRs(token, repoFullName);
  for (const pr of prs) {
    const { data: prRow } = await supabase
      .from("pull_requests")
      .upsert({
        repo_id: repoId,
        pr_number: pr.number,
        title: pr.title,
        author: pr.user.login,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        merged_at: pr.merged_at ?? null,
        assignees: pr.assignees?.map((a: { login: string }) => a.login) ?? [],
      }, { onConflict: "repo_id,pr_number" })
      .select()
      .single();

    if (!prRow) continue;

    const events = await getPREvents(token, repoFullName, pr.number);
    if (events.length > 0) {
      await supabase.from("pr_events").insert(
        events.map((e) => ({ pr_id: prRow.id, ...e }))
      );
    }
  }
}
