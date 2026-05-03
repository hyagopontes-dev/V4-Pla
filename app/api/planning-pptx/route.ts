import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { execSync } from 'child_process'
import { readFileSync, unlinkSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()
  const { data: planning } = await supabase.from('strategic_planning').select('*').eq('client_id', clientId).single()

  if (!planning) return NextResponse.json({ error: 'Planejamento não encontrado' }, { status: 404 })

  const outputPath = `/tmp/planning-${clientId}-${Date.now()}.pptx`
  const scriptPath = path.join(process.cwd(), 'app/api/planning-pptx/gen.js')

  try {
    execSync(`node ${scriptPath}`, {
      env: {
        ...process.env,
        PLANNING_DATA: JSON.stringify(planning),
        CLIENT_NAME: client?.name ?? 'Cliente',
        OUTPUT_PATH: outputPath,
      },
      timeout: 30000,
    })

    const buffer = readFileSync(outputPath)
    try { unlinkSync(outputPath) } catch {}

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Planejamento-${(client?.name ?? 'cliente').replace(/\s+/g, '-')}.pptx"`,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
