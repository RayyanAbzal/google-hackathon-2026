'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import { useSidebar } from '@/components/civic/SidebarProvider'
import type { ApiResponse, Claim, Session, TrustTier } from '@/types'
import { getDisplayFirstName, protectedFetch, requireSession, updateStoredSession } from '@/app/_lib/session'

const CIRCUMFERENCE = 276.46

function claimIcon(docType: string): string {
  const t = docType.toLowerCase()
  if (t.includes('passport') || t.includes('identity') || t.includes('id')) return 'id_card'
  if (t.includes('degree') || t.includes('university') || t.includes('school') || t.includes('credential')) return 'school'
  return 'receipt_long'
}

function claimColor(status: string): string {
  if (status === 'verified') return '#40e56c'
  if (status === 'pending') return '#fbbf24'
  return '#8c90a1'
}

function claimBadge(status: string): string {
  if (status === 'verified') return 'VERIFIED'
  if (status === 'pending') return 'PENDING'
  return status.toUpperCase()
}

const ACTIVITY = [
  { icon: 'done_all', title: 'Medical Degree verified', sub: 'Vouched by Dr. Aris Thorne', time: '2 hours ago', color: '#40e56c' },
  { icon: 'handshake', title: 'New vouch from Hemish R.', sub: 'Regular vouch · +5 pts', time: '8 hours ago', color: '#b0c6ff' },
  { icon: 'person_add', title: 'Account created', sub: 'Welcome to the mesh.', time: '2 weeks ago', color: '#8c90a1' },
]

