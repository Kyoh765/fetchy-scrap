'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Crown, BarChart2, Eye, Shield, UserPlus, Trash2,
  Mail, Activity, ChevronDown, Check, X, Send, Clock,
  AlertTriangle, Settings, Search, Filter, RefreshCw,
  TrendingUp, Zap, Ban
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────
type Member = {
  id: string; email: string; name: string | null
  role: string; plan: string; status: string; notes: string | null
  created_at: string; last_seen_at: string | null
  last_sign_in_at: string | null; confirmed: boolean
}
type LogEntry = {
  id: string; action: string; meta: Record<string, unknown> | null
  created_at: string; profiles: { name: string | null; email: string } | null
}
type SentEmail = {
  id: string; subject: string; body: string
  recipients: string[]; sent_at: string
  profiles: { name: string | null; email: string } | null
}

// ─── Config rôles & plans ───────────────────────────────────────────────────
const ROLES = {
  admin: { label: 'Admin', color: '#f87171', bg: 'rgba(239,68,68,.09)', border: 'rgba(239,68,68,.22)' },
  user:  { label: 'User',  color: '#60a5fa', bg: 'rgba(37,99,235,.09)', border: 'rgba(37,99,235,.22)' },
}
const PLANS = {
  free:  { label: 'Free',  color: '#7a90b8', bg: 'rgba(120,144,184,.07)', border: 'rgba(120,144,184,.15)' },
  pro:   { label: 'Pro',   color: '#a78bfa', bg: 'rgba(168,85,247,.09)',  border: 'rgba(168,85,247,.22)'  },
  admin: { label: 'Admin', color: '#fbbf24', bg: 'rgba(234,179,8,.08)',   border: 'rgba(234,179,8,.2)'    },
}
const STATUS = {
  active:    { label: 'Actif',    color: '#4ade80', dot: '#22c55e' },
  suspended: { label: 'Suspendu', color: '#f87171', dot: '#ef4444' },
  invited:   { label: 'Invité',   color: '#fbbf24', dot: '#eab308' },
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDT(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function initials(m: Member) {
  const src = m.name ?? m.email
  return src.slice(0, 2).toUpperCase()
}

// ─── Couleur avatar par initial ─────────────────────────────────────────────
const AVATAR_COLORS = [
  'rgba(37,99,235,.2)', 'rgba(168,85,247,.2)', 'rgba(249,115,22,.2)',
  'rgba(34,197,94,.15)', 'rgba(239,68,68,.15)', 'rgba(234,179,8,.15)',
]
function avatarColor(email: string) {
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [tab,      setTab]      = useState<'members' | 'plans' | 'email' | 'logs'>('members')
  const [members,  setMembers]  = useState<Member[]>([])
  const [logs,     setLogs]     = useState<LogEntry[]>([])
  const [emails,   setEmails]   = useState<SentEmail[]>([])
  const [loading,  setLoading]  = useState(true)
  const [myId,     setMyId]     = useState<string | null>(null)
  const [search,   setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Invite form
  const [invEmail,  setInvEmail]  = useState('')
  const [invName,   setInvName]   = useState('')
  const [invRole,   setInvRole]   = useState('user')
  const [invPlan,   setInvPlan]   = useState('free')
  const [inviting,  setInviting]  = useState(false)
  const [invMsg,    setInvMsg]    = useState('')

  // Email composer
  const [mailSubject, setMailSubject] = useState('')
  const [mailBody,    setMailBody]    = useState('')
  const [mailTarget,  setMailTarget]  = useState<'all' | string[]>('all')
  const [sending,     setSending]     = useState(false)
  const [sendMsg,     setSendMsg]     = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setMyId(user.id)

    const [mRes, lRes, eRes] = await Promise.all([
      fetch('/api/admin/users'),
      supabase.from('admin_logs')
        .select('*, profiles:actor_id ( name, email )')
        .order('created_at', { ascending: false }).limit(50),
      fetch('/api/admin/email'),
    ])
    const mData = await mRes.json()
    const eData = await eRes.json()
    setMembers(mData.members ?? [])
    setLogs(lRes.data ?? [])
    setEmails(eData.emails ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Actions ────────────────────────────────────────────────────────────────
  async function patch(id: string, update: Record<string, string>) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    await load()
  }

  async function deleteUser(id: string) {
    if (!confirm('Supprimer définitivement ce membre ?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await load()
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!invEmail.trim()) return
    setInviting(true); setInvMsg('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invEmail, name: invName, role: invRole, plan: invPlan }),
    })
    const data = await res.json()
    if (data.ok) { setInvMsg('✓ Membre créé avec succès'); setInvEmail(''); setInvName('') }
    else setInvMsg(`Erreur : ${data.error}`)
    setInviting(false)
    await load()
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!mailSubject.trim() || !mailBody.trim()) return
    setSending(true); setSendMsg('')
    const body: Record<string, unknown> = { subject: mailSubject, body: mailBody }
    if (mailTarget === 'all') body.sendToAll = true
    else body.recipientIds = mailTarget
    const res = await fetch('/api/admin/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSendMsg(data.ok
      ? `✓ Envoyé à ${data.sent} destinataire(s)${data.note ? ` — ${data.note}` : ''}`
      : `Erreur : ${data.error}`)
    setSending(false)
    if (data.ok) { setMailSubject(''); setMailBody(''); await load() }
  }

  // ── Stats rapides ──────────────────────────────────────────────────────────
  const stats = {
    total:     members.length,
    active:    members.filter(m => m.status === 'active').length,
    admins:    members.filter(m => m.role === 'admin').length,
    pro:       members.filter(m => m.plan === 'pro').length,
  }

  // ── Filtrage membres ───────────────────────────────────────────────────────
  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchQ = !q || m.email.includes(q) || (m.name ?? '').toLowerCase().includes(q)
    const matchR  = roleFilter === 'all' || m.role === roleFilter
    return matchQ && matchR
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-3)', gap: 10 }}>
      <RefreshCw size={16} className="spin" /> Chargement du panel admin...
    </div>
  )

  return (
    <div className="page-pad" style={{ maxWidth: 1080, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="slide-up page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={17} style={{ color: '#f87171' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.03em', margin: 0 }}>
              Panel Admin
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Gestion complète des membres, abonnements et communications
          </p>
        </div>
        <button onClick={() => load()} className="btn-ghost" style={{ gap: 7, fontSize: 12 }}>
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="admin-stat-grid stagger" style={{ gap: 12, marginBottom: 28 }}>
        {[
          { icon: <Users size={14}/>,      label: 'Membres total',  value: stats.total,   color: '#60a5fa', bg: 'rgba(59,130,246,.06)', border: 'rgba(59,130,246,.13)' },
          { icon: <Check size={14}/>,      label: 'Actifs',         value: stats.active,  color: '#4ade80', bg: 'rgba(34,197,94,.06)',  border: 'rgba(34,197,94,.13)'  },
          { icon: <Crown size={14}/>,      label: 'Admins',         value: stats.admins,  color: '#f87171', bg: 'rgba(239,68,68,.06)',  border: 'rgba(239,68,68,.13)'  },
          { icon: <Zap size={14}/>,        label: 'Plan Pro',       value: stats.pro,     color: '#a78bfa', bg: 'rgba(168,85,247,.06)', border: 'rgba(168,85,247,.13)' },
        ].map((s, i) => (
          <div key={i} className="stat-card slide-up" style={{
            borderRadius: 16, padding: '17px 18px',
            background: s.bg, border: `1px solid ${s.border}`,
            animationDelay: `${i * 0.04}s`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>{s.label}</span>
            </div>
            <div className="count-up" style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: '-.04em', lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Onglets ── */}
      <div className="slide-up" style={{ marginBottom: 20, display: 'flex', gap: 4, background: 'var(--bg-surface)', padding: 4, borderRadius: 13, border: '1px solid var(--border)', animationDelay: '.1s', overflowX: 'auto' }}>
        {([
          { key: 'members', label: 'Membres',     icon: <Users size={13}/> },
          { key: 'plans',   label: 'Plans',        icon: <Zap size={13}/> },
          { key: 'email',   label: 'Email',        icon: <Mail size={13}/> },
          { key: 'logs',    label: 'Activité',     icon: <Activity size={13}/> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '9px 12px', borderRadius: 10, whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              transition: 'all .15s',
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.25)' : 'none',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Contenu par onglet ── */}

      {/* ── MEMBRES ── */}
      {tab === 'members' && (
        <div className="slide-up" style={{ animationDelay: '.05s' }}>

          {/* Barre de filtre + invite */}
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un membre..."
                className="input-base"
                style={{ paddingLeft: 36 }}
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '9px 13px', borderRadius: 11, background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-2)', fontSize: 12, outline: 'none' }}>
              <option value="all">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Table membres */}
          <div className="table-wrap" style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ minWidth: 560 }}>
            {/* En-tête table */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
              padding: '10px 16px', borderBottom: '1px solid var(--border)',
              fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)',
              background: 'var(--bg-surface)',
            }}>
              <span>Membre</span><span>Rôle</span><span>Plan</span><span>Statut</span><span>Inscrit</span><span></span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Aucun membre correspondant
              </div>
            ) : filtered.map((m, i) => {
              const role   = ROLES[m.role as keyof typeof ROLES]   ?? ROLES.user
              const plan   = PLANS[m.plan as keyof typeof PLANS]   ?? PLANS.free
              const status = STATUS[m.status as keyof typeof STATUS] ?? STATUS.active
              const isMe   = m.id === myId

              return (
                <div
                  key={m.id}
                  className="slide-up"
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                    padding: '13px 16px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background .15s',
                    animationDelay: `${i * 0.035}s`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Avatar + infos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: avatarColor(m.email),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: 'var(--text-1)',
                      border: '1px solid var(--border)',
                    }}>
                      {initials(m)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.name ?? '—'}
                        {isMe && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-3)' }}>vous</span>}
                        {!m.confirmed && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(234,179,8,.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,.2)' }}>non confirmé</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{m.email}</div>
                    </div>
                  </div>

                  {/* Rôle */}
                  {isMe ? (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 7, background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                      {role.label}
                    </span>
                  ) : (
                    <select value={m.role} onChange={e => patch(m.id, { role: e.target.value })}
                      style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 7, background: role.bg, color: role.color, border: `1px solid ${role.border}`, outline: 'none', cursor: 'pointer' }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}

                  {/* Plan */}
                  {isMe ? (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 7, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>
                      {plan.label}
                    </span>
                  ) : (
                    <select value={m.plan} onChange={e => patch(m.id, { plan: e.target.value })}
                      style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 7, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}`, outline: 'none', cursor: 'pointer' }}>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}

                  {/* Statut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot }} />
                    {!isMe ? (
                      <button
                        onClick={() => patch(m.id, { status: m.status === 'active' ? 'suspended' : 'active' })}
                        style={{ fontSize: 11, fontWeight: 600, color: status.color, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {status.label}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: status.color }}>{status.label}</span>
                    )}
                  </div>

                  {/* Date */}
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(m.created_at)}</span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!isMe && (
                      <button onClick={() => deleteUser(m.id)}
                        style={{ padding: 6, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', transition: 'color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div></div>

          {/* ── Inviter un membre ── */}
          <div style={{ marginTop: 20, borderRadius: 16, padding: '20px 22px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <UserPlus size={14} style={{ color: 'var(--accent-glow)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Inviter un nouveau membre</span>
            </div>
            <form onSubmit={invite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={invName} onChange={e => setInvName(e.target.value)}
                placeholder="Nom (optionnel)" className="input-base" style={{ flex: '1 1 160px', minWidth: 140 }} />
              <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                placeholder="email@entreprise.com" required className="input-base" style={{ flex: '2 1 200px', minWidth: 180 }} />
              <select value={invRole} onChange={e => setInvRole(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 11, background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', color: 'var(--text-2)', fontSize: 12, outline: 'none' }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select value={invPlan} onChange={e => setInvPlan(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 11, background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', color: 'var(--text-2)', fontSize: 12, outline: 'none' }}>
                <option value="free">Plan Free</option>
                <option value="pro">Plan Pro</option>
              </select>
              <button type="submit" disabled={inviting || !invEmail.trim()} className="btn-primary">
                {inviting ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
            {invMsg && (
              <p style={{ marginTop: 10, fontSize: 12, color: invMsg.startsWith('✓') ? '#4ade80' : '#f87171' }}>{invMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* ── ABONNEMENTS ── */}
      {tab === 'plans' && (
        <div className="slide-up" style={{ animationDelay: '.05s' }}>

          {/* Vue par plan */}
          <div className="stat-grid" style={{ gap: 14, marginBottom: 20 }}>
            {(['free', 'pro', 'admin'] as const).map(p => {
              const planInfo = PLANS[p]
              const planMembers = members.filter(m => m.plan === p)
              return (
                <div key={p} style={{ borderRadius: 16, padding: '20px', background: planInfo.bg, border: `1px solid ${planInfo.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: planInfo.color }}>
                      Plan {planInfo.label}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: planInfo.color }}>{planMembers.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {planMembers.slice(0, 4).map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          background: avatarColor(m.email), fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-1)',
                        }}>
                          {initials(m)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.name ?? m.email}
                          </div>
                        </div>
                        {/* Quick-switch plan */}
                        {m.id !== myId && (
                          <select value={m.plan} onChange={e => patch(m.id, { plan: e.target.value })}
                            style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 6px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', outline: 'none', cursor: 'pointer' }}>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </div>
                    ))}
                    {planMembers.length > 4 && (
                      <div style={{ fontSize: 11, color: planInfo.color, opacity: 0.7 }}>+ {planMembers.length - 4} autres</div>
                    )}
                    {planMembers.length === 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Aucun membre</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table complète par abonnement */}
          <div className="table-wrap" style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ minWidth: 520 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: '10px 16px', borderBottom: '1px solid var(--border)',
              fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)',
              background: 'var(--bg-surface)',
            }}>
              <span>Membre</span><span>Plan actuel</span><span>Rôle</span><span>Dernier accès</span><span>Changer plan</span>
            </div>
            {members.map((m, i) => {
              const plan   = PLANS[m.plan as keyof typeof PLANS] ?? PLANS.free
              const role   = ROLES[m.role as keyof typeof ROLES] ?? ROLES.user
              const isMe   = m.id === myId
              return (
                <div key={m.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: avatarColor(m.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-1)' }}>
                      {initials(m)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{m.name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>
                    {plan.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: role.color }}>{role.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDT(m.last_sign_in_at)}</span>
                  {isMe ? (
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                  ) : (
                    <select value={m.plan} onChange={e => patch(m.id, { plan: e.target.value })}
                      style={{ fontSize: 11, fontWeight: 600, padding: '5px 9px', borderRadius: 8, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}`, outline: 'none', cursor: 'pointer' }}>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
              )
            })}
          </div></div>
        </div>
      )}

      {/* ── EMAIL ── */}
      {tab === 'email' && (
        <div className="slide-up two-col" style={{ gap: 16, animationDelay: '.05s' }}>

          {/* Compositeur */}
          <div style={{ borderRadius: 16, padding: '20px 22px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={13} style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Composer un email</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Envoyé via Resend si configuré, sinon loggé</div>
              </div>
            </div>

            <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Destinataires */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Destinataires</label>
                <select
                  value={mailTarget === 'all' ? 'all' : ''}
                  onChange={e => setMailTarget(e.target.value === 'all' ? 'all' : [e.target.value])}
                  className="input-base"
                >
                  <option value="all">Tous les membres actifs ({stats.active})</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Objet</label>
                <input value={mailSubject} onChange={e => setMailSubject(e.target.value)}
                  placeholder="Nouveau rapport viral disponible..." required className="input-base" />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Message</label>
                <textarea value={mailBody} onChange={e => setMailBody(e.target.value)}
                  placeholder="Bonjour,&#10;&#10;Voici les dernières alertes virales de la semaine..."
                  required rows={6} className="input-base" style={{ resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <button type="submit" disabled={sending} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Send size={13} />
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>

              {sendMsg && (
                <p style={{ fontSize: 12, color: sendMsg.startsWith('✓') ? '#4ade80' : '#f87171', marginTop: 4 }}>{sendMsg}</p>
              )}
            </form>
          </div>

          {/* Historique emails */}
          <div style={{ borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={13} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Historique des envois</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 440 }}>
              {emails.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                  Aucun email envoyé pour le moment
                </div>
              ) : emails.map((e, i) => (
                <div key={e.id} style={{
                  padding: '13px 18px', borderBottom: i < emails.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .15s',
                }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{e.subject}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{fmtDT(e.sent_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 10 }}>
                    <span>Par {e.profiles?.name ?? e.profiles?.email ?? '—'}</span>
                    <span>· {e.recipients.length} destinataire(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITÉ ── */}
      {tab === 'logs' && (
        <div className="slide-up" style={{ animationDelay: '.05s', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Activity size={14} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Journal d'activité</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{logs.length} actions</span>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Aucune action enregistrée
            </div>
          ) : (
            <div>
              {logs.map((log, i) => (
                <div
                  key={log.id}
                  className="slide-up"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '13px 18px',
                    borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                    animationDelay: `${i * 0.03}s`,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icône action */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 1,
                    ...actionStyle(log.action),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {actionIcon(log.action)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
                      {actionLabel(log.action, log.meta)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 10 }}>
                      <span>{log.profiles?.name ?? log.profiles?.email ?? 'Système'}</span>
                      <span>· {fmtDT(log.created_at)}</span>
                    </div>
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <div style={{ marginTop: 5, fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text-3)', fontFamily: 'monospace', display: 'inline-block' }}>
                        {JSON.stringify(log.meta)}
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, marginTop: 3 }}>
                    {fmtDT(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Helpers logs ────────────────────────────────────────────────────────────
function actionStyle(action: string): React.CSSProperties {
  if (action.startsWith('user.invite'))  return { background: 'rgba(34,197,94,.1)',  border: '1px solid rgba(34,197,94,.2)' }
  if (action.startsWith('user.delete'))  return { background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }
  if (action.startsWith('user.update'))  return { background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)' }
  if (action.startsWith('email.send'))   return { background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.2)' }
  return { background: 'var(--bg-surface)', border: '1px solid var(--border)' }
}
function actionIcon(action: string) {
  const s = 12
  if (action.startsWith('user.invite'))  return <UserPlus size={s} style={{ color: '#4ade80' }} />
  if (action.startsWith('user.delete'))  return <Trash2  size={s} style={{ color: '#f87171' }} />
  if (action.startsWith('user.update'))  return <Settings size={s} style={{ color: '#60a5fa' }} />
  if (action.startsWith('email.send'))   return <Send    size={s} style={{ color: '#a78bfa' }} />
  return <Activity size={s} style={{ color: 'var(--text-3)' }} />
}
function actionLabel(action: string, meta: Record<string, unknown> | null) {
  if (action === 'user.invite')  return `Invitation envoyée à ${meta?.email ?? '—'}`
  if (action === 'user.update')  return `Profil mis à jour : ${Object.keys(meta ?? {}).join(', ')}`
  if (action === 'user.delete')  return `Membre supprimé`
  if (action === 'email.send')   return `Email envoyé : "${meta?.subject ?? '—'}" (${meta?.count ?? 0} dest.)`
  return action
}
