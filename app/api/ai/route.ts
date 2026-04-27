import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { prompt } = await request.json()

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt vazio' }, { status: 400 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: response.status })
  }

  const data = await response.json()
  const text = data.content?.map((c: any) => c.text ?? '').join('') ?? ''
  return NextResponse.json({ text })
}
