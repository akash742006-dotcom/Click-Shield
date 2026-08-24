/**
 * Deterministic date formatter.
 *
 * `Date.prototype.toLocaleString()` depends on the runtime's locale and
 * timezone data, which can differ between the Node SSR pass and the browser.
 * Even though our scan-history dates only render *after* a client-side fetch
 * (so they don't technically take part in the SSR→hydration diff), we use a
 * fully deterministic formatter here to:
 *   1. guarantee identical strings regardless of runtime locale/tz, and
 *   2. be resilient against any future SSR-rendered date display.
 */
export function formatDateTime(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}
