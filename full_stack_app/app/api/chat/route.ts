import { NextResponse } from 'next/server'
import { groq } from '@/lib/groq'
import { checkUsageLimit } from '@/lib/user-usage'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const usage = await checkUsageLimit(req)
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'LIMIT_REACHED' },
        { status: 403 }
      )
    }

    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // Get AI response using Groq's Llama model
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful, concise assistant. Respond to the user\'s spoken message in a natural, conversational way. Keep responses under 200 words unless the topic requires more detail.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
    })

    const aiResponse = completion.choices[0]?.message?.content ?? 'No response generated.'

    // Save to Database
    if (usage.isGuest && usage.ipHash) {
      // Upsert guest usage counter
      await prisma.guestUsage.upsert({
        where: { ipHash: usage.ipHash },
        update: { count: { increment: 1 } },
        create: { ipHash: usage.ipHash, count: 1 }
      })
      
      // Save record without user
      await prisma.record.create({
        data: {
          transcribedText: text,
          aiResponse: aiResponse
        }
      })
    } else if (!usage.isGuest && usage.userId) {
      // Save record to user account
      await prisma.record.create({
        data: {
          userId: usage.userId,
          transcribedText: text,
          aiResponse: aiResponse
        }
      })
    }

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
