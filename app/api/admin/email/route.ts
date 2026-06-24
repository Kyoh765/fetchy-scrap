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

/**
 * POST /api/admin/email
 * Body: { subject, body, recipientIds?: string[], sendToAll?: boolean }
 *
 * Utilise Supabase Auth Admin pour envoyer un magic link / reset,
 * ou simplement log l'email envoyé dans admin_emails.
 *
 * Pour des vrais emails transactionnels, brancher Resend / SendGrid
 * via RESEND_API_KEY dans .env.local
 */
export async function POST(req: NextRequest) {
  const actor = await requireAdmin()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { subject, body, recipientIds, sendToAll } = await req.json()
  if (!subject || !body) return NextResponse.json({ error: 'subject et body requis' }, { status: 400 })

  const db = createAdminClient()

  // Récupère les emails des destinataires
  let recipients: string[] = []
  if (sendToAll) {
    const { data: profiles } = await db.from('profiles').select('email').eq('status', 'active')
    recipients = (profiles ?? []).map((p: { email: string }) => p.email).filter(Boolean)
  } else if (recipientIds?.length) {
    const { data: profiles } = await db.from('profiles').select('email').in('id', recipientIds)
    recipients = (profiles ?? []).map((p: { email: string }) => p.email).filter(Boolean)
  }

  if (!recipients.length) return NextResponse.json({ error: 'Aucun destinataire' }, { status: 400 })

  // ── Envoi via Resend (si configuré) ─────────────────────────────────────
  const RESEND_KEY = process.env.RESEND_API_KEY
  let sent = 0
  let errors: string[] = []

  if (RESEND_KEY) {
    for (const email of recipients) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    'FetchyScrap <noreply@fetchyscrap.com>',
            to:      [email],
            subject,
            html:    body.replace(/\n/g, '<br>'),
          }),
        })
        if (res.ok) sent++
        else errors.push(email)
      } catch { errors.push(email) }
    }
  } else {
    // Pas de provider email — simule l'envoi (log seulement)
    sent = recipients.length
  }

  // Log dans admin_emails
  await db.from('admin_emails').insert({
    sent_by:    actor.id,
    subject,
    body,
    recipients,
  })

  // Log activité
  await db.from('admin_logs').insert({
    actor_id:    actor.id,
    action:      'email.send',
    target_type: 'email',
    meta:        { subject, count: sent, recipients },
  })

  return NextResponse.json({ ok: true, sent, errors, note: RESEND_KEY ? null : 'Email simulé — ajoute RESEND_API_KEY pour envoyer de vrais emails' })
}

// GET /api/admin/email — historique des emails envoyés
export async function GET() {
  const actor = await requireAdmin()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const { data } = await db
    .from('admin_emails')
    .select('*, profiles:sent_by ( name, email )')
    .order('sent_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ emails: data ?? [] })
}
