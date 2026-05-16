'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from './Icon'

const BLACKOUT_HOURS = 14281

const NOTIFICATIONS = [
  { icon: 'done_all', color: '#40e56c', text: 'Medical Degree verified by Dr. Aris Thorne', time: '2 hours ago' },
  { icon: 'handshake', color: '#b0c6ff', text: 'New vouch from Hemish R. · +10 pts', time: '8 hours ago' },
  { icon: 'upload_file', color: '#b0c6ff', text: 'Evidence submitted for review', time: '1 day ago' },
]

export default function TopBar() {
  const [bellOpen, setBellOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
        borderBottom: '1px solid #424655', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#b0c6ff', color: '#002d6f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>CT</div>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#dfe2eb' }}>CivicTrust</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(176,198,255,0.08)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.08em' }}>
          <span className="dot dot-blue pulse-dot" />
          BLACKOUT T+ {BLACKOUT_HOURS.toLocaleString()}h
        </div>

        <div ref={bellRef} style={{ position: 'relative' }}>
          <button onClick={() => { setBellOpen(v => !v); setAvatarOpen(false) }} style={{ width: 36, height: 36, borderRadius: 8, background: bellOpen ? 'rgba(176,198,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2c6d8' }}>
            <Icon name="notifications" size={20} />
          </button>
          {bellOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, background: '#181c22', border: '1px solid #424655', borderRadius: 12, padding: 16, zIndex: 100 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Notifications</div>
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < NOTIFICATIONS.length - 1 ? 12 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${n.color}20`, border: `1px solid ${n.color}50`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={n.icon} size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={avatarRef} style={{ position: 'relative' }}>
          <button onClick={() => { setAvatarOpen(v => !v); setBellOpen(false) }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#b0c6ff' }}>
            SM
          </button>
          {avatarOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 220, background: '#181c22', border: '1px solid #424655', borderRadius: 12, padding: 4, zIndex: 100 }}>
              <div style={{ padding: '12px 12px', borderBottom: '1px solid #424655', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Sarah Mitchell</div>
                <div style={{ fontSize: 11, color: '#8c90a1', fontFamily: 'monospace', marginTop: 2 }}>BLK-0471-LDN</div>
                <span className="tier-badge tier-2" style={{ marginTop: 8, display: 'inline-flex' }}>Tier 2 · Community</span>
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
      </div>
    </header>
  )
}
