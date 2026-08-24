import { NextRequest, NextResponse } from 'next/server'
import { analyzePrivacyPolicy } from '@/lib/ai/privacy-analyzer'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const serviceName: string = (body.serviceName || '').toString().trim()
    const policyUrl: string = (body.policyUrl || '').toString().trim()
    const serviceUrl: string = (body.serviceUrl || '').toString().trim()
    const sessionId: string = (body.sessionId || 'anon').toString().trim()

    if (!serviceName || !policyUrl) {
      return NextResponse.json(
        { error: 'Service name and privacy policy URL are required.' },
        { status: 400 }
      )
    }

    const analysis = await analyzePrivacyPolicy(serviceName, policyUrl, serviceUrl || undefined)

    // Persist to privacy analysis history (best-effort).
    try {
      await db.privacyAnalysis.create({
        data: {
          sessionId,
          serviceName: analysis.serviceName,
          serviceUrl: analysis.serviceUrl || null,
          policyUrl: analysis.policyUrl || null,
          policyTitle: analysis.policyTitle || null,
          lastUpdated: analysis.lastUpdated || null,
          overallRisk: analysis.dashboard.overallRisk,
          summary: JSON.stringify(analysis),
        },
      })
    } catch (dbErr) {
      console.error('[privacy/analyze] DB save failed (non-fatal):', dbErr)
    }

    return NextResponse.json({ success: true, analysis })
  } catch (err: any) {
    console.error('[privacy/analyze] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to analyze the privacy policy.' },
      { status: 500 }
    )
  }
}
