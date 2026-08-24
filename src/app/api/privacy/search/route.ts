import { NextRequest, NextResponse } from 'next/server'
import { searchKnownService, knownServices } from '@/lib/services-catalog'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const query: string = (body.query || '').toString().trim()

    if (!query) {
      return NextResponse.json({ error: 'A search query is required.' }, { status: 400 })
    }

    const result = searchKnownService(query)
    return NextResponse.json({ success: true, query, result })
  } catch (err: any) {
    console.error('[privacy/search] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to search services.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ success: true, services: knownServices })
}
