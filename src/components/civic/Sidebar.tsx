'use client'

import Link from 'next/link'
import { getInitials, useStoredSession } from '@/app/_lib/session'
import type { Session } from '@/types'
import Icon from './Icon'

interface SidebarProps {
  active: string
  session?: Session | null
}

const NAV = [
  { key: 'dashboard',    icon: 'grid_view',   label: 'Dashboard',    href: '/dashboard' },
  { key: 'add-evidence', icon: 'upload_file', label: 'Add Evidence', href: '/add-evidence' },
  { key: 'vouch',        icon: 'handshake',   label: 'Vouch',        href: '/vouch' },
  { key: 'find',         icon: 'search',      label: 'Find Help',    href: '/find-help' },
  { key: 'map',          icon: 'map',         label: 'Trust Map',    href: '/map' },
  { key: 'settings',     icon: 'settings',    label: 'Settings',     href: '/settings' },
]

function tierLabel(score: number): string {
  if (score >= 95) return 'Gov'
  if (score >= 90) return 'Tier 3'
  if (score >= 50) return 'Tier 2'
  if (score >= 30) return 'Tier 1'
  return 'Tier 0'
}

export default function Sidebar({ active, session: sessionOverride }: SidebarProps) {
  const storedSession = useStoredSession()
  const session = sessionOverride ?? storedSession
  const score = session?.score ?? 0
  const username = session?.username ? `@${session.username}` : 'Username not set'
  const userId = session?.user_id ?? 'No User ID'
  const progress = Math.min(100, Math.max(4, score))

  return (
    <aside style={{ position: 'fixed', top: 56, left: 0, bottom: 0, width: 240, background: '#181c22', borderRight: '1px solid #424655', zIndex: 40, display: 'flex', flexDirection: 'column', padding: '16px 0', overflowY: 'auto' }}>
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #424655', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#b0c6ff', flexShrink: 0 }}>
            {getInitials(session?.display_name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#dfe2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
            <div title={userId} style={{ fontSize: 11, color: '#8c90a1', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{userId}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#8c90a1', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>{score} pts</span><span style={{ color: '#b0c6ff' }}>{tierLabel(score)}</span>
        </div>
        <div style={{ height: 4, borderRadius: 9999, background: '#0a0e14', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#b0c6ff', borderRadius: 9999 }} />
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 8px' }}>
        {NAV.map(item => {
          const isActive = active === item.key
          return (
            <Link key={item.key} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: isActive ? 'rgba(176,198,255,0.1)' : 'transparent', borderLeft: isActive ? '2px solid #b0c6ff' : '2px solid transparent', color: isActive ? '#b0c6ff' : '#c2c6d8', textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#262a31' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
              <Icon name={item.icon} size={18} className={isActive ? 'text-primary' : ''} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
