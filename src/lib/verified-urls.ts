import verifiedUrlsData from '@/data/verified_urls.json'

export interface VerifiedUrl {
  website_name: string
  official_url: string
  domain: string
  category: string
  verified: boolean
  aliases?: string[]
}

export interface VerifiedMatch {
  found: boolean
  website?: {
    name: string
    official_url: string
    domain: string
    category: string
  }
  confidence?: number
  reason?: string
}

/** Load the trusted verified dataset. Returns [] if unavailable. */
export function getVerifiedUrls(): VerifiedUrl[] {
  try {
    return (verifiedUrlsData as VerifiedUrl[]).filter((u) => u.verified === true)
  } catch {
    return []
  }
}

/** Check if the suspicious URL's domain exactly matches a verified domain (i.e. it IS the legit site). */
export function isExactVerifiedDomain(domain: string): boolean {
  const urls = getVerifiedUrls()
  const normalized = normalizeDomain(domain)
  return urls.some((u) => normalizeDomain(u.domain) === normalized)
}

/** Extract the registrable domain + hostname from a URL string. */
export function extractDomainInfo(url: string): {
  hostname: string
  domain: string
  subdomains: string[]
  isValid: boolean
} {
  try {
    let candidate = url.trim()
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = 'http://' + candidate
    }
    const parsed = new URL(candidate)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const parts = hostname.split('.')
    // crude eTLD handling: last two labels (works for most .com / .in / .co.in etc.)
    let domain = hostname
    let subdomains: string[] = []
    if (parts.length > 2) {
      // handle common second-level TLDs like .co.in, .gov.in, .org.in
      const sld = parts[parts.length - 2]
      const tld = parts[parts.length - 1]
      const twoLabelTlds = ['in', 'uk', 'au', 'nz', 'za', 'cn']
      const compoundSuffixes = ['co', 'gov', 'org', 'net', 'ac', 'nic', 'me']
      if (
        twoLabelTlds.includes(tld) &&
        compoundSuffixes.includes(sld) &&
        parts.length > 3
      ) {
        domain = parts.slice(-3).join('.')
        subdomains = parts.slice(0, parts.length - 3)
      } else {
        domain = parts.slice(-2).join('.')
        subdomains = parts.slice(0, parts.length - 2)
      }
    }
    return { hostname, domain, subdomains, isValid: true }
  } catch {
    return { hostname: '', domain: '', subdomains: [], isValid: false }
  }
}

function normalizeDomain(d: string): string {
  return d.toLowerCase().replace(/^www\./, '').replace(/\s+/g, '')
}

/**
 * Levenshtein distance — used for typo detection between two short strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

/** Normalize a token: replace common homoglyphs/number substitutions with letters. */
function denormalizeToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/-/g, '')
    .replace(/_/g, '')
}

/**
 * Find the best verified alternative for a suspicious URL.
 * Implements the PRD's two-stage rule:
 *   1. Heuristic similarity → candidate website
 *   2. Confirm candidate is in trusted dataset with verified=true
 * Returns a recommendation ONLY from the trusted dataset.
 */
