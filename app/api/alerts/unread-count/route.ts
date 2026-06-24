import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('viral_alerts')
    .select('id', { count: 'exact', head: true })
    .not('id', 'in',
      supabase.from('alert_reads').select('alert_id').eq('user_id', user.id)
    )

  return NextResponse.json({ count: count ?? 0 })
}
