const GITHUB_API = "https://api.github.com";

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
}

export async function getUserRepos(token: string) {
  const res = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated`, {
    headers: headers(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getRepoPRs(token: string, repoFullName: string) {
  const res = await fetch(`${GITHUB_API}/repos/${repoFullName}/pulls?state=all&per_page=100`, {
    headers: headers(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getPREvents(token: string, repoFullName: string, prNumber: number) {
  const [timeline, reviews] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${repoFullName}/issues/${prNumber}/timeline?per_page=100`, {
      headers: { ...headers(token), Accept: "application/vnd.github.mockingbird-preview+json" },
    }).then((r) => r.json()),
    fetch(`${GITHUB_API}/repos/${repoFullName}/pulls/${prNumber}/reviews`, {
      headers: headers(token),
    }).then((r) => r.json()),
  ]);

  const events: { type: string; actor: string; created_at: string }[] = [];

  for (const e of timeline) {
    if (["reviewed", "commented", "review_requested", "merged"].includes(e.event)) {
      events.push({
        type: e.event,
        actor: e.actor?.login ?? e.requested_reviewer?.login ?? "unknown",
        created_at: e.created_at ?? e.submitted_at,
      });
    }
  }

  for (const r of reviews) {
    if (r.state === "APPROVED") {
      events.push({ type: "approved", actor: r.user.login, created_at: r.submitted_at });
    }
  }

  return events;
}