export function findVerifiedAlternative(rawUrl: string): VerifiedMatch {
  const dataset = getVerifiedUrls()

  if (!dataset || dataset.length === 0) {
    return {
      found: false,
      reason: 'The verified URL dataset is currently unavailable.',
    }
  }

  const info = extractDomainInfo(rawUrl)
  if (!info.isValid) {
    return { found: false, reason: 'Could not parse the suspicious URL.' }
  }

  // If the URL is already an exact verified domain, there's nothing to "rescue".
  if (isExactVerifiedDomain(info.domain)) {
    return { found: false, reason: 'The entered URL is already a verified trusted website.' }
  }

  const suspiciousHost = info.hostname
  const suspiciousDomain = info.domain
  // Split the hostname into tokens for brand-keyword matching.
  const hostTokens = suspiciousHost.split(/[.\-_/]/).filter(Boolean)
  const denormHost = denormalizeToken(suspiciousHost)
  const denormDomain = denormalizeToken(suspiciousDomain)

  // Generic tokens that must never be treated as brand keywords — they are too
  // common and cause false positives (e.g. "bank" from bank.sbi, "pay" from
  // pay.google.com, or the TLD "com" matching inside "incometax").
  const GENERIC_TOKENS = new Set([
    'bank', 'pay', 'live', 'com', 'in', 'org', 'net', 'gov', 'co', 'www',
    'app', 'online', 'login', 'secure', 'verify', 'verification', 'security',
    'account', 'wallet', 'money', 'credit', 'card', 'digital', 'india',
    'banking', 'financial', 'service', 'official', 'site', 'web', 'home',
    'page', 'html', 'portal', 'info', 'biz', 'xyz', 'top', 'click', 'me',
    'club', 'in-', 'india-',
  ])

  let bestMatch: VerifiedUrl | null = null
  let bestScore = 0
  let bestReason = ''

  for (const entry of dataset) {
    let score = 0
    let reason = ''

    const entryDomain = normalizeDomain(entry.domain)
    const entryDomainDenorm = denormalizeToken(entryDomain)

    // 1. Exact domain match (shouldn't happen here, but safe).
    if (entryDomain === suspiciousDomain) {
      score = 100
      reason = 'Exact match with a verified domain.'
    }

    // 2. Brand domain-SLD keyword overlap (e.g., "hdfcbank" inside suspicious host).
    //    Only the registrable brand label is used here (aliases handled in step 4).
    //    We only accept the direction where the SUSPICIOUS token CONTAINS the brand
    //    label — never the reverse — to avoid generic tokens like "com" matching
    //    inside "incometax".
    const entrySldLabel = denormalizeToken(entryDomain.split('.')[0])
    if (entrySldLabel.length >= 5 && !GENERIC_TOKENS.has(entrySldLabel)) {
      for (const token of hostTokens) {
        const dt = denormalizeToken(token)
        if (dt.length < 4 || GENERIC_TOKENS.has(dt)) continue
        if (dt.includes(entrySldLabel)) {
          const s =
            Math.min(entrySldLabel.length, dt.length) /
            Math.max(entrySldLabel.length, dt.length)
          const cand = 60 + 35 * s
          if (cand > score) {
            score = cand
            reason = `Brand keyword "${entrySldLabel}" detected in suspicious domain "${suspiciousDomain}".`
          }
        }
      }
    }

    // 3. Typosquatting via Levenshtein on the domain second-level.
    const suspiciousSld = suspiciousDomain.split('.')[0]
    const entrySld = entryDomain.split('.')[0]
    if (suspiciousSld.length >= 4 && entrySld.length >= 4) {
      const dist = levenshtein(denormDomain, entryDomainDenorm)
      const maxLen = Math.max(denormDomain.length, entryDomainDenorm.length)
      const similarity = 1 - dist / maxLen
      // Strong typosquatting signal: very close but not identical.
      if (similarity >= 0.78 && dist > 0 && dist <= 3) {
        const cand = 55 + 40 * similarity
        if (cand > score) {
          score = cand
          reason = `Typosquatting detected: "${suspiciousDomain}" closely resembles verified domain "${entryDomain}".`
        }
      }
    }

    // 4. Alias match (e.g., "sbi", "paytm" appears in suspicious host).
    //    Short aliases (< 5 chars) only match as whole tokens to avoid false positives.
    //    Generic aliases are skipped entirely.
    for (const alias of entry.aliases || []) {
      const a = denormalizeToken(alias)
      if (a.length < 3 || GENERIC_TOKENS.has(a)) continue
      const isWholeToken = hostTokens.some((t) => denormalizeToken(t) === a)
      const isSubstring = denormHost.includes(a)
      const qualifies = a.length >= 5 ? isSubstring : isWholeToken
      if (!qualifies) continue
      const cand = 65 + Math.min(25, a.length * 2)
      if (cand > score) {
        score = cand
        reason = `Known brand alias "${alias}" detected in suspicious hostname.`
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = entry
      bestReason = reason
    }
  }

  // Only recommend when confidence is reasonably high AND candidate is verified=true.
  const CONFIDENCE_THRESHOLD = 62
  if (bestMatch && bestScore >= CONFIDENCE_THRESHOLD && bestMatch.verified === true) {
    return {
      found: true,
      confidence: Math.round(bestScore),
      reason: bestReason,
      website: {
        name: bestMatch.website_name,
        official_url: bestMatch.official_url,
        domain: bestMatch.domain,
        category: bestMatch.category,
      },
    }
  }

  return {
    found: false,
    reason: 'No verified alternative was found in our database.',
  }
}
