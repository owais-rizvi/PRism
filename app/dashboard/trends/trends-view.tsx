"use client";

type AvgWait = { repo: string; avgHours: number | null };
type ReviewerSpeed = { reviewer: string; avgHours: number; count: number };
type MergeRate = { day: string; rate: number | null; merged: number; total: number };
type Trends = {
  avgWaitByRepo: AvgWait[];
  reviewerSpeed: ReviewerSpeed[];
  mergeRateByDay: MergeRate[];
  overallAvg: number;
};

function hoursLabel(h: number) {
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TrendsView({ trends }: { trends: Trends }) {
  const { avgWaitByRepo, reviewerSpeed, mergeRateByDay, overallAvg } = trends;
  const maxWait = Math.max(...avgWaitByRepo.map((r) => r.avgHours ?? 0));
  const maxRate = 100;

  return (
    <div className="flex flex-col gap-10">

      {/* Avg review wait time */}
      <div>
        <h2 className="font-semibold mb-1">Avg Review Wait Time</h2>
        <p className="text-xs text-muted-foreground mb-4">Time from PR opened to first approval.</p>
        <div className="flex flex-col gap-3">
          {avgWaitByRepo.map((r) => (
            <div key={r.repo} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="font-mono text-xs">{r.repo}</span>
                <span className="text-xs text-muted-foreground">
                  {r.avgHours != null ? hoursLabel(r.avgHours) : "no data"}
                </span>
              </div>
              {r.avgHours != null && <Bar value={r.avgHours} max={maxWait} color="bg-blue-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Reviewer speed */}
      <div>
        <h2 className="font-semibold mb-1">Reviewer Speed</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Avg time from review request to approval. Overall avg: {hoursLabel(overallAvg)}.
        </p>
        {reviewerSpeed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {reviewerSpeed.map((r) => (
              <div key={r.reviewer} className="flex items-center justify-between px-4 py-3 gap-4">
                <span className="text-sm font-medium">{r.reviewer}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-mono ${r.avgHours < overallAvg ? "text-green-500" : "text-red-400"}`}>
                    {hoursLabel(r.avgHours)}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.count} review{r.count !== 1 ? "s" : ""}</span>
                  {r.avgHours < overallAvg
                    ? <span className="text-xs text-green-500">↑ faster</span>
                    : <span className="text-xs text-red-400">↓ slower</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merge rate by day */}
      <div>
        <h2 className="font-semibold mb-1">Merge Rate by Day</h2>
        <p className="text-xs text-muted-foreground mb-4">% of PRs that were merged, by day of week they were opened.</p>
        <div className="flex flex-col gap-3">
          {mergeRateByDay.map((d) => (
            <div key={d.day} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-xs w-8">{d.day}</span>
                <span className="text-xs text-muted-foreground">
                  {d.rate != null ? `${d.rate}% (${d.merged}/${d.total})` : "no data"}
                </span>
              </div>
              {d.rate != null && <Bar value={d.rate} max={maxRate} color="bg-purple-500" />}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
