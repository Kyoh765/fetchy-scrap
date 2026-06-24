import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fetchy Scrap — Veille Virale Instagram',
  description: 'Détection intelligente de contenus viraux IA sur Instagram',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className} style={{ background: 'var(--bg-base)' }}>
        {children}
      </body>
    </html>
  )
}
