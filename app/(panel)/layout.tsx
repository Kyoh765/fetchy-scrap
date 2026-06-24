import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { AnimatedPage } from '@/components/AnimatedPage'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const { count: unreadCount } = await supabase
    .from('viral_alerts')
    .select('id', { count: 'exact', head: true })
    .not('id', 'in',
      supabase.from('alert_reads').select('alert_id').eq('user_id', user.id)
    )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      {/* Fond ambiant animé */}
      <div className="ambient-bg">
        <div className="ambient-orb-3" />
      </div>

      <Sidebar role={profile?.role ?? 'viewer'} unreadCount={unreadCount ?? 0} />

      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
        }}
      >
        <AnimatedPage>
          {children}
        </AnimatedPage>
      </main>
    </div>
  )
}
