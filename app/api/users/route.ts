import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/users — inviter un utilisateur
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Vérifier que c'est un admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, role } = await req.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'email et role requis' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Inviter via Supabase Auth
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Créer le profil avec le rôle
  await adminClient.from('profiles').upsert({
    id:    data.user.id,
    email: email,
    role:  role,
    invited_by: user.id,
  })

  return NextResponse.json({ ok: true, userId: data.user.id })
}
