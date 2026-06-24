'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle2, Circle, Trash2, RefreshCw,
  Check, X, Instagram, Plus, ArrowRight
} from 'lucide-react'

type Account = {
  id: string
  instagram_username: string
  is_active: boolean
  last_scraped_at: string | null
  created_at: string
}

function parseUsernames(raw: string): string[] {
  const seen = new Set<string>()
  return raw
    .split(/[\n,;\s]+/)
    .map(s => s.trim())
    .map(s => {
      const match = s.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
      if (match) return match[1].toLowerCase()
      return s.replace(/^@/, '').toLowerCase()
    })
    .filter(s => /^[a-z0-9_.]{2,30}$/.test(s))
    .filter(s => { if (seen.has(s)) return false; seen.add(s); return true })
}

export default function AccountsPage() {
  const [accounts, setAccounts]     = useState<Account[]>([])
  const [rawInput, setRawInput]     = useState('')
  const [parsed, setParsed]         = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [toRemove, setToRemove]     = useState<Set<string>>(new Set())
  const [adding, setAdding]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('monitored_accounts')
      .select('*')
      .order('created_at', { ascending: false })
    setAccounts(data ?? [])
  }

  useEffect(() => { load() }, [])

  function handleInput(val: string) {
    setRawInput(val)
    setParsed(parseUsernames(val))
  }

  function handlePreview() {
    const usernames = parseUsernames(rawInput)
    if (!usernames.length) return
    setParsed(usernames)
    setToRemove(new Set())
    setConfirming(true)
  }

  async function handleConfirm() {
    const toAdd = parsed.filter(u => !toRemove.has(u))
    if (!toAdd.length) { setConfirming(false); return }
    setAdding(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    let failed = 0
    for (const username of toAdd) {
      const { error: err } = await supabase.from('monitored_accounts').upsert({
        instagram_username: username,
        added_by: user?.id,
        is_active: true,
      }, { onConflict: 'instagram_username' })
      if (err) { console.error('upsert error:', err); failed++ }
    }
    if (failed > 0) {
      setError(`${failed} compte(s) n'ont pas pu être ajoutés. Vérifiez la console.`)
    } else {
      setSuccess(`${toAdd.length} compte(s) ajouté(s) avec succès !`)
      setTimeout(() => setSuccess(''), 4000)
    }
    setRawInput('')
    setParsed([])
    setConfirming(false)
    setAdding(false)
    await load()
  }

  function toggleRemove(username: string) {
    setToRemove(prev => {
      const next = new Set(prev)
      next.has(username) ? next.delete(username) : next.add(username)
      return next
    })
  }

  async function toggleActive(account: Account) {
    await supabase.from('monitored_accounts').update({ is_active: !account.is_active }).eq('id', account.id)
    await load()
  }

  async function deleteAccount(id: string) {
    if (!confirm('Supprimer ce compte de la surveillance ?')) return
    await supabase.from('monitored_accounts').delete().eq('id', id)
    await load()
  }

  async function triggerScrape() {
    setLoading(true)
    await fetch('/api/cron/scrape', { headers: { 'x-cron-secret': 'manual' } })
    setLoading(false)
    await load()
  }

  const active = accounts.filter(a => a.is_active).length
  const toAddFinal = parsed.filter(u => !toRemove.has(u))
  const existingUsernames = new Set(accounts.map(a => a.instagram_username))

  return (
    <div className="page-pad" style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Header */}
      <div className="slide-up page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(236,72,153,0.1)',
              border: '1px solid rgba(236,72,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Instagram size={17} style={{ color: '#ec4899' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
              Comptes surveillés
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            <span style={{ color: 'var(--accent-glow)', fontWeight: 600 }}>{active}</span> actifs ·{' '}
            {accounts.length} total
          </p>
        </div>

        <button
          onClick={triggerScrape}
          disabled={loading}
          className="btn-ghost"
          style={{ gap: 8, fontSize: 12 }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          Scraper maintenant
        </button>
      </div>

      {/* Toasts */}
      {success && (
        <div className="fade-in" style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          color: '#4ade80', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Check size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="fade-in" style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <X size={14} /> {error}
        </div>
      )}

      {/* Zone d'import */}
      <div className="slide-up" style={{ animationDelay: '0.06s', marginBottom: 20 }}>
        {!confirming ? (
          <div style={{
            borderRadius: 18,
            padding: '22px 22px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Plus size={14} style={{ color: 'var(--accent-mid)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Ajouter des comptes</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, marginTop: 2 }}>
              Liens Instagram, @username ou noms bruts — n'importe quel format, dans n'importe quel ordre
            </p>

            <textarea
              value={rawInput}
              onChange={e => handleInput(e.target.value)}
              placeholder={`Exemples :
https://instagram.com/aitoolsfrancais
@techinsider_fr
openai_news_fr, ia_quotidien
futur_ia levrai_ia`}
              className="input-base"
              style={{
                minHeight: 110,
                resize: 'none',
                lineHeight: 1.7,
                fontFamily: 'var(--font-mono, monospace)',
              }}
              rows={5}
            />

            {/* Chips de preview */}
            {parsed.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                {parsed.map(u => (
                  <span
                    key={u}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 99,
                      fontWeight: 600,
                      background: existingUsernames.has(u) ? 'rgba(100,116,139,0.08)' : 'rgba(37,99,235,0.09)',
                      border: `1px solid ${existingUsernames.has(u) ? 'rgba(100,116,139,0.15)' : 'rgba(37,99,235,0.18)'}`,
                      color: existingUsernames.has(u) ? 'var(--text-3)' : 'var(--accent-glow)',
                    }}
                  >
                    @{u}{existingUsernames.has(u) ? ' ✓' : ''}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                onClick={handlePreview}
                disabled={parsed.length === 0}
                className="btn-primary"
                style={{ gap: 7, opacity: parsed.length === 0 ? 0.4 : 1 }}
              >
                Continuer
                <ArrowRight size={13} />
              </button>
              {parsed.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {parsed.filter(u => !existingUsernames.has(u)).length} nouveau(x) ·{' '}
                  {parsed.filter(u => existingUsernames.has(u)).length} déjà présent(s)
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Confirmation */
          <div style={{
            borderRadius: 18,
            padding: '22px 22px 18px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(37,99,235,0.22)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
                  Confirmer l'ajout
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Clique sur un compte pour le retirer
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '5px 10px', borderRadius: 99,
                background: 'rgba(37,99,235,0.1)', color: 'var(--accent-glow)',
                border: '1px solid rgba(37,99,235,0.18)',
              }}>
                {toAddFinal.length} à importer
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto', marginBottom: 18 }}>
              {parsed.map(u => {
                const removing = toRemove.has(u)
                const exists   = existingUsernames.has(u)
                return (
                  <div
                    key={u}
                    onClick={() => toggleRemove(u)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: removing ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
                      border: `1px solid ${removing ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
                      opacity: removing ? 0.55 : 1,
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      background: removing ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      border: `1px solid ${removing ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                    }}>
                      {removing
                        ? <X size={9} style={{ color: '#f87171' }} />
                        : <Check size={9} style={{ color: '#4ade80' }} />
                      }
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: removing ? 'var(--text-3)' : 'var(--text-1)' }}>
                      @{u}
                    </span>
                    {exists && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>déjà présent</span>}
                    {removing && <span style={{ fontSize: 11, color: '#f87171' }}>retiré</span>}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleConfirm}
                disabled={adding || toAddFinal.length === 0}
                className="btn-primary"
              >
                <Check size={13} />
                {adding ? 'Ajout...' : `Importer ${toAddFinal.length} compte${toAddFinal.length > 1 ? 's' : ''}`}
              </button>
              <button onClick={() => setConfirming(false)} className="btn-ghost">
                Modifier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des comptes */}
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accounts.length === 0 ? (
          <div
            className="fade-in"
            style={{
              textAlign: 'center', padding: '60px 24px', borderRadius: 18,
              border: '1px dashed var(--border-mid)', color: 'var(--text-3)',
            }}
          >
            <Instagram size={32} style={{ margin: '0 auto 12px', opacity: 0.2, display: 'block' }} />
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 4px' }}>Aucun compte ajouté</p>
            <p style={{ fontSize: 12, margin: 0 }}>Collez des usernames ou des liens Instagram ci-dessus</p>
          </div>
        ) : (
          accounts.map((account, i) => (
            <div
              key={account.id}
              className="slide-up"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                opacity: account.is_active ? 1 : 0.5,
                transition: 'border-color 0.15s, background 0.15s',
                animationDelay: `${0.1 + i * 0.04}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-mid)'
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg-card)'
              }}
            >
              {/* Toggle actif */}
              <button
                onClick={() => toggleActive(account)}
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {account.is_active
                  ? <CheckCircle2 size={16} style={{ color: 'var(--accent-glow)' }} />
                  : <Circle size={16} style={{ color: 'var(--text-3)' }} />
                }
              </button>

              {/* Avatar placeholder */}
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(236,72,153,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#ec4899',
              }}>
                {account.instagram_username[0].toUpperCase()}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                  @{account.instagram_username}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {account.last_scraped_at
                    ? `Sync ${new Date(account.last_scraped_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : 'Jamais synchronisé'}
                </div>
              </div>

              {/* Lien Instagram */}
              <a
                href={`https://instagram.com/${account.instagram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 8,
                  color: 'var(--text-3)', border: '1px solid var(--border)',
                  textDecoration: 'none', transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--text-2)'
                  e.currentTarget.style.borderColor = 'var(--border-mid)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-3)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                ↗ IG
              </a>

              {/* Badge statut */}
              <span style={account.is_active
                ? { fontSize: 11, padding: '5px 10px', borderRadius: 8, fontWeight: 600,
                    background: 'rgba(37,99,235,0.08)', color: 'var(--accent-glow)',
                    border: '1px solid rgba(37,99,235,0.15)' }
                : { fontSize: 11, padding: '5px 10px', borderRadius: 8, fontWeight: 600,
                    background: 'var(--bg-surface)', color: 'var(--text-3)',
                    border: '1px solid var(--border)' }
              }>
                {account.is_active ? 'Actif' : 'Inactif'}
              </span>

              {/* Supprimer */}
              <button
                onClick={() => deleteAccount(account.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', padding: 4, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
