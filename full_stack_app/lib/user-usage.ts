import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import prisma from '@/lib/prisma'

const FREE_RECORD_LIMIT = 3

export type UsageStatus = {
  allowed: boolean
  isGuest: boolean
  userId?: string
  ipHash?: string
}

export async function checkUsageLimit(req: Request): Promise<UsageStatus> {
  const { userId: clerkId } = await auth()

  if (clerkId) {
    // Authenticated user
    let user = await prisma.user.findUnique({ where: { clerkId } })
    
    if (!user) {
      user = await prisma.user.create({ data: { clerkId } })
    }

    if (user.hasActiveSubscription) {
      return { allowed: true, isGuest: false, userId: user.id }
    }

    const recordCount = await prisma.record.count({
      where: { userId: user.id }
    })

    return { 
      allowed: recordCount < FREE_RECORD_LIMIT, 
      isGuest: false, 
      userId: user.id 
    }
  } else {
    // Guest
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'anon-' + Math.random().toString()
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')

    const guestUsage = await prisma.guestUsage.findUnique({
      where: { ipHash }
    })

    const count = guestUsage?.count ?? 0

    return { 
      allowed: count < FREE_RECORD_LIMIT, 
      isGuest: true, 
      ipHash 
    }
  }
}
