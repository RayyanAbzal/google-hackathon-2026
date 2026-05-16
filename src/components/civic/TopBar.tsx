'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getInitials, useStoredSession, protectedFetch } from '@/app/_lib/session'
import Icon from './Icon'
import TierBadge from './TierBadge'
import type { Notification, ApiResponse } from '@/types'

const BLACKOUT_HOURS = 14281

interface TopBarProps {
  authMode?: 'auto' | 'public'
}

export default function TopBar({ authMode = 'auto' }: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const session = useStoredSession()
  const showSessionControls = authMode !== 'public' && Boolean(session)
  const username = session?.username ? `@${session.username}` : 'Username not set'

  useEffect(() => {
    if (!session) return

    const fetchNotifications = async () => {
      const response = await protectedFetch<Notification[]>(
        '/api/notifications?limit=5',
        session
      ) as ApiResponse<Notification[]> & { unread_count?: number }
      if (response.success) {
        setNotifications(response.data)
        setUnreadCount(response.unread_count ?? 0)
      }
    }

    fetchNotifications()
  }, [session])

  function openBell() {
    const opening = !bellOpen
    setBellOpen(opening)
    setAvatarOpen(false)
    if (opening && session) {
      const unread = notifications.filter(n => !n.read)
      unread.forEach(n => {
        protectedFetch(`/api/notifications/${n.id}`, session, { method: 'PATCH' })
      })
      if (unread.length > 0) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function signOut() {
    if (typeof window !== 'undefined') localStorage.removeItem('civictrust_session')
    router.push('/login')
  }

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'rgba(16,20,26,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #424655', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx="6"  cy="8"  r="3"   fill="#b0c6ff" />
          <circle cx="22" cy="10" r="2.5" fill="#40e56c" />
          <circle cx="14" cy="20" r="3.5" fill="#b0c6ff" />
          <circle cx="22" cy="22" r="2"   fill="#b0c6ff" />
          <line x1="6"  y1="8"  x2="14" y2="20" stroke="#b0c6ff" strokeOpacity=".6" />
          <line x1="22" y1="10" x2="14" y2="20" stroke="#b0c6ff" strokeOpacity=".6" />
          <line x1="14" y1="20" x2="22" y2="22" stroke="#b0c6ff" strokeOpacity=".6" />
        </svg>
        <span style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: 15, color: '#dfe2eb' }}>CivicTrust</span>
        <span className="mono" style={{ fontSize: 10, color: '#8c90a1', padding: '2px 6px', border: '1px solid #424655', borderRadius: 4 }}>LONDON · MESH</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(176,198,255,0.08)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.08em' }}>
          <span className="dot dot-blue pulse-dot" />
          BLACKOUT T+ {BLACKOUT_HOURS.toLocaleString()}h
        </div>

        {showSessionControls && session ? (
          <>
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={openBell} style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, background: bellOpen ? 'rgba(176,198,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2c6d8' }}>
                <Icon name="notifications" size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ff4444', border: '2px solid #10141a' }} />
                )}
              </button>
              {bellOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, background: '#181c22', border: '1px solid #424655', borderRadius: 12, padding: 16, zIndex: 100 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Notifications</div>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#8c90a1', padding: '12px 0' }}>No notifications yet</div>
                  ) : (
                    notifications.map((n, i) => {
                      const time = new Date(n.created_at)
                      const now = new Date()
                      const diffMs = now.getTime() - time.getTime()
                      const diffMins = Math.floor(diffMs / 60000)
                      const diffHours = Math.floor(diffMs / 3600000)
                      const diffDays = Math.floor(diffMs / 86400000)
                      let timeStr = 'just now'
                      if (diffMins < 60) timeStr = `${diffMins}m ago`
                      else if (diffHours < 24) timeStr = `${diffHours}h ago`
                      else if (diffDays < 7) timeStr = `${diffDays}d ago`
                      else timeStr = time.toLocaleDateString()

                      return (
                        <div key={n.id} style={{ display: 'flex', gap: 12, marginBottom: i < notifications.length - 1 ? 12 : 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${n.color}20`, border: `1px solid ${n.color}50`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={n.icon} size={14} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13 }}>{n.title}</div>
                            {n.detail && (
                              <div style={{ fontSize: 12, color: '#c2c6d8', marginTop: 1 }}>{n.detail}</div>
                            )}
                            <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2 }}>{timeStr}</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div ref={avatarRef} style={{ position: 'relative' }}>
              <button onClick={() => { setAvatarOpen(v => !v); setBellOpen(false) }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#b0c6ff' }}>
                {getInitials(session.display_name)}
              </button>
              {avatarOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 240, background: '#181c22', border: '1px solid #424655', borderRadius: 12, padding: 4, zIndex: 100 }}>
                  <div style={{ padding: '12px 12px', borderBottom: '1px solid #424655', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{session.display_name}</div>
                    <div style={{ fontSize: 11, color: '#8c90a1', fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</div>
                    <TierBadge tier={session.tier} className="mt-2" />
                  </div>
                  {[
                    { icon: 'grid_view', label: 'Dashboard', href: '/dashboard' },
                    { icon: 'qr_code_2', label: 'My QR', href: '/vouch' },
                    { icon: 'settings', label: 'Settings', href: '/settings' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setAvatarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, color: '#c2c6d8', textDecoration: 'none', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = '#262a31')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Icon name={item.icon} size={16} />{item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid #424655', marginTop: 4, paddingTop: 4 }}>
                    <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, color: '#ffb4ab', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, width: '100%' }} onMouseEnter={e => (e.currentTarget.style.background = '#262a31')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Icon name="logout" size={16} />Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {authMode === 'public' ? (
              <>
                <Link href="/login" style={{ fontSize: 13, color: '#b0c6ff', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, border: '1px solid #424655', background: 'transparent' }}>Sign in</Link>
                <Link href="/register" className="btn-primary" style={{ fontSize: 13 }}>Create account</Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary" style={{ fontSize: 13 }}>Sign in</Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
