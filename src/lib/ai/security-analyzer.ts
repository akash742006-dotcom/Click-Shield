import ZAI from 'z-ai-web-dev-sdk'
import { withTimeout } from './with-timeout'
import { findVerifiedAlternative, extractDomainInfo, isExactVerifiedDomain } from '@/lib/verified-urls'

export interface SecurityIndicator {
  type: 'domain' | 'message' | 'structure' | 'impersonation'
  label: string
  severity: 'low' | 'medium' | 'high'
  detail: string
}

export interface SecurityAnalysis {
  url: string
  domain: string
  hostname: string
  riskScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  indicators: SecurityIndicator[]
  explanation: string
  recommendedAction: string
  verifiedAlternative: {
    found: boolean
    reason?: string
    website?: {
      name: string
      official_url: string
      domain: string
      category: string
    }
    confidence?: number
  }
  disclaimer: string
}

const DISCLAIMER =
  'This analysis is generated from the available information and is intended to help users make safer decisions. It is not a guarantee that a link is safe or that every indicator has been interpreted perfectly.'

function classify(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 30) return 'LOW'
  if (score <= 70) return 'MEDIUM'
  return 'HIGH'
}

function recommendedActionFor(level: 'LOW' | 'MEDIUM' | 'HIGH', score: number): string {
  if (level === 'HIGH') return 'DO NOT CONTINUE — this link shows strong phishing/smishing indicators.'
  if (level === 'MEDIUM') return 'CAUTION — proceed only if you can independently verify the sender and the destination.'
  return 'No strong suspicious characteristics detected. Still verify the sender before sharing any personal data.'
}

