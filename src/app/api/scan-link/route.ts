import { NextRequest, NextResponse } from 'next/server'
import { analyzeLink } from '@/lib/ai/security-analyzer'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const url: string = (body.url || '').toString().trim()
    const message: string = (body.message || '').toString().trim()
    const sessionId: string = (body.sessionId || 'anon').toString().trim()

    if (!url) {
      return NextResponse.json({ error: 'A URL is required.' }, { status: 400 })
    }

    const analysis = await analyzeLink(url, message)

    // Persist to scan history (best-effort).
    try {
      await db.scanHistory.create({
        data: {
          sessionId,
          url,
          message: message || null,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          indicators: JSON.stringify(analysis.indicators),
          recommendedAction: analysis.recommendedAction,
          verifiedName: analysis.verifiedAlternative.website?.name || null,
          verifiedUrl: analysis.verifiedAlternative.website?.official_url || null,
          verifiedDomain: analysis.verifiedAlternative.website?.domain || null,
          verifiedCategory: analysis.verifiedAlternative.website?.category || null,
        },
      })
    } catch (dbErr) {
      console.error('[scan-link] DB save failed (non-fatal):', dbErr)
    }

    return NextResponse.json({ success: true, analysis })
  } catch (err: any) {
    console.error('[scan-link] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to analyze the link.' },
      { status: 500 }
    )
  }
}
