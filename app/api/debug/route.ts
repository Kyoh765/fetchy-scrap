import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const hikerKey = process.env.HIKERAPI_KEY

  // Test requête admin
  const db = createAdminClient()
  const { data, error, count } = await db
    .from('monitored_accounts')
    .select('id, instagram_username, is_active', { count: 'exact' })
    .limit(3)

  return NextResponse.json({
    env: {
      supabase_url:      url ? url.slice(0, 40) + '...' : 'MISSING',
      anon_key_present:  !!anonKey,
      svc_key_present:   !!svcKey,
      hiker_key_present: !!hikerKey,
    },
    query: {
      count,
      error: error?.message ?? null,
      sample: data ?? [],
    }
  })
}
