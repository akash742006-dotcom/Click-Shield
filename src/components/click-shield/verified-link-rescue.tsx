'use client'

import { ShieldCheck, ExternalLink, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

export function VerifiedLinkRescueCard({ rescue }: { rescue: VerifiedAlternative }) {
  return (
    <Card className="overflow-hidden border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <CardHeader className="border-b border-emerald-200/60 bg-emerald-100/50 dark:border-emerald-900/60 dark:bg-emerald-950/40">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base text-emerald-800 dark:text-emerald-200">
              Verified Link Rescue
            </CardTitle>
            <CardDescription className="text-emerald-700/80 dark:text-emerald-300/80">
              Find the official website from our trusted database
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {rescue.found && rescue.website ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              We found a trusted alternative.
            </p>

            <div className="rounded-xl border border-emerald-300/60 bg-white p-4 dark:border-emerald-800/60 dark:bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg font-bold">
                    {rescue.website.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-emerald-800 dark:text-emerald-200">
                      {rescue.website.name}
                    </p>
                    <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                      {rescue.website.official_url}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {rescue.website.category}
                </Badge>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Verified in Click Shield Trusted URL Database. This is the verified website from
                  our trusted database. Use this link instead of the suspicious URL.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                <a href={rescue.website.official_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open Verified Website
                </a>
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                <Info className="size-3.5" />
                Opens in a new tab. Your original URL is not modified or redirected.
              </p>
            </div>

            <p className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              The recommended website is an alternative selected from Click Shield&apos;s trusted
              verified URL database. It does not mean the original URL has been modified or
              redirected.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">No verified alternative was found in our database.</p>
                <p className="mt-1 text-xs">
                  {rescue.reason ||
                    'Click Shield could not match this URL to a verified website in its trusted database.'}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              We do not guess a legitimate website and never generate an unverified URL. Treat the
              original link with caution and navigate to the service through your own trusted
              bookmark or official app.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
