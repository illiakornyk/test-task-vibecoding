import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get or create user in our DB
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
  })

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { clerkId: userId },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { clerkId: userId },
      data: { stripeCustomerId: customerId },
    })
  }

  // Create a Stripe Checkout Session for a subscription
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'VoiceAI Pro',
            description: 'Unlimited voice recordings with AI responses',
          },
          unit_amount: 500, // $5.00/month placeholder
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancelled=true`,
    metadata: { clerkId: userId },
  })

  return NextResponse.json({ url: session.url })
}
