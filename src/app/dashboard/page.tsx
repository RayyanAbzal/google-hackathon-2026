'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import EgoGraph from '@/components/civic/svg/EgoGraph'
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
  { icon: 'done_all', title: 'Medical Degree verified', sub: 'Dr. Aris Thorne · gov. voucher', time: '2h', color: '#40e56c' },
  { icon: 'handshake', title: 'New vouch from Hemish R.', sub: '+5 pts · community', time: '8h', color: '#b0c6ff' },
  { icon: 'hub', title: 'Connected to Southwark hub', sub: 'mesh edge added', time: '1d', color: '#b0c6ff' },
  { icon: 'person_add', title: 'Account created', sub: 'welcome to the mesh', time: '2w', color: '#8c90a1' },
]

const FALLBACK_EVIDENCE = [
  { icon: 'id_card', title: 'Passport', sub: '6 vouches · 2 gov.', color: '#40e56c', badge: 'VERIFIED' },
  { icon: 'school', title: 'Medical Degree (MBBS)', sub: '4 vouches · UCL', color: '#40e56c', badge: 'VERIFIED' },
  { icon: 'receipt_long', title: 'Utility bill — Southwark', sub: 'awaiting 2 more vouches', color: '#fbbf24', badge: 'PENDING' },
]

export default function DashboardPage() {
  const router = useRouter()
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
    if (tier === 'gov_official') return 'TIER 3 · GOVERNMENT VERIFIED'
    if (tier === 'trusted') return 'TIER 2 · TRUSTED'
    if (tier === 'verified') return 'TIER 1 · VERIFIED'
    return 'TIER 0 · UNVERIFIED'
  }, [tier])

  const tierColor = useMemo(() => {
    if (tier === 'gov_official' || tier === 'trusted') return '#40e56c'
    if (tier === 'verified') return '#b0c6ff'
    return '#8c90a1'
  }, [tier])

  const ptsToNext = useMemo(() => {
    if (score >= 91) return null
    if (score >= 55) return `${91 - score} PTS TO GOV. VERIFIED`
    if (score >= 20) return `${55 - score} PTS TO TRUSTED`
    return `${20 - score} PTS TO VERIFIED`
  }, [score])

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

      <main style={{ marginLeft: 240, padding: '80px 36px 36px 36px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <span className="meta">{tierLabel}</span>
            <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', margin: '8px 0 4px' }}>
              Welcome back, {firstName}.
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#c2c6d8', fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#40e56c' }}>stethoscope</span>
              {session?.username ? `@${session.username}` : 'Your account'}{session?.borough ? ` · ${session.borough}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/vouch" style={{ padding: '10px 16px', border: '1px solid #424655', borderRadius: 8, background: '#181c22', color: '#dfe2eb', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <Icon name="qr_code_2" size={16} /> Share Node ID
            </Link>
            <Link href="/add-evidence" style={{ padding: '10px 16px', background: '#b0c6ff', color: '#002d6f', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <Icon name="add" size={16} /> Add evidence
            </Link>
          </div>
        </div>

        {/* Top row: ego graph + score ring */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, marginBottom: 18 }}>

          <div style={{ border: '1px solid rgba(66,70,85,0.5)', borderRadius: 14, padding: 20, background: '#181c22' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="meta">YOUR TRUST NETWORK</span>
              <span className="meta" style={{ color: '#40e56c' }}>+45 PTS THIS WEEK</span>
            </div>
            <div style={{ height: 300, marginTop: 6 }}>
              <EgoGraph width={680} height={300} count={9} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c2c6d8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#40e56c', display: 'inline-block' }} />
                Gov. voucher
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c2c6d8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#b0c6ff', display: 'inline-block' }} />
                Community voucher
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid rgba(66,70,85,0.5)', borderRadius: 14, padding: 24, background: '#181c22', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span className="meta">TRUST SCORE</span>
            <div style={{ position: 'relative', width: 200, height: 200, marginTop: 12 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#424655" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="#40e56c"
                  strokeWidth="4"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  strokeDashoffset={`${dashOffset}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</span>
                <span style={{ fontSize: 12, color: '#8c90a1', marginTop: 4 }}>out of 100</span>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '6px 12px', borderRadius: 999, background: `${tierColor}12`, border: `1px solid ${tierColor}55`, color: tierColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
              {tierLabel}
            </div>
            {ptsToNext && (
              <div className="mono" style={{ fontSize: 11, color: '#8c90a1', marginTop: 14 }}>{ptsToNext}</div>
            )}
          </div>
        </div>

        {/* Bottom row: evidence + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

          <div style={{ border: '1px solid rgba(66,70,85,0.5)', borderRadius: 14, padding: 22, background: '#181c22' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Your evidence</h2>
              <span className="meta">
                {evidenceRows.length} ITEMS · {evidenceRows.filter(e => e.badge === 'PENDING').length} PENDING
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {claimsLoaded && evidenceRows.length === 0 && (
                <div style={{ padding: '28px 14px', textAlign: 'center', border: '1px solid rgba(66,70,85,0.4)', borderRadius: 10, background: '#10141a', color: '#8c90a1', fontSize: 13 }}>
                  No verified evidence yet — add your first document to start building trust.
                </div>
              )}
              {evidenceRows.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid rgba(66,70,85,0.5)', borderRadius: 10, background: '#10141a' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${e.color}18`, border: `1px solid ${e.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: e.color }}>{e.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{e.sub}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: e.color, background: `${e.color}1a`, border: `1px solid ${e.color}55` }}>
                    {e.badge}
                  </span>
                </div>
              ))}
              <Link
                href="/add-evidence"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', border: '1.5px dashed #424655', borderRadius: 10, color: '#8c90a1', fontSize: 13, textDecoration: 'none' }}
              >
                <Icon name="add" size={16} /> Add another claim
              </Link>
            </div>
          </div>

          <div style={{ border: '1px solid rgba(66,70,85,0.5)', borderRadius: 14, padding: 22, background: '#181c22' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Activity</h2>
              <span className="meta">LAST 7 DAYS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ACTIVITY.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 14,
                    paddingTop: i === 0 ? 0 : 14,
                    paddingBottom: 14,
                    borderBottom: i < ACTIVITY.length - 1 ? '1px solid rgba(66,70,85,0.35)' : 'none',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: a.color }}>{a.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{a.sub}</div>
                  </div>
                  <span className="meta">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
