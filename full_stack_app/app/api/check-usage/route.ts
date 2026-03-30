import { NextResponse } from 'next/server'
import { checkUsageLimit } from '@/lib/user-usage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const usage = await checkUsageLimit(req)
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'LIMIT_REACHED' },
        { status: 403 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Check usage error:', error)
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    )
  }
}
