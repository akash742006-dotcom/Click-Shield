'use client'

import * as React from 'react'
import { ShieldAlert, Lock, ShieldCheck, ShieldHalf } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useSessionId } from '@/hooks/use-session-id'
import { LinkShield } from './link-shield'
import { PrivacyShield } from './privacy-shield'
import { ScanHistory } from './scan-history'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'

export function Dashboard() {
  const sessionId = useSessionId()
  const [tab, setTab] = React.useState<'link' | 'privacy'>('link')
  const [historyTick, setHistoryTick] = React.useState(0)

  // Refresh history whenever the tab changes (cheap way to surface newly saved scans).
  React.useEffect(() => {
    setHistoryTick((t) => t + 1)
  }, [tab])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="size-3.5" />
              AI-Powered Link &amp; Privacy Intelligence
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Click{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Shield
              </span>
            </h1>
            <p className="mt-3 text-lg font-medium text-foreground/90">
              Check before you click. Understand before you trust.
            </p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Detect phishing, smishing and scams before you click — and understand what an app
              does with your data before you trust it. When a link looks suspicious, find the real,
              verified website from our trusted database.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroBadge icon={<ShieldAlert className="size-4" />} title="Check before you click" />
              <HeroBadge icon={<Lock className="size-4" />} title="Understand before you trust" />
              <HeroBadge icon={<ShieldHalf className="size-4" />} title="Find the real website" />
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'link' | 'privacy')}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="link" className="gap-1.5">
                <ShieldAlert className="size-4" /> Link Shield
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-1.5">
                <Lock className="size-4" /> Privacy Shield
              </TabsTrigger>
            </TabsList>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Risk scores are assessments, not guarantees.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div>
              <TabsContent value="link" className="mt-0">
                <LinkShield sessionId={sessionId} />
              </TabsContent>
              <TabsContent value="privacy" className="mt-0">
                <PrivacyShield sessionId={sessionId} />
              </TabsContent>
            </div>
            <aside className="lg:sticky lg:top-20 lg:self-start lg:min-h-0">
              {/* key forces a refresh when tab changes */}
              <ScanHistory key={historyTick} sessionId={sessionId} />
            </aside>
          </div>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  )
}

function HeroBadge({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm font-medium backdrop-blur">
      <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
      {title}
    </div>
  )
}
