'use client'

import * as React from 'react'
import {
  Lock,
  Search,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  ChevronRight,
  Database,
  Share2,
  Coins,
  Clock,
  Trash,
  Users,
  ShieldOff,
  Baby,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { getRiskTheme } from '@/lib/risk-theme'
import { formatDateTime } from '@/lib/format-date'

interface KnownService {
  name: string
  publisher: string
  official_url: string
  privacy_policy_url: string
  aliases: string[]
  category: string
}
interface SearchResult {
  found: boolean
  service?: KnownService
  multiple?: KnownService[]
}

interface PrivacyAnalysis {
  serviceName: string
  serviceUrl?: string
  policyUrl?: string
  policyTitle?: string
  lastUpdated?: string
  analysisDate: string
  keyQuestions: {
    whatData: string
    whyCollected: string
    sharesData: 'YES' | 'NO' | 'POLICY UNCLEAR'
    sellsData: 'YES' | 'NO' | 'POLICY UNCLEAR'
    retentionPeriod: string
    canDelete: 'YES' | 'NO' | 'LIMITED' | 'UNCLEAR'
    canOptOut: string
  }
  dashboard: {
    dataCollection: 'LOW' | 'MEDIUM' | 'HIGH'
    dataSharing: 'LOW' | 'MEDIUM' | 'HIGH'
    advertisingTracking: 'LOW' | 'MEDIUM' | 'HIGH'
    dataRetention: 'CLEAR' | 'UNCLEAR'
    userControl: 'STRONG' | 'MODERATE' | 'LIMITED'
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  sections: {
    dataCollection: string
    dataUsage: string
    dataSharing: string
    dataSelling: string
    dataRetention: string
    userRights: string
    accountDeletion: string
    childrenPrivacy: string
  }
  riskExplanation: string
  simpleSummary: string
  disclaimer: string
  retrieved: boolean
  retrievalError?: string
}

const POPULAR_SERVICES = ['Instagram', 'WhatsApp', 'Google', 'Amazon', 'Spotify', 'TikTok']

function yesNoBadge(v: string) {
  const s = (v || '').toUpperCase()
  if (s === 'YES') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  if (s === 'NO') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (s === 'LIMITED') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
}

function levelBadge(v: string) {
  const s = (v || '').toUpperCase()
  if (s === 'HIGH') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  if (s === 'MEDIUM') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  if (s === 'LIMITED') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  if (s === 'STRONG') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (s === 'MODERATE') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  if (s === 'CLEAR') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (s === 'UNCLEAR') return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
}

export function PrivacyShield({ sessionId }: { sessionId: string }) {
  const [query, setQuery] = React.useState('')
  const [searching, setSearching] = React.useState(false)
  const [searchResult, setSearchResult] = React.useState<SearchResult | null>(null)
  const [selected, setSelected] = React.useState<KnownService | null>(null)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<PrivacyAnalysis | null>(null)
  const { toast } = useToast()

  async function handleSearch() {
    if (!query.trim()) {
      toast({ title: 'Enter a service', description: 'Type an app or service name.', variant: 'destructive' })
      return
    }
    setSearching(true)
    setSearchResult(null)
    setSelected(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/privacy/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Search failed')
      setSearchResult(data.result as SearchResult)
      if (!data.result.found) {
        toast({
          title: 'Service not in catalog',
          description:
            'Click Shield could not find this service in its catalog. Try one of the popular services below.',
          variant: 'destructive',
        })
      } else if (data.result.service) {
        setSelected(data.result.service)
      }
    } catch (err: any) {
      toast({ title: 'Search failed', description: err?.message, variant: 'destructive' })
    } finally {
      setSearching(false)
    }
  }

  async function handleAnalyze() {
    if (!selected) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/privacy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: selected.name,
          policyUrl: selected.privacy_policy_url,
          serviceUrl: selected.official_url,
          sessionId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data.analysis as PrivacyAnalysis)
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err?.message, variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  function reset() {
    setQuery('')
    setSearchResult(null)
    setSelected(null)
    setAnalysis(null)
  }

  const overallTheme = analysis ? getRiskTheme(analysis.dashboard.overallRisk) : null

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
              <Lock className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Privacy Shield</CardTitle>
              <CardDescription>Understand what an app does with your data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ps-query" className="flex items-center gap-1.5 text-sm">
              <Search className="size-3.5" /> Search an app or service
            </Label>
            <div className="flex gap-2">
              <Input
                id="ps-query"
                placeholder="Instagram, WhatsApp, Google…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
              >
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Popular:</span>
            {POPULAR_SERVICES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s)
                  setSearchResult(null)
                  setSelected(null)
                  setAnalysis(null)
                }}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>

          {searchResult?.multiple && searchResult.multiple.length > 1 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-sm font-medium">
                Multiple services matched. Please select the correct one:
              </p>
              <div className="space-y-1.5">
                {searchResult.multiple.map((svc) => (
                  <button
                    key={svc.name}
                    onClick={() => {
                      setSelected(svc)
                      setAnalysis(null)
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-transparent bg-background px-3 py-2 text-left text-sm transition hover:border-border hover:bg-muted/40"
                    type="button"
                  >
                    <span className="font-medium">{svc.name}</span>
                    <span className="text-xs text-muted-foreground">{svc.publisher}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected && !analysis && (
            <Card className="border-violet-200 bg-violet-50/40 dark:border-violet-900/60 dark:bg-violet-950/20">
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Official service identified
                    </p>
                    <p className="text-base font-semibold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.publisher}</p>
                  </div>
                  <Badge>{selected.category}</Badge>
                </div>
                <Separator />
                <div className="space-y-1 text-xs">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <ExternalLink className="size-3.5" /> Official website:{' '}
                    <a
                      href={selected.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-foreground underline-offset-2 hover:underline"
                    >
                      {selected.official_url}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="size-3.5" /> Privacy policy:{' '}
                    <a
                      href={selected.privacy_policy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-foreground underline-offset-2 hover:underline"
                    >
                      {selected.privacy_policy_url}
                    </a>
                  </p>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Analyzing privacy policy…
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" /> Analyze Privacy
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Retrieving and analyzing the official privacy policy can take 20–60 seconds.
                </p>
              </CardContent>
            </Card>
          )}

          {(query || selected || analysis) && (
            <Button variant="outline" onClick={reset} disabled={analyzing || searching} className="w-full">
              <Trash2 className="size-4" /> Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {analyzing && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="size-8 animate-spin text-violet-600" />
            <div>
              <p className="font-medium">Reading the privacy policy…</p>
              <p className="text-xs text-muted-foreground">
                Click Shield is retrieving and parsing the official privacy policy, then running
                the AI privacy analyzer.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && overallTheme && (
        <div className="space-y-5">
          {/* Overall risk banner */}
          <Card className={`border-2 ${overallTheme.borderClass} ${overallTheme.bgClass}`}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{overallTheme.emoji}</span>
                  <div>
                    <CardTitle className={`text-xl ${overallTheme.textClass}`}>
                      {analysis.dashboard.overallRisk} Privacy Risk
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {analysis.serviceName}
                    </CardDescription>
                  </div>
                </div>
                {analysis.retrieved ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" /> Policy analyzed
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    <AlertCircle className="mr-1 size-3" /> Limited analysis
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {analysis.simpleSummary && (
                <p className="text-sm text-foreground/80">{analysis.simpleSummary}</p>
              )}
              {analysis.riskExplanation && (
                <div className={`rounded-lg p-3 ${overallTheme.bgClass} ${overallTheme.borderClass} border`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Why this risk level
                  </p>
                  <p className="mt-1 text-sm">{analysis.riskExplanation}</p>
                </div>
              )}
              {analysis.retrievalError && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠ {analysis.retrievalError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Key questions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key Questions</CardTitle>
              <CardDescription>The questions users actually care about.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <KeyQ icon={<Database className="size-4" />} title="What data do they collect?">
                <p className="whitespace-pre-line text-sm">{analysis.keyQuestions.whatData}</p>
              </KeyQ>
              <KeyQ icon={<ChevronRight className="size-4" />} title="Why do they collect it?">
                <p className="whitespace-pre-line text-sm">{analysis.keyQuestions.whyCollected}</p>
              </KeyQ>
              <KeyQ icon={<Share2 className="size-4" />} title="Do they share my data?">
                <Badge className={yesNoBadge(analysis.keyQuestions.sharesData)}>
                  {analysis.keyQuestions.sharesData}
                </Badge>
              </KeyQ>
              <KeyQ icon={<Coins className="size-4" />} title="Do they sell my data?">
                <Badge className={yesNoBadge(analysis.keyQuestions.sellsData)}>
                  {analysis.keyQuestions.sellsData}
                </Badge>
              </KeyQ>
              <KeyQ icon={<Clock className="size-4" />} title="How long do they keep my data?">
                <p className="text-sm">{analysis.keyQuestions.retentionPeriod}</p>
              </KeyQ>
              <KeyQ icon={<Trash className="size-4" />} title="Can I delete my data?">
                <Badge className={yesNoBadge(analysis.keyQuestions.canDelete)}>
                  {analysis.keyQuestions.canDelete}
                </Badge>
              </KeyQ>
              <KeyQ icon={<ShieldOff className="size-4" />} title="Can I opt out?" className="sm:col-span-2">
                <p className="text-sm">{analysis.keyQuestions.canOptOut}</p>
              </KeyQ>
            </CardContent>
          </Card>

          {/* Dashboard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Privacy Dashboard</CardTitle>
              <CardDescription>Quick overview of data practices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DashTile label="Data Collection" value={analysis.dashboard.dataCollection} />
              <DashTile label="Data Sharing" value={analysis.dashboard.dataSharing} />
              <DashTile label="Advertising & Tracking" value={analysis.dashboard.advertisingTracking} />
              <DashTile label="Data Retention" value={analysis.dashboard.dataRetention} />
              <DashTile label="User Control" value={analysis.dashboard.userControl} />
              <DashTile label="Overall Risk" value={analysis.dashboard.overallRisk} highlight />
            </CardContent>
          </Card>

          {/* Detailed sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detailed Breakdown</CardTitle>
              <CardDescription>Plain-English explanation of each area.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Section icon={<Database className="size-4" />} title="Data Collection" text={analysis.sections.dataCollection} />
              <Section icon={<ChevronRight className="size-4" />} title="Data Usage" text={analysis.sections.dataUsage} />
              <Section icon={<Share2 className="size-4" />} title="Data Sharing" text={analysis.sections.dataSharing} />
              <Section icon={<Coins className="size-4" />} title="Data Selling" text={analysis.sections.dataSelling} />
              <Section icon={<Clock className="size-4" />} title="Data Retention" text={analysis.sections.dataRetention} />
              <Section icon={<Users className="size-4" />} title="User Rights" text={analysis.sections.userRights} />
              <Section icon={<Trash className="size-4" />} title="Account & Data Deletion" text={analysis.sections.accountDeletion} />
              <Section icon={<Baby className="size-4" />} title="Children's Privacy" text={analysis.sections.childrenPrivacy} />
            </CardContent>
          </Card>

          {/* Source verification */}
          <Card className="border-violet-200 bg-violet-50/30 dark:border-violet-900/60 dark:bg-violet-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-violet-600" /> Source Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {analysis.policyTitle && (
                <div>
                  <span className="text-muted-foreground">Policy title:</span>{' '}
                  <span className="font-medium">{analysis.policyTitle}</span>
                </div>
              )}
              {analysis.lastUpdated && (
                <div>
                  <span className="text-muted-foreground">Last updated:</span>{' '}
                  <span className="font-medium">{analysis.lastUpdated}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Analyzed on:</span>{' '}
                <span className="font-medium">{formatDateTime(analysis.analysisDate)}</span>
              </div>
              {analysis.policyUrl && (
                <Button asChild variant="outline" size="sm" className="mt-2 w-full sm:w-auto">
                  <a href={analysis.policyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" /> View Original Privacy Policy
                  </a>
                </Button>
              )}
              <p className="pt-2 text-[11px] text-muted-foreground">{analysis.disclaimer}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function KeyQ({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg border border-border/60 bg-muted/30 p-3 ${className || ''}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="text-violet-600 dark:text-violet-400">{icon}</span>
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function DashTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? 'border-foreground/30 bg-foreground/5'
          : 'border-border/60 bg-muted/30'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <Badge className={`mt-1.5 ${levelBadge(value)}`}>{value}</Badge>
    </div>
  )
}

function Section({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <span className="text-violet-600 dark:text-violet-400">{icon}</span>
        {title}
      </div>
      <p className="text-sm text-foreground/80">{text}</p>
    </div>
  )
}
