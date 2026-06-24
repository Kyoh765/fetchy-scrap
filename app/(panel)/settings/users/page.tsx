'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, UserPlus, Trash2, Crown, User } from 'lucide-react'

type Profile = {
  id: string; email: string; name: string | null; role: string; created_at: string
}

const ROLES: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  admin: { label: 'Admin', icon: Crown, color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  user:  { label: 'User',  icon: User,  color: 'var(--accent-glow)', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)' },
}

export default function UsersPage() {
  const [profiles, setProfiles]   = useState<Profile[]>([])
  const [email, setEmail]         = useState('')
  const [role, setRole]           = useState('user')
  const [adding, setAdding]       = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentId(user?.id ?? null)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setProfiles(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role }),
    })
    setEmail('')
    await load()
    setAdding(false)
  }

  async function changeRole(id: string, newRole: string) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    await load()
  }

  async function removeUser(id: string) {
    if (!confirm('Révoquer cet accès ?')) return
    await supabase.from('profiles').delete().eq('id', id)
    await load()
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-1)' }}>
          <Users size={22} style={{ color: 'var(--accent-glow)' }} />
          Gestion de l'équipe
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
          {profiles.length} membre{profiles.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Invitation */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-1)' }}>
          <UserPlus size={15} style={{ color: 'var(--accent-glow)' }} />
          Inviter un membre
        </h2>
        <form onSubmit={invite} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@entreprise.com"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-1)',
            }}
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-2)',
            }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={adding || !email.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
          >
            {adding ? 'Envoi...' : 'Inviter'}
          </button>
        </form>
      </div>

      {/* Liste membres */}
      <div className="space-y-2">
        {profiles.map(profile => {
          const roleInfo = ROLES[profile.role] ?? ROLES.user
          const RoleIcon = roleInfo.icon
          const isMe     = profile.id === currentId

          return (
            <div
              key={profile.id}
              className="flex items-center gap-4 px-5 py-4 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'var(--bg-hover)', color: 'var(--accent-glow)' }}
              >
                {(profile.name ?? profile.email)[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                  {profile.name ?? profile.email}
                  {isMe && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-3)' }}>
                      vous
                    </span>
                  )}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {profile.email}
                </div>
              </div>

              {/* Rôle */}
              {!isMe ? (
                <select
                  value={profile.role}
                  onChange={e => changeRole(profile.id, e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer font-medium"
                  style={{ background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.border}` }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                  style={{ background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.border}` }}
                >
                  <RoleIcon size={11} />
                  {roleInfo.label}
                </span>
              )}

              {!isMe && (
                <button
                  onClick={() => removeUser(profile.id)}
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
