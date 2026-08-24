import { ShieldCheck, Heart } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">Click Shield</p>
              <p className="text-xs text-muted-foreground">
                Check before you click. Understand before you trust.
              </p>
            </div>
          </div>
          <div className="max-w-md text-xs text-muted-foreground">
            <p>
              Risk scores are assessments, not guarantees. Verified alternatives come only from
              Click Shield&apos;s trusted verified URL database and never replace your original link.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-border/40 pt-4 text-[11px] text-muted-foreground sm:flex-row">
          <p>Built for digital safety awareness.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="size-3 text-rose-500" /> for safer clicks
          </p>
        </div>
      </div>
    </footer>
  )
}
