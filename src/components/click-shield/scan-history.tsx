'use client'

import * as React from 'react'
import { History, RefreshCw, ShieldAlert, Lock, ExternalLink, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRiskTheme } from '@/lib/risk-theme'
import { formatDateTime } from '@/lib/format-date'

interface LinkScanItem {
  id: string
  url: string
  message: string | null
  riskLevel: string
  riskScore: number
  recommendedAction: string
  indicators: Array<{ label: string; severity: string }>
  verifiedAlternative: {
    name: string
    official_url: string
    domain: string
    category: string
  } | null
  createdAt: string
}
interface PrivacyScanItem {
  id: string
  serviceName: string
  serviceUrl: string | null
  policyUrl: string | null
  policyTitle: string | null
  lastUpdated: string | null
  overallRisk: string
  createdAt: string
}
interface HistoryData {
  linkScans: LinkScanItem[]
  privacyScans: PrivacyScanItem[]
}

export function ScanHistory({ sessionId }: { sessionId: string }) {
  const [data, setData] = React.useState<HistoryData | null>(null)
  const [loading, setLoading] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!sessionId || sessionId === 'anon') return
    setLoading(true)
    try {
      const res = await fetch(`/api/history?sessionId=${encodeURIComponent(sessionId)}&limit=100`)
      const json = await res.json()
      if (json.success) setData(json as HistoryData)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    load()
    // Poll every 5s so newly completed scans appear without a manual refresh.
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const total = (data?.linkScans.length || 0) + (data?.privacyScans.length || 0)

  return (
    <Card className="max-h-[28rem] min-h-0 lg:max-h-[calc(100vh-8rem)]">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border/40 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-emerald-600" /> Scan History
          </CardTitle>
          <CardDescription className="text-xs">
            Your recent scans in this session
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Refresh history">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="cs-history-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {total === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <History className="mx-auto mb-2 size-6 opacity-40" />
            No scans yet. Your recent link and privacy scans will appear here.
          </div>
        ) : (
          <div className="space-y-3 pb-1 pr-1">
              {data?.linkScans.map((scan) => {
                const theme = getRiskTheme(scan.riskLevel)
                return (
                  <div
                    key={scan.id}
                    className={`min-w-0 rounded-lg border ${theme.borderClass} ${theme.bgClass} p-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ShieldAlert className="size-4 shrink-0 text-emerald-600" />
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDateTime(scan.createdAt)}
                        </span>
                      </div>
                      <Badge className={`shrink-0 ${theme.badgeClass}`}>
                        {scan.riskLevel} · {scan.riskScore}%
                      </Badge>
                    </div>
                    <p className="mt-1.5 truncate font-mono text-xs" title={scan.url}>
                      {scan.url}
                    </p>
                    {scan.verifiedAlternative && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="size-3.5 shrink-0" />
                        <span className="truncate">Verified alt: {scan.verifiedAlternative.name}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {data?.privacyScans.map((scan) => {
                const theme = getRiskTheme(scan.overallRisk)
                return (
                  <div
                    key={scan.id}
                    className={`min-w-0 rounded-lg border ${theme.borderClass} ${theme.bgClass} p-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Lock className="size-4 shrink-0 text-violet-600" />
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDateTime(scan.createdAt)}
                        </span>
                      </div>
                      <Badge className={`shrink-0 ${theme.badgeClass}`}>{scan.overallRisk} risk</Badge>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium" title={scan.serviceName}>
                      {scan.serviceName}
                    </p>
                    {scan.policyUrl && (
                      <a
                        href={scan.policyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3" /> View policy
                      </a>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
