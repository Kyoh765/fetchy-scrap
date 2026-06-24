import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/settings — lit les paramètres actuels
export async function GET() {
  const db = createAdminClient()
  const { data } = await db
    .from('app_settings')
    .select('key, value')

  const settings: Record<string, string> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({
    threshold: Number(settings.viral_threshold ?? 5),
    baseline:  Number(settings.baseline_size   ?? 30),
    frequency: Number(settings.scrape_frequency ?? 4),
  })
}

// POST /api/settings — sauvegarde les paramètres
export async function POST(req: NextRequest) {
  const db = createAdminClient()
  const body = await req.json()

  const upserts = [
    { key: 'viral_threshold',  value: String(body.threshold  ?? 5)  },
    { key: 'baseline_size',    value: String(body.baseline   ?? 30) },
    { key: 'scrape_frequency', value: String(body.frequency  ?? 4)  },
  ]

  const { error } = await db
    .from('app_settings')
    .upsert(upserts, { onConflict: 'key' })

  if (error) {
    console.error('Erreur save settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
