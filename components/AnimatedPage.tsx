'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const [key, setKey] = useState(pathname)
  const prev = useRef(pathname)

  useEffect(() => {
    if (prev.current !== pathname) {
      prev.current = pathname
      setKey(pathname)
    }
  }, [pathname])

  return (
    <div key={key} className="page-enter" style={{ minHeight: '100%' }}>
      {children}
    </div>
  )
}
