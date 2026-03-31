import { NextResponse } from 'next/server'
import { checkUsageLimit } from '@/lib/user-usage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const status = await checkUsageLimit(req)
    return NextResponse.json({
      remaining: status.remaining,
      isPro: status.remaining === Infinity,
      isGuest: status.isGuest,
    })
  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage status' }, 
      { status: 500 }
    )
  }
}
