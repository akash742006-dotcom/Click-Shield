'use client'

import { ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">
              Click<span className="text-emerald-600 dark:text-emerald-400">Shield</span>
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              AI-Powered Link &amp; Privacy Intelligence
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.cybercrime.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Report cybercrime
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
