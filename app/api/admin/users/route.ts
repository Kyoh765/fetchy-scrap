import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// ── Guard admin ──────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// GET /api/admin/users — liste tous les membres avec métadonnées auth
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()

  // Profils DB
  const { data: profiles } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Auth users (last_sign_in_at, email_confirmed_at)
  const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 200 })
  type AuthUser = { id: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null }
  const authMap = new Map<string, AuthUser>(authUsers.map((u: AuthUser) => [u.id, u]))

  const members = (profiles ?? []).map((p: Record<string, unknown>) => {
    const auth = authMap.get(p.id as string)
    return {
      ...p,
      last_sign_in_at:    auth?.last_sign_in_at    ?? null,
      email_confirmed_at: auth?.email_confirmed_at ?? null,
      confirmed:          !!(auth?.email_confirmed_at),
    }
  })

  return NextResponse.json({ members })
}

// POST /api/admin/users — inviter un nouvel utilisateur
export async function POST(req: NextRequest) {
  const actor = await requireAdmin()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, role = 'user', plan = 'free', name } = await req.json()
  if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 })

  const db = createAdminClient()

  // Crée le user dans Auth
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Upsert profil
  await db.from('profiles').upsert({
    id: data.user.id,
    email,
    name: name ?? null,
    role,
    plan,
    status: 'active',
    invited_by: actor.id,
  })

  // Log
  await db.from('admin_logs').insert({
    actor_id:    actor.id,
    action:      'user.invite',
    target_id:   data.user.id,
    target_type: 'profile',
    meta:        { email, role, plan },
  })

  return NextResponse.json({ ok: true, userId: data.user.id })
}
