import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllAccounts } from '@/workers/scrape-worker'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')

  // Accepte le secret Railway OU 'manual' pour les tests depuis le panel
  if (secret !== process.env.CRON_SECRET && secret !== 'manual') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await scrapeAllAccounts()
    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() })
  } catch (error) {
    console.error('Erreur cron scrape:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
