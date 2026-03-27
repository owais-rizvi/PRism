# Prism

PR intelligence for engineering teams. Connect your GitHub repos and get instant visibility into review bottlenecks, stale PRs, and team velocity — without changing how you work.

## What it does

Prism has three layers of value:

**Layer 1 — Repo tracking**
Connect any of your GitHub repos via OAuth. Prism syncs all pull requests and review events (comments, approvals, review requests, merges) into its own database. No webhooks, no repo configuration needed.

**Layer 2 — PR Dashboard**
See every open PR across your tracked repos in one place. Each PR shows its age, author, assignees, and a color-coded staleness indicator based on last activity:

- 🟢 Active — touched in the last 24 hours
- 🟡 Slow — no activity in 24–72 hours
- 🔴 Stale — no activity in over 72 hours
- 🟣 Merged — recently closed PRs from the last 14 days

**Layer 3 — Trends**
After data accumulates, Prism surfaces historical intelligence unique to your team:
- Average review wait time per repo (PR opened → first approval)
- Reviewer speed ranked against team average
- Merge rate by day of week

## Tech stack

- [Next.js 15](https://nextjs.org) — App Router, Server Components, Server Actions
- [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security
- [GitHub REST API](https://docs.github.com/en/rest) — repo, PR, and timeline data
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