/** Deterministic heuristic indicators — used as a baseline and as an AI fallback. */
function heuristicIndicators(url: string, message: string): SecurityIndicator[] {
  const indicators: SecurityIndicator[] = []
  const info = extractDomainInfo(url)

  if (!info.isValid) {
    indicators.push({
      type: 'structure',
      label: 'Malformed or unreadable URL',
      severity: 'high',
      detail: 'The URL could not be parsed reliably, which is itself a red flag.',
    })
    return indicators
  }

  // Length
  if (url.length > 75) {
    indicators.push({
      type: 'structure',
      label: 'Unusually long URL',
      severity: 'medium',
      detail: `URL length is ${url.length} characters, which is often used to hide the real destination.`,
    })
  }

  // Encoded content / IP
  if (/%[0-9a-fA-F]{2}/.test(url)) {
    indicators.push({
      type: 'structure',
      label: 'Encoded characters detected',
      severity: 'medium',
      detail: 'Percent-encoded characters can hide the true destination path.',
    })
  }
  if (/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(url)) {
    indicators.push({
      type: 'domain',
      label: 'IP address used instead of domain',
      severity: 'high',
      detail: 'Raw IP addresses are frequently used in phishing to bypass domain checks.',
    })
  }

  // Subdomain abuse
  if (info.subdomains.length > 3) {
    indicators.push({
      type: 'domain',
      label: 'Excessive subdomains',
      severity: 'medium',
      detail: `Host has ${info.subdomains.length} subdomain levels, a common impersonation trick.`,
    })
  }

  // Suspicious keywords in path/host
  const lower = url.toLowerCase()
  const suspiciousKw = [
    'login', 'signin', 'verify', 'verification', 'secure', 'account', 'update',
    'confirm', 'reward', 'claim', 'prize', 'gift', 'free', 'kyc', 'otp', 'password',
    'unlock', 'suspended', 'warning', 'alert', 'bank', 'wallet',
  ]
  const matchedKw = suspiciousKw.filter((k) => lower.includes(k))
  if (matchedKw.length >= 2) {
    indicators.push({
      type: 'structure',
      label: 'Suspicious keywords in URL',
      severity: 'medium',
      detail: `Keywords found: ${matchedKw.join(', ')}.`,
    })
  }

  // TLD checks
  const tld = info.domain.split('.').pop()
  const riskyTlds = ['xyz', 'top', 'click', 'loan', 'work', 'country', 'gq', 'tk', 'ml', 'cf']
  if (tld && riskyTlds.includes(tld)) {
    indicators.push({
      type: 'domain',
      label: `High-risk TLD ".${tld}"`,
      severity: 'high',
      detail: 'This top-level domain is frequently abused for phishing campaigns.',
    })
  }

  // Impersonation via verified dataset
  const rescue = findVerifiedAlternative(url)
  if (rescue.found && rescue.website) {
    indicators.push({
      type: 'impersonation',
      label: 'Possible impersonation of a verified brand',
      severity: 'high',
      detail: `Domain closely resembles verified brand "${rescue.website.name}" (${rescue.website.domain}). ${rescue.reason || ''}`,
    })
  }

  // Is it already verified?
  if (isExactVerifiedDomain(info.domain)) {
    indicators.push({
      type: 'domain',
      label: 'Domain is a verified trusted website',
      severity: 'low',
      detail: 'The domain is present in Click Shield\'s trusted verified URL database.',
    })
  }

  // Message indicators
  if (message && message.trim().length > 0) {
    const m = message.toLowerCase()
    const msgIndicators: [string, string[], string][] = [
      ['Urgent language detected', ['urgent', 'immediately', 'right now', 'within 24', 'act now', 'expires', 'last chance', 'today only'], 'high'],
      ['Reward / prize bait detected', ['congratulations', 'you won', "you've won", 'winner', 'prize', 'reward', 'gift card', 'free', 'cashback', '₹'], 'high'],
      ['Account threat detected', ['suspended', 'blocked', 'locked', 'deactivate', 'verify your account', 'unusual activity', 'security alert'], 'high'],
      ['Delivery bait detected', ['package', 'parcel', 'delivery', 'shipped', 'out for delivery', 'courier', 'tracking', 'customs', 'held'], 'medium'],
      ['Request for sensitive information', ['otp', 'pin', 'password', 'cvv', 'aadhaar', 'pan', 'upi pin', 'card number', 'login details'], 'high'],
      ['Authority impersonation detected', ['rbi', 'income tax', 'customs', 'police', 'court', 'government', 'official'], 'medium'],
    ]
    for (const [label, keywords, severity] of msgIndicators) {
      const hits = keywords.filter((k) => m.includes(k))
      if (hits.length > 0) {
        indicators.push({
          type: 'message',
          label,
          severity: severity as 'low' | 'medium' | 'high',
          detail: `Trigger phrases: ${hits.slice(0, 4).join(', ')}.`,
        })
      }
    }
    // Shortened URL in message
    if (/bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy/.test(message)) {
      indicators.push({
        type: 'message',
        label: 'Shortened URL detected in message',
        severity: 'medium',
        detail: 'URL shorteners hide the true destination and are common in smishing.',
      })
    }
  }

  return indicators
}

function heuristicScore(indicators: SecurityIndicator[]): number {
  let score = 5
  for (const ind of indicators) {
    if (ind.severity === 'high') score += 22
    else if (ind.severity === 'medium') score += 12
    else score += 2
    // impersonation is especially dangerous
    if (ind.type === 'impersonation') score += 15
  }
  // A verified-domain indicator strongly lowers risk
  if (indicators.some((i) => i.label.includes('verified trusted website'))) {
    score = Math.min(score, 15)
  }
  return Math.max(0, Math.min(100, score))
}

const SYSTEM_PROMPT = `You are Click Shield's AI Security Engine. You analyze suspicious URLs and optional SMS/message text to detect phishing, smishing, scams, and social-engineering indicators.

You MUST respond with ONLY a valid JSON object — no markdown, no commentary. Use this exact schema:
{
  "risk_score": <integer 0-100>,
  "indicators": [
    { "type": "domain|message|structure|impersonation", "label": "<short label>", "severity": "low|medium|high", "detail": "<plain-English reason>" }
  ],
  "explanation": "<2-4 sentence plain-English summary for a non-technical user>",
  "recommended_action": "<one short sentence>"
}

Scoring guide:
- 0-30 = LOW risk (no strong suspicious characteristics)
- 31-70 = MEDIUM risk (some suspicious characteristics)
- 71-100 = HIGH risk (strong phishing/smishing indicators)

Rules:
- Never invent indicators that aren't supported by the URL or message.
- Keep language simple; assume the reader is not technical.
- If the URL exactly matches a well-known legitimate service, score LOW.
- For clear reward bait + suspicious domain, score HIGH (typically 85-97).
- "recommended_action" for HIGH risk should clearly say "DO NOT CONTINUE".
- Do not include any text outside the JSON object.`

