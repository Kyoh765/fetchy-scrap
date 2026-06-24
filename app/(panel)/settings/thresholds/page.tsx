'use client'
import { useState } from 'react'
import { Settings, Save, Zap, Database, Clock, CheckCircle2 } from 'lucide-react'

export default function ThresholdsPage() {
  const [threshold, setThreshold] = useState(6)
  const [baseline, setBaseline]   = useState(30)
  const [frequency, setFrequency] = useState(4)
  const [saved, setSaved]         = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold, baseline, frequency }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-1)' }}>
          <Settings size={22} style={{ color: 'var(--text-2)' }} />
          Configuration
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
          Paramètres de détection virale
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Seuil viral */}
        <ConfigCard
          icon={<Zap size={15} style={{ color: '#fb923c' }} />}
          title="Seuil viral"
          description="Un post est détecté viral s'il fait X fois plus de vues que la moyenne."
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="2" max="20"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none"
              style={{ accentColor: '#f97316', background: `linear-gradient(to right, #f97316 ${(threshold-2)/18*100}%, var(--border-mid) 0%)` }}
            />
            <div className="w-24 text-right">
              <span className="text-3xl font-black" style={{ color: '#fb923c' }}>{threshold}</span>
              <span className="text-lg font-bold" style={{ color: '#fb923c' }}>×</span>
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            <span>2× (très sensible)</span>
            <span>20× (très sélectif)</span>
          </div>
        </ConfigCard>

        {/* Baseline */}
        <ConfigCard
          icon={<Database size={15} style={{ color: 'var(--accent-glow)' }} />}
          title="Taille de la baseline"
          description="Nombre de posts utilisés pour calculer la moyenne d'un compte."
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5" max="100" step="5"
              value={baseline}
              onChange={e => setBaseline(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none"
              style={{ accentColor: 'var(--accent)', background: `linear-gradient(to right, #3b82f6 ${(baseline-5)/95*100}%, var(--border-mid) 0%)` }}
            />
            <div className="w-24 text-right">
              <span className="text-3xl font-black" style={{ color: 'var(--accent-glow)' }}>{baseline}</span>
              <span className="text-sm ml-1" style={{ color: 'var(--text-2)' }}>posts</span>
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            <span>5 (réactif)</span>
            <span>100 (précis)</span>
          </div>
        </ConfigCard>

        {/* Fréquence scraping */}
        <ConfigCard
          icon={<Clock size={15} style={{ color: '#a78bfa' }} />}
          title="Fréquence de scraping"
          description="Impact direct sur le coût HikerAPI."
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { h: 2, cost: '~65$/mois', label: 'Haute' },
              { h: 4, cost: '~32$/mois', label: 'Standard' },
              { h: 6, cost: '~22$/mois', label: 'Économique' },
            ].map(({ h, cost, label }) => (
              <button
                key={h}
                type="button"
                onClick={() => setFrequency(h)}
                className="py-3 px-4 rounded-xl text-sm transition text-left"
                style={frequency === h ? {
                  background: 'rgba(37,99,235,0.1)',
                  border: '1px solid rgba(37,99,235,0.3)',
                  color: 'var(--accent-glow)',
                } : {
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)',
                }}
              >
                <div className="font-semibold">Toutes les {h}h</div>
                <div className="text-xs mt-0.5 opacity-70">{label} · {cost}</div>
              </button>
            ))}
          </div>
        </ConfigCard>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     text-white font-semibold text-sm transition"
          style={{ background: saved ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                   border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none',
                   color: saved ? '#4ade80' : 'white' }}
        >
          {saved ? (
            <><CheckCircle2 size={16} /> Sauvegardé</>
          ) : (
            <><Save size={16} /> Sauvegarder les paramètres</>
          )}
        </button>
      </form>
    </div>
  )
}

function ConfigCard({
  icon, title, description, children
}: {
  icon: React.ReactNode; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text-1)' }}>
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>{description}</p>
      {children}
    </div>
  )
}
