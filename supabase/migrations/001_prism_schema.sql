create table tracked_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  github_repo_id bigint not null,
  repo_full_name text not null,
  created_at timestamptz default now(),
  unique(user_id, github_repo_id)
);

create table pull_requests (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references tracked_repos(id) on delete cascade not null,
  pr_number int not null,
  title text not null,
  author text not null,
  state text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  merged_at timestamptz,
  unique(repo_id, pr_number)
);

create table pr_events (
  id uuid primary key default gen_random_uuid(),
  pr_id uuid references pull_requests(id) on delete cascade not null,
  type text not null,
  actor text not null,
  created_at timestamptz not null
);

alter table tracked_repos enable row level security;
alter table pull_requests enable row level security;
alter table pr_events enable row level security;

create policy "users manage own repos" on tracked_repos for all using (auth.uid() = user_id);
create policy "users view own prs" on pull_requests for all using (
  exists (select 1 from tracked_repos where tracked_repos.id = pull_requests.repo_id and tracked_repos.user_id = auth.uid())
);
create policy "users view own pr events" on pr_events for all using (
  exists (
    select 1 from pull_requests
    join tracked_repos on tracked_repos.id = pull_requests.repo_id
    where pull_requests.id = pr_events.pr_id and tracked_repos.user_id = auth.uid()
  )
);

create table user_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_token text not null,
  updated_at timestamptz default now()
);

alter table user_tokens enable row level security;
create policy "users manage own tokens" on user_tokens for all using (auth.uid() = user_id);
