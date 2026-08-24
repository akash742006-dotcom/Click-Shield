/**
 * Step 2 of SQLite → Neon PostgreSQL migration.
 * Imports ALL rows from /tmp/clickshield-export.json into the Neon database,
 * preserving original IDs and createdAt timestamps.
 * MUST be run after `bun run db:push` has created the tables in Neon.
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

interface ExportedScan {
  id: string
  sessionId: string
  url: string
  message: string | null
  riskLevel: string
  riskScore: number
  indicators: string
  recommendedAction: string
  verifiedName: string | null
  verifiedUrl: string | null
  verifiedDomain: string | null
  verifiedCategory: string | null
  createdAt: string
}
interface ExportedPrivacy {
  id: string
  sessionId: string
  serviceName: string
  serviceUrl: string | null
  policyUrl: string | null
  policyTitle: string | null
  lastUpdated: string | null
  overallRisk: string
  summary: string
  createdAt: string
}

const db = new PrismaClient()

async function main() {
  const raw = readFileSync('/tmp/clickshield-export.json', 'utf-8')
  const data = JSON.parse(raw) as {
    user: any[]
    post: any[]
    scanHistory: ExportedScan[]
    privacyAnalysis: ExportedPrivacy[]
  }

  console.log('Import source:', data.user?.length || 0, 'users,', data.post?.length || 0, 'posts,',
    data.scanHistory?.length || 0, 'scans,', data.privacyAnalysis?.length || 0, 'privacy analyses')

  // Insert in chunks to keep transactions small (Neon pooled connections).
  const CHUNK = 25

  for (let i = 0; i < data.scanHistory.length; i += CHUNK) {
    const chunk = data.scanHistory.slice(i, i + CHUNK).map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      url: s.url,
      message: s.message,
      riskLevel: s.riskLevel,
      riskScore: s.riskScore,
      indicators: s.indicators,
      recommendedAction: s.recommendedAction,
      verifiedName: s.verifiedName,
      verifiedUrl: s.verifiedUrl,
      verifiedDomain: s.verifiedDomain,
      verifiedCategory: s.verifiedCategory,
      createdAt: new Date(s.createdAt),
    }))
    await db.scanHistory.createMany({ data: chunk })
  }
  console.log('Inserted', data.scanHistory.length, 'ScanHistory rows')

  if (data.privacyAnalysis.length > 0) {
    await db.privacyAnalysis.createMany({
      data: data.privacyAnalysis.map((p) => ({
        id: p.id,
        sessionId: p.sessionId,
        serviceName: p.serviceName,
        serviceUrl: p.serviceUrl,
        policyUrl: p.policyUrl,
        policyTitle: p.policyTitle,
        lastUpdated: p.lastUpdated,
        overallRisk: p.overallRisk,
        summary: p.summary,
        createdAt: new Date(p.createdAt),
      })),
    })
  }
  console.log('Inserted', data.privacyAnalysis.length, 'PrivacyAnalysis rows')

  if (data.user?.length > 0) {
    await db.user.createMany({ data: data.user.map((u) => ({ ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) })) })
    console.log('Inserted', data.user.length, 'User rows')
  }
  if (data.post?.length > 0) {
    await db.post.createMany({ data: data.post.map((p) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })) })
    console.log('Inserted', data.post.length, 'Post rows')
  }

  // Verify final counts in Neon
  const [scans, privacy] = await Promise.all([db.scanHistory.count(), db.privacyAnalysis.count()])
  console.log('--- Neon final counts ---')
  console.log('  ScanHistory:', scans)
  console.log('  PrivacyAnalysis:', privacy)

  // Verify data integrity: sample row check
  const sample = await db.scanHistory.findFirst({ orderBy: { createdAt: 'asc' } })
  console.log('Oldest scan in Neon:', sample?.url, '| created', sample?.createdAt?.toISOString())
}

main()
  .catch((e) => {
    console.error('IMPORT FAILED:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
