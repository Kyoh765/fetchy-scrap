import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessibles uniquement par certains rôles
const ROLE_ROUTES: { path: string; roles: string[] }[] = [
  { path: '/admin',               roles: ['admin'] },
  { path: '/settings/thresholds', roles: ['admin'] },
  { path: '/api/admin',           roles: ['admin'] },
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Pages publiques — pas de redirection
  const PUBLIC_PATHS = ['/', '/login']
  if (PUBLIC_PATHS.includes(pathname)) return supabaseResponse
  if (pathname.startsWith('/api/debug/')) return supabaseResponse

  // Redirection vers login si non connecté
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Vérification des rôles pour les routes protégées
  if (user) {
    const restricted = ROLE_ROUTES.find(r => pathname.startsWith(r.path))

    if (restricted) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !restricted.roles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/cron/).*)'],
}
