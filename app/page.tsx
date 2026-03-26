import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <span className="font-semibold">Prism</span>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {hasEnvVars && (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 gap-6 py-24">
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl">
          PR intelligence for engineering teams
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Connect your GitHub repos and get instant visibility into review bottlenecks, stale PRs, and team velocity — without changing how you work.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/auth/login"
            className="bg-foreground text-background px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started with GitHub
          </Link>
          <Link
            href="/dashboard"
            className="border px-5 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            View dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full flex justify-center border-t px-5 py-20">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center text-green-500 text-lg">⚡</div>
            <h3 className="font-semibold">Instant visibility</h3>
            <p className="text-sm text-muted-foreground">
              Connect a repo and immediately see every open PR, its age, who it's assigned to, and whether it's been touched in the last 24 hours.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-md bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-lg">🔍</div>
            <h3 className="font-semibold">Stale PR detection</h3>
            <p className="text-sm text-muted-foreground">
              Color-coded staleness indicators show you at a glance which PRs need attention — before they become blockers.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500 text-lg">📈</div>
            <h3 className="font-semibold">Team trend data</h3>
            <p className="text-sm text-muted-foreground">
              After a few weeks, see your average review wait time, which reviewers are fastest, and which days your team ships the most.
            </p>
          </div>
        </div>
      </section>

      <footer className="w-full flex items-center justify-center border-t text-xs text-muted-foreground py-8">
        Built with Next.js and Supabase
      </footer>
    </main>
  );
}
