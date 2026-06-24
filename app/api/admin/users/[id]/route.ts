import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return null
  return user
}

// PATCH /api/admin/users/[id] — modifier rôle, plan, status, notes
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await requireAdmin()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const allowed = ['role', 'plan', 'status', 'notes', 'name'] as const
  const update: Record<string, string> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  const db = createAdminClient()
  const { error } = await db.from('profiles').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log
  await db.from('admin_logs').insert({
    actor_id:    actor.id,
    action:      'user.update',
    target_id:   params.id,
    target_type: 'profile',
    meta:        update,
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/users/[id] — supprimer un membre
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await requireAdmin()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (actor.id === params.id) return NextResponse.json({ error: 'Impossible de se supprimer soi-même' }, { status: 400 })

  const db = createAdminClient()

  // Log avant suppression
  await db.from('admin_logs').insert({
    actor_id:    actor.id,
    action:      'user.delete',
    target_id:   params.id,
    target_type: 'profile',
  })

  // Supprime dans Auth (cascade supprime le profil via FK)
  await db.auth.admin.deleteUser(params.id)

  return NextResponse.json({ ok: true })
}
