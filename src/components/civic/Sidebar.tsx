'use client'

import Link from 'next/link'
import { getInitials, useStoredSession } from '@/app/_lib/session'
import type { Session } from '@/types'
import Icon from './Icon'
import { useSidebar, SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED } from './SidebarProvider'

interface SidebarProps {
  active: string
  session?: Session | null
  mode?: 'auto' | 'public'
}

const AUTH_NAV = [
  { key: 'dashboard',    icon: 'grid_view',   label: 'Dashboard',    href: '/dashboard' },
  { key: 'add-evidence', icon: 'upload_file', label: 'Add Evidence', href: '/add-evidence' },
  { key: 'vouch',        icon: 'handshake',   label: 'Vouch',        href: '/vouch' },
  { key: 'find',         icon: 'search',      label: 'Find Help',    href: '/find-help' },
  { key: 'map',          icon: 'map',         label: 'Trust Map',    href: '/map' },
  { key: 'settings',     icon: 'settings',    label: 'Settings',     href: '/settings' },
]

const PUBLIC_NAV = [
  { key: 'find',     icon: 'search',   label: 'Find Help',  href: '/find-help' },
  { key: 'map',      icon: 'map',      label: 'Trust Map',  href: '/map' },
]

function tierLabel(score: number): string {
  if (score >= 91) return 'Gov'
  if (score >= 55) return 'Trusted'
  if (score >= 20) return 'Verified'
  return 'Unverified'
}

export default function Sidebar({ active, session: sessionOverride, mode = 'auto' }: SidebarProps) {
  const storedSession = useStoredSession()
  const session = sessionOverride ?? storedSession
  const { collapsed, toggle } = useSidebar()

  const isPublic = mode === 'public' || !session
  const nav = isPublic ? PUBLIC_NAV : AUTH_NAV
  const score = session?.score ?? 0
  const progress = Math.min(100, Math.max(4, score))
  const w = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <aside style={{
      position: 'fixed', top: 56, left: 0, bottom: 0,
      width: w,
      background: '#181c22',
      borderRight: '1px solid #424655',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 0',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.2s ease',
    }}>

      {/* Toggle button */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '0 8px 8px', borderBottom: '1px solid #424655', marginBottom: 8 }}>
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid #424655', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c90a1', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#262a31'; (e.currentTarget as HTMLButtonElement).style.color = '#dfe2eb' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8c90a1' }}
        >
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={16} />
        </button>
      </div>

      {/* Identity card — authenticated only */}
      {!isPublic && session && !collapsed && (
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #424655', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#b0c6ff', flexShrink: 0 }}>
              {getInitials(session.display_name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#dfe2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.username ? `@${session.username}` : 'Username not set'}
              </div>
              <div style={{ fontSize: 11, color: '#8c90a1', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                {session.user_id}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#8c90a1', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>{score} pts</span>
            <span style={{ color: '#b0c6ff' }}>{tierLabel(score)}</span>
          </div>
          <div style={{ height: 4, borderRadius: 9999, background: '#0a0e14', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#b0c6ff', borderRadius: 9999 }} />
          </div>
        </div>
      )}

      {/* Collapsed: avatar icon only */}
      {!isPublic && session && collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 12px', borderBottom: '1px solid #424655', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#b0c6ff' }}>
            {getInitials(session.display_name)}
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {nav.map(item => {
          const isActive = active === item.key
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                marginBottom: 2,
                background: isActive ? 'rgba(176,198,255,0.1)' : 'transparent',
                borderLeft: isActive && !collapsed ? '2px solid #b0c6ff' : '2px solid transparent',
                color: isActive ? '#b0c6ff' : '#c2c6d8',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = '#262a31' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              <Icon name={item.icon} size={18} className={isActive ? 'text-primary' : ''} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Public: sign in + create account */}
      {isPublic && (
        <div style={{ padding: '12px 8px 0', borderTop: '1px solid #424655' }}>
          {collapsed ? (
            <>
              <Link href="/login" title="Sign in" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', color: '#c2c6d8', textDecoration: 'none' }}>
                <Icon name="login" size={18} />
              </Link>
              <Link href="/register" title="Create account" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', color: '#b0c6ff', textDecoration: 'none' }}>
                <Icon name="person_add" size={18} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, color: '#c2c6d8', textDecoration: 'none', fontSize: 14, marginBottom: 4 }} onMouseEnter={e => (e.currentTarget.style.background = '#262a31')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon name="login" size={16} /> Sign in
              </Link>
              <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.3)', color: '#b0c6ff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <Icon name="person_add" size={16} /> Create account
              </Link>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
