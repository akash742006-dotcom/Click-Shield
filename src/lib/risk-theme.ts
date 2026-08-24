export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface RiskTheme {
  label: string
  emoji: string
  textClass: string
  bgClass: string
  borderClass: string
  ringClass: string
  badgeClass: string
  barClass: string
  hex: string
}

export function getRiskTheme(level: RiskLevel | string): RiskTheme {
  const l = (level || 'LOW').toString().toUpperCase()
  if (l === 'HIGH') {
    return {
      label: 'HIGH RISK',
      emoji: '🔴',
      textClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40',
      borderClass: 'border-rose-200 dark:border-rose-900/60',
      ringClass: 'ring-rose-500/30',
      badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      barClass: 'bg-rose-500',
      hex: '#e11d48',
    }
  }
  if (l === 'MEDIUM') {
    return {
      label: 'MEDIUM RISK',
      emoji: '🟠',
      textClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderClass: 'border-amber-200 dark:border-amber-900/60',
      ringClass: 'ring-amber-500/30',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      barClass: 'bg-amber-500',
      hex: '#d97706',
    }
  }
  return {
    label: 'LOW RISK',
    emoji: '🟢',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-900/60',
    ringClass: 'ring-emerald-500/30',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    barClass: 'bg-emerald-500',
    hex: '#059669',
  }
}

export function severityBadge(sev: 'low' | 'medium' | 'high' | string) {
  const s = (sev || 'low').toString().toLowerCase()
  if (s === 'high') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  if (s === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
}