interface AIParsed {
  risk_score?: number
  indicators?: SecurityIndicator[]
  explanation?: string
  recommended_action?: string
}

async function runAIAnalysis(url: string, message: string): Promise<AIParsed | null> {
  try {
    // Timeout-guarded: on timeout or error the caller falls back to
    // heuristic-only scoring, so the route always responds.
    const zai = await withTimeout(ZAI.create(), 20_000, 'ZAI init')
    const userPrompt = `Analyze this suspicious link and (optional) message for phishing/smishing risk.

URL: ${url}
${message ? `Message: ${message}` : 'Message: (none provided)'}

Return ONLY the JSON object described.`
    const completion = await withTimeout(
      zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      }),
      60_000,
      'Link Shield AI analysis'
    )
    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) return null
    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1)
    return JSON.parse(jsonStr) as AIParsed
  } catch (err) {
    console.error('[security-analyzer] AI error:', err)
    return null
  }
}

export async function analyzeLink(url: string, message: string): Promise<SecurityAnalysis> {
  const info = extractDomainInfo(url)
  const heuristicInds = heuristicIndicators(url, message)
  const heuristicScoreVal = heuristicScore(heuristicInds)

  // Verified Link Rescue (from the trusted dataset only).
  const rescue = findVerifiedAlternative(url)

  // Run AI risk engine.
  const ai = await runAIAnalysis(url, message)

  let finalScore: number
  let indicators: SecurityIndicator[]
  let explanation: string
  let recommendedAction: string

  if (ai && typeof ai.risk_score === 'number' && ai.indicators) {
    // Blend AI score with heuristic score (slightly weighted toward AI but floor by heuristics).
    const blended = Math.round(ai.risk_score * 0.65 + heuristicScoreVal * 0.35)
    finalScore = Math.max(blended, rescue.found ? 70 : 0)
    finalScore = Math.min(100, Math.max(0, finalScore))

    // Merge indicators, de-dup by label.
    const seen = new Set<string>()
    indicators = []
    for (const ind of [...ai.indicators, ...heuristicInds]) {
      const key = ind.label.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        indicators.push(ind)
      }
    }
    explanation = ai.explanation || ''
    recommendedAction = ai.recommended_action || ''
  } else {
    finalScore = heuristicScoreVal
    if (rescue.found) finalScore = Math.max(finalScore, 72)
    indicators = heuristicInds
    explanation =
      'Heuristic analysis completed. The score is based on URL structure, domain characteristics, and message indicators detected by Click Shield\'s rule engine.'
    recommendedAction = ''
  }

  // If a verified alternative was found, ensure an impersonation indicator is present.
  if (rescue.found && rescue.website) {
    const hasImpersonation = indicators.some((i) => i.type === 'impersonation')
    if (!hasImpersonation) {
      indicators.push({
        type: 'impersonation',
        label: 'Possible impersonation of a verified brand',
        severity: 'high',
        detail: `Domain closely resembles verified brand "${rescue.website!.name}" (${rescue.website!.domain}).`,
      })
    }
    // Bump score into at least MEDIUM/HIGH.
    finalScore = Math.max(finalScore, 72)
  }

  const level = classify(finalScore)
  if (!recommendedAction) {
    recommendedAction = recommendedActionFor(level, finalScore)
  } else {
    // Make sure HIGH risk always says DO NOT CONTINUE.
    if (level === 'HIGH' && !/do not continue/i.test(recommendedAction)) {
      recommendedAction = 'DO NOT CONTINUE — ' + recommendedAction
    }
  }

  return {
    url,
    domain: info.domain,
    hostname: info.hostname,
    riskScore: finalScore,
    riskLevel: level,
    indicators,
    explanation,
    recommendedAction,
    verifiedAlternative: rescue,
    disclaimer: DISCLAIMER,
  }
}
