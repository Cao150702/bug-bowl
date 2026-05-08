import { type NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SYSTEM_PROMPT, ANALYZE_PROMPT } from '@/lib/prompts'
import { ruleBasedScore } from '@/lib/scoring'

const openai = new OpenAI()

export async function POST(request: NextRequest) {
  try {
    const { title, body } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    // Level 1: Rule-based scoring (always runs)
    const ruleResult = ruleBasedScore(title, body)

    // Level 2: AI analysis (only if rule score > 30 to save costs)
    let aiResult = null
    if (ruleResult.score > 30) {
      const prompt = ANALYZE_PROMPT
        .replace('{title}', title)
        .replace('{body}', body)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_tokens: 500,
      })

      const content = completion.choices[0].message.content || '{}'
      aiResult = JSON.parse(content)
    }

    return NextResponse.json({
      ruleScore: ruleResult.score,
      checklist: ruleResult.checklist,
      ai: aiResult,
    })
  } catch (error) {
    console.error('Bug analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
