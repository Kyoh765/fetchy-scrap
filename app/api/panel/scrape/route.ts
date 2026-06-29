import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeAllAccounts } from '@/workers/scrape-worker'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Admin ou user connecté peuvent scraper
  if (!profile?.role || !['admin', 'user'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Lire batch/offset depuis le body
  let batch = 8, offset = 0
  try {
    const body = await req.json().catch(() => ({}))
    if (body.batch)  batch  = Number(body.batch)
    if (body.offset) offset = Number(body.offset)
  } catch {}

  try {
    const result = await scrapeAllAccounts({ batch, offset })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('Erreur panel scrape:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
