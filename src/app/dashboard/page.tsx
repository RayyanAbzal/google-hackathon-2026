'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import EgoGraph from '@/components/civic/svg/EgoGraph'
import { useSidebar } from '@/components/civic/SidebarProvider'
import type { ApiResponse, Claim, Session, TrustTier, Notification } from '@/types'
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [networkNodes, setNetworkNodes] = useState<Array<{ type: 'gov' | 'community'; display_name?: string; username?: string | null; tier?: string; vouched_at?: string }>>([])
  const [networkLoaded, setNetworkLoaded] = useState(false)
  const [ptsThisWeek, setPtsThisWeek] = useState<number | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      const current = requireSession(router)
      setSession(current)
      if (!current) return

      // Refresh score from DB — catches vouches received since last login
      fetch(`/api/score/${current.user_id}`)
        .then(r => r.json() as Promise<ApiResponse<{ score: number; tier: TrustTier; passport_count: number; other_doc_count: number; vouches_received: number; eligible_vouches: number; weighted_vouch_points: number; gov_vouched: boolean }>>)
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
        .catch(() => setClaims([]))

      protectedFetch<Notification[]>('/api/notifications?limit=3', current)
        .then((json) => {
          if (json.success) setNotifications(json.data)
        })
        .catch(() => setNotifications([]))

      protectedFetch<{ nodes: Array<{ type: 'gov' | 'community'; display_name: string; username: string | null; tier: string; vouched_at: string }>; pts_this_week: number; total_vouchers: number }>(
        `/api/network/${current.user_id}`, current
      )
        .then((json) => {
          if (json.success) {
            setNetworkNodes(json.data.nodes)
            setPtsThisWeek(json.data.pts_this_week)
          }
        })
        .catch(() => {})
        .finally(() => setNetworkLoaded(true))
    })
  }, [router])

  const score = session?.score ?? 0
  const dashOffset = CIRCUMFERENCE * (1 - score / 100)
  const firstName = getDisplayFirstName(session?.display_name)
  const tier = session?.tier ?? 'unverified'
  const isUnverified = tier === 'unverified'

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
    if (tier === 'unverified') return '2 VOUCHES TO VERIFIED'
    if (score >= 55) return `${91 - score} PTS TO GOV. VERIFIED`
    if (score >= 20) return `${55 - score} PTS TO TRUSTED`
    return `${20 - score} PTS TO VERIFIED`
  }, [score, tier])

  const evidenceRows = useMemo(() => {
    return claims.slice(0, 3).map(c => ({
      icon: claimIcon(c.doc_type),
      title: c.doc_type,
      sub: c.extracted_institution ?? '',
      color: claimColor(c.status),
      badge: claimBadge(c.status),
    }))
  }, [claims])

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="dashboard" session={session} />

      <main style={{ marginLeft: sidebarWidth, padding: '80px 36px 36px 36px', transition: 'margin-left 0.2s ease' }}>

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
        {isUnverified && (
          <div
            style={{
              marginBottom: 18,
              padding: 20,
              borderRadius: 14,
              background: 'rgba(176,198,255,0.1)',
              border: '1px solid rgba(176,198,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#dfe2eb' }}>Finish verification</div>
              <div style={{ fontSize: 13, color: '#c2c6d8', marginTop: 4 }}>
                You need at least one approved document and enough eligible vouches before Find Help unlocks.
              </div>
            </div>
            <Link href="/add-evidence" style={{ padding: '12px 18px', background: '#b0c6ff', color: '#002d6f', borderRadius: 8, fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
              <Icon name="upload_file" size={18} /> Add evidence
            </Link>
          </div>
        )}

        {/* Top row: ego graph + score ring */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, marginBottom: 18 }}>

          <div style={{ border: '1px solid rgba(66,70,85,0.5)', borderRadius: 14, padding: 20, background: '#181c22' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="meta">YOUR TRUST NETWORK</span>
            </div>
            <div style={{ height: 300, marginTop: 6 }}>
              <EgoGraph width={680} height={300} vouchers={networkLoaded ? networkNodes : []} />
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

        {/* Bottom row: evidence (full width) */}
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
                  {e.sub && <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{e.sub}</div>}
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
          {/* Activity */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 22, background: '#181c22' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Recent activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {notifications.length === 0 ? (
                <div style={{ fontSize: 13, color: '#8c90a1', padding: '20px 0' }}>No activity yet</div>
              ) : (
                notifications.map((n) => {
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
                    <div key={n.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${n.color}18`, border: `1px solid ${n.color}40`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={n.icon} size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#c2c6d8', marginTop: 2 }}>{n.detail}</div>
                        <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 4 }}>{timeStr}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
