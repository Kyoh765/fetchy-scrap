import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllAccounts } from '@/workers/scrape-worker'

export const maxDuration = 60 // Vercel pro/hobby max

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')

  // Accepte le secret Railway OU 'manual' pour les tests depuis le panel
  if (secret !== process.env.CRON_SECRET && secret !== 'manual') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Paramètre optionnel ?batch=N&offset=M pour paginer les comptes
  const url    = new URL(req.url)
  const batch  = Number(url.searchParams.get('batch')  ?? '8')
  const offset = Number(url.searchParams.get('offset') ?? '0')

  try {
    const result = await scrapeAllAccounts({ batch, offset })
    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() })
  } catch (error) {
    console.error('Erreur cron scrape:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
