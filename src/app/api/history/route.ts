import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId') || 'anon'
    const limit = Math.min(100, Number(searchParams.get('limit') || 50))

    const [scans, privacy] = await Promise.all([
      db.scanHistory.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.privacyAnalysis.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    return NextResponse.json({
      success: true,
      linkScans: scans.map((s) => ({
        id: s.id,
        url: s.url,
        message: s.message,
        riskLevel: s.riskLevel,
        riskScore: s.riskScore,
        recommendedAction: s.recommendedAction,
        indicators: JSON.parse(s.indicators || '[]'),
        verifiedAlternative: s.verifiedUrl
          ? {
              name: s.verifiedName,
              official_url: s.verifiedUrl,
              domain: s.verifiedDomain,
              category: s.verifiedCategory,
            }
          : null,
        createdAt: s.createdAt,
      })),
      privacyScans: privacy.map((p) => ({
        id: p.id,
        serviceName: p.serviceName,
        serviceUrl: p.serviceUrl,
        policyUrl: p.policyUrl,
        policyTitle: p.policyTitle,
        lastUpdated: p.lastUpdated,
        overallRisk: p.overallRisk,
        createdAt: p.createdAt,
      })),
    })
  } catch (err: any) {
    console.error('[history] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to load history.' },
      { status: 500 }
    )
  }
}
