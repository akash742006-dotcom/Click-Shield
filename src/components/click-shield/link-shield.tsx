'use client'

import * as React from 'react'
import {
  ScanLine,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  MessageSquareText,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { getRiskTheme, severityBadge, type RiskLevel } from '@/lib/risk-theme'
import { VerifiedLinkRescueCard } from './verified-link-rescue'

interface SecurityIndicator {
  type: 'domain' | 'message' | 'structure' | 'impersonation'
  label: string
  severity: 'low' | 'medium' | 'high'
  detail: string
}
interface VerifiedWebsite {
  name: string
  official_url: string
  domain: string
  category: string
}
interface VerifiedAlternative {
  found: boolean
  reason?: string
  website?: VerifiedWebsite
  confidence?: number
}
interface SecurityAnalysis {
  url: string
  domain: string
  hostname: string
  riskScore: number
  riskLevel: RiskLevel
  indicators: SecurityIndicator[]
  explanation: string
  recommendedAction: string
  verifiedAlternative: VerifiedAlternative
  disclaimer: string
}

const EXAMPLES = [
  {
    label: 'Reward smishing',
    url: 'https://paypa1-login-claim.example',
    message:
      'Congratulations! You won Rs.25,000. Claim your reward immediately. Your reward expires today. Verify your account now.',
  },
  {
    label: 'Bank impersonation',
    url: 'https://hdfcbank-verify-login.example.xyz',
    message:
      'URGENT: Your HDFC account is suspended. Verify your KYC within 24 hours or your account will be blocked permanently. Click here now.',
  },
  {
    label: 'Delivery bait',
    url: 'https://bluedart-tracking-parcel.example-click.me',
    message:
      'Your parcel is held at customs. Pay Rs.25 clearance charge to release your package. Track now: https://bluedart-tracking-parcel.example-click.me',
  },
  {
    label: 'Safe link',
    url: 'https://www.google.com',
    message: '',
  },
]

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const theme = getRiskTheme(level)
  const radius = 52
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex size-32 items-center justify-center">
      <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/30"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={theme.hex}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${theme.textClass}`}>{score}%</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          risk score
        </span>
      </div>
    </div>
  )
}

export function LinkShield({ sessionId }: { sessionId: string }) {
  const [url, setUrl] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<SecurityAnalysis | null>(null)
  const { toast } = useToast()

  async function handleScan() {
    if (!url.trim()) {
      toast({ title: 'Enter a URL', description: 'Paste a suspicious URL to scan.', variant: 'destructive' })
      return
    }
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/scan-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), message: message.trim(), sessionId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze the link.')
      }
      setAnalysis(data.analysis as SecurityAnalysis)
    } catch (err: any) {
      toast({
        title: 'Scan failed',
        description: err?.message || 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function loadExample(ex: (typeof EXAMPLES)[number]) {
    setUrl(ex.url)
    setMessage(ex.message)
    setAnalysis(null)
  }

  function reset() {
    setUrl('')
    setMessage('')
    setAnalysis(null)
  }

  const theme = analysis ? getRiskTheme(analysis.riskLevel) : null
  const showRescue = analysis && analysis.riskLevel !== 'LOW' && analysis.verifiedAlternative

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Link Shield</CardTitle>
              <CardDescription>
                Check a suspicious URL or message before you click.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ls-url" className="flex items-center gap-1.5 text-sm">
              <Link2 className="size-3.5" /> Paste suspicious URL
            </Label>
            <Input
              id="ls-url"
              placeholder="https://paypa1-login-claim.example"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ls-msg" className="flex items-center gap-1.5 text-sm">
              <MessageSquareText className="size-3.5" /> Paste SMS / message{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ls-msg"
              placeholder="Paste the SMS, WhatsApp or email message that came with the link…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={handleScan}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <ScanLine className="size-4" /> Scan Link
                </>
              )}
            </Button>
            {(url || message || analysis) && (
              <Button variant="outline" onClick={reset} disabled={loading}>
                <Trash2 className="size-4" /> Clear
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => loadExample(ex)}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
              >
                {ex.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            We never ask for passwords, PINs, OTPs or CVVs. Click Shield only analyzes the URL and
            message text you provide.
          </p>
        </CardContent>
      </Card>

      {analysis && theme && (
        <div className="space-y-5">
          <Card className={`border-2 ${theme.borderClass} ${theme.bgClass}`}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{theme.emoji}</span>
                  <div>
                    <CardTitle className={`text-xl ${theme.textClass}`}>
                      {theme.label} — {analysis.riskScore}%
                    </CardTitle>
                    <CardDescription className="font-mono text-xs break-all">
                      {analysis.url}
                    </CardDescription>
                  </div>
                </div>
                <RiskGauge score={analysis.riskScore} level={analysis.riskLevel} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {analysis.explanation && (
                <p className="text-sm text-foreground/80">{analysis.explanation}</p>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold">Detected Indicators</h4>
                {analysis.indicators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No suspicious indicators detected.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {analysis.indicators.map((ind, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/60 p-2.5"
                      >
                        <span className="mt-0.5 text-base">
                          {ind.severity === 'high' ? '⚠️' : ind.severity === 'medium' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{ind.label}</span>
                            <Badge className={severityBadge(ind.severity)}>
                              {ind.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {ind.type}
                            </Badge>
                          </div>
                          {ind.detail && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{ind.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator />

              <div className={`rounded-lg p-3 ${theme.bgClass} ${theme.borderClass} border`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommended Action
                </p>
                <p className={`mt-1 text-sm font-semibold ${theme.textClass}`}>
                  {analysis.recommendedAction}
                </p>
                {analysis.riskLevel === 'HIGH' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Click Shield will not automatically open a HIGH RISK link. Do not continue
                    unless you have independently verified the sender through a trusted channel.
                  </p>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">{analysis.disclaimer}</p>
            </CardContent>
          </Card>

          {showRescue && <VerifiedLinkRescueCard rescue={analysis.verifiedAlternative} />}

          {analysis.riskLevel === 'LOW' && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <CardContent className="flex items-start gap-3 pt-4">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    No verified alternative needed.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This URL did not trigger Verified Link Rescue because no strong suspicious
                    indicators were detected.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