const FALLBACK_EVIDENCE = [
  { icon: 'id_card', title: 'Passport', sub: '6 vouches', color: '#40e56c', badge: 'VERIFIED' },
  { icon: 'school', title: 'Medical Degree', sub: '2 vouches', color: '#40e56c', badge: 'VERIFIED' },
  { icon: 'receipt_long', title: 'Utility bill', sub: 'Awaiting review', color: '#fbbf24', badge: 'PENDING' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { width: sidebarWidth } = useSidebar()
  const [session, setSession] = useState<Session | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [claimsLoaded, setClaimsLoaded] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      const current = requireSession(router)
      setSession(current)
      if (!current) return

      // Refresh score from DB — catches vouches received since last login
      fetch(`/api/score/${current.user_id}`)
        .then(r => r.json() as Promise<ApiResponse<{ score: number; tier: TrustTier }>>)
        .then(json => {
          if (json.success && (json.data.score !== current.score || json.data.tier !== current.tier)) {
            const updated = updateStoredSession({ score: json.data.score, tier: json.data.tier })
            if (updated) setSession(updated)
          }
        })
        .catch(() => {})

      protectedFetch<Claim[]>(`/api/claims/${current.user_id}`, current)
        .then((json) => {
          if (json.success) setClaims(json.data)
        })
        .catch(() => {})
        .finally(() => setClaimsLoaded(true))
    })
  }, [router])

  const score = session?.score ?? 0
  const dashOffset = CIRCUMFERENCE * (1 - score / 100)
  const firstName = getDisplayFirstName(session?.display_name)
  const tier = session?.tier ?? 'unverified'

  const tierLabel = useMemo(() => {
    if (tier === 'gov_official') return 'Tier 3 · Government Verified'
    if (tier === 'trusted') return 'Tier 2 · Trusted'
    if (tier === 'verified') return 'Tier 1 · Verified'
    return 'Tier 0 · Unverified'
  }, [tier])

  const tierColor = useMemo(() => {
    if (tier === 'gov_official') return '#40e56c'
    if (tier === 'trusted') return '#40e56c'
    if (tier === 'verified') return '#b0c6ff'
    return '#8c90a1'
  }, [tier])

  const verifiedClaims = useMemo(() => claims.filter(c => c.status === 'verified').length, [claims])
  const vouchesReceived = useMemo(() => claims.reduce((acc, c) => acc + (c.vouches ?? 0), 0), [claims])

  const evidenceRows = useMemo(() => {
    return claims.slice(0, 3).map(c => ({
      icon: claimIcon(c.doc_type),
      title: c.doc_type,
      sub: c.extracted_institution
        ? `${c.vouches} vouches · ${c.extracted_institution}`
        : `${c.vouches} vouches`,
      color: claimColor(c.status),
      badge: claimBadge(c.status),
    }))
  }, [claims])

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="dashboard" session={session} />

      <main style={{ marginLeft: sidebarWidth, padding: '80px 36px 36px 36px', transition: 'margin-left 0.2s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Welcome back, {firstName}.
            </h1>
            <p style={{ color: '#c2c6d8', fontSize: 15, margin: 0 }}>
              {session?.username ? `@${session.username}` : 'Your account'}{session?.borough ? ` · ${session.borough}` : ''}
            </p>
          </div>
          <Link href="/vouch" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: '1px solid #424655', borderRadius: 8, background: '#181c22', color: '#dfe2eb', fontSize: 13, textDecoration: 'none' }}>
            <Icon name="qr_code_2" size={16} /> Share Node ID
          </Link>
        </div>

        {/* Top row: score ring + 3 metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Trust score */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 20, background: '#181c22', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: '#c2c6d8', marginBottom: 16 }}>Trust score</div>
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#31353c" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="#40e56c"
                  strokeWidth="4"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 46, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</span>
                <span style={{ fontSize: 12, color: '#8c90a1', marginTop: 4 }}>out of 100</span>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: '4px 12px', borderRadius: 9999, background: `${tierColor}18`, border: `1px solid ${tierColor}55`, color: tierColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center' }}>
              {tierLabel}
            </div>
          </div>

          {/* Verified claims */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 20, background: '#181c22' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#40e56c', display: 'block' }}>fact_check</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 12, lineHeight: 1 }}>
              {claims.length > 0 ? `+${verifiedClaims}` : '+15'}
            </div>
            <div style={{ fontSize: 14, color: '#c2c6d8', marginTop: 8 }}>Verified claims</div>
          </div>

          {/* Vouches received */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 20, background: '#181c22' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#b0c6ff', display: 'block' }}>group</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 12, lineHeight: 1 }}>
              {claims.length > 0 ? `+${vouchesReceived}` : '+30'}
            </div>
            <div style={{ fontSize: 14, color: '#c2c6d8', marginTop: 8 }}>Vouches received</div>
          </div>

          {/* Government vouches */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 20, background: '#181c22' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#ffb599', display: 'block' }}>account_balance</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 12, lineHeight: 1 }}>+20</div>
            <div style={{ fontSize: 14, color: '#c2c6d8', marginTop: 8 }}>Government vouches</div>
          </div>
        </div>

        {/* Bottom row: evidence + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

          {/* Evidence */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 22, background: '#181c22' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Your evidence</h2>
              <Link href="/add-evidence" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.35)', borderRadius: 8, color: '#b0c6ff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <Icon name="add" size={16} /> Add claim
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {claimsLoaded && evidenceRows.length === 0 && (
                <div style={{ padding: '28px 14px', textAlign: 'center', border: '1px solid rgba(66,70,85,0.4)', borderRadius: 10, background: '#10141a', color: '#8c90a1', fontSize: 13 }}>
                  No verified evidence yet — add your first document to start building trust.
                </div>
              )}
              {evidenceRows.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: '1px solid #424655', borderRadius: 10, background: '#10141a' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${e.color}18`, border: `1px solid ${e.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: e.color }}>{e.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{e.sub}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: e.color, background: `${e.color}18`, border: `1px solid ${e.color}55`, flexShrink: 0 }}>
                    {e.badge}
                  </span>
                </div>
              ))}

              <Link href="/add-evidence" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: '1.5px dashed #424655', borderRadius: 10, color: '#8c90a1', textDecoration: 'none', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(176,198,255,0.4)')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#424655')}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0a0e14', border: '1px solid #424655', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="add" size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Add another claim</div>
                  <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>Work ID, residency, degree</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Activity */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 22, background: '#181c22' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Recent activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${a.color}18`, border: `1px solid ${a.color}40`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={a.icon} size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#c2c6d8', marginTop: 2 }}>{a.sub}</div>
                    <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 4 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
