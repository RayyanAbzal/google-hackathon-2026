'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import TierBadge from '@/components/civic/TierBadge'
import Icon from '@/components/civic/Icon'
import type { Claim, Session } from '@/types'
import { getDisplayFirstName, protectedFetch, requireSession } from '@/app/_lib/session'

function MetricCard({
  icon,
  iconColor,
  points,
  label,
}: {
  icon: string
  iconColor: string
  points: string
  label: string
}) {
  return (
    <div className="bento" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Icon name={icon} size={22} style={{ color: iconColor }} />
      <div style={{ fontSize: 32, fontWeight: 700, color: '#dfe2eb', lineHeight: 1 }}>{points}</div>
      <div style={{ fontSize: 13, color: '#8c90a1' }}>{label}</div>
    </div>
  )
}

function EvidenceCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  badge,
  badgeStyle,
}: {
  icon: string
  iconColor: string
  iconBg: string
  title: string
  subtitle?: string
  badge: string
  badgeStyle?: React.CSSProperties
}) {
  return (
    <div
      className="bento"
      style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#dfe2eb' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <span
        className="tier-3-outline"
        style={badgeStyle}
      >
        {badge}
      </span>
    </div>
  )
}

const CIRCUMFERENCE = 276.46

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])

  useEffect(() => {
    queueMicrotask(async () => {
      const current = requireSession(router)
      if (!current) return

      // Fetch fresh score first, update localStorage, then set session
      try {
        const res = await fetch(`/api/score/${current.user_id}`)
        const json = await res.json()
        if (json.success && json.data) {
          const updated = { ...current, score: json.data.score, tier: json.data.tier }
          localStorage.setItem('civictrust_session', JSON.stringify(updated))
          setSession(updated)
        } else {
          setSession(current)
        }
      } catch {
        setSession(current)
      }

      protectedFetch<Claim[]>(`/api/claims/${current.user_id}`, current)
        .then((json) => {
          if (json.success) setClaims(json.data)
        })
        .catch(() => setClaims([]))
    })
  }, [router])

  const score = session?.score ?? 0
  const dashOffset = CIRCUMFERENCE * (1 - score / 100)
  const firstName = getDisplayFirstName(session?.display_name)
  const verifiedClaims = claims.filter((claim) => claim.status === 'verified').length
  const claimPoints = verifiedClaims ? `+${verifiedClaims * 15}` : '+15'
  const tier = session?.tier ?? 'unverified'
  const subtitle = useMemo(() => {
    const username = session?.username ? `@${session.username}` : 'Username not set'
    return `${username} · ${session?.user_id ?? 'No session'}`
  }, [session])

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="dashboard" session={session} />
      <main className="ml-60 pt-14 px-8 py-8">

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Welcome back, {firstName}.
            </h1>
            <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>{subtitle}</p>
          </div>
          <Link href="/vouch" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="qr_code_2" size={16} />
            Share User ID
          </Link>
        </div>

        {/* Top grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Trust score card */}
          <div className="bento" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#8c90a1', marginBottom: 16 }}>Trust score</div>
            <div style={{ position: 'relative', width: 192, height: 192, margin: '0 auto' }}>
              <svg
                className="w-48 h-48 mx-auto -rotate-90"
                viewBox="0 0 100 100"
                style={{ width: 192, height: 192, transform: 'rotate(-90deg)' }}
              >
                <circle cx="50" cy="50" r="44" fill="none" stroke="#424655" strokeWidth="3" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#40e56c"
                  strokeWidth="4"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  strokeDashoffset={`${dashOffset}`}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 52, fontWeight: 700, color: '#dfe2eb', lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>out of 100</span>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <TierBadge tier={tier} />
            </div>
          </div>

          {/* Metrics */}
          <div
            style={{
              gridColumn: 'span 8',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
              alignContent: 'start',
            }}
          >
            <MetricCard
              icon="fact_check"
              iconColor="#40e56c"
              points={claimPoints}
              label="Points from verified claims"
            />
            <MetricCard
              icon="group"
              iconColor="#b0c6ff"
              points="+30"
              label="Points from vouches received"
            />
            <MetricCard
              icon="account_balance"
              iconColor="#ffb599"
              points="+20"
              label="Points from gov. vouches"
            />
          </div>
        </div>

        {/* Evidence grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 20,
          }}
        >
          {/* Evidence */}
          <div className="bento" style={{ gridColumn: 'span 12' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Your evidence</h2>
              <Link href="/add-evidence" className="btn-primary" style={{ fontSize: 13 }}>
                <Icon name="add" size={16} />
                Add claim
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <EvidenceCard
                icon="id_card"
                iconColor="#40e56c"
                iconBg="rgba(64,229,108,0.15)"
                title="Passport"
                badge="Verified"
              />
              <EvidenceCard
                icon="school"
                iconColor="#b0c6ff"
                iconBg="rgba(176,198,255,0.15)"
                title="Medical Degree"
                badge="Verified"
              />
              <div
                className="bento"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: 16,
                  borderColor: 'rgba(245,158,11,0.4)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(245,158,11,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="receipt_long" size={20} style={{ color: '#fbbf24' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#dfe2eb' }}>Utility bill</div>
                  <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>Awaiting review</div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    color: '#fbbf24',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Pending
                </span>
              </div>
              <Link
                href="/add-evidence"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 16,
                  borderRadius: 12,
                  border: '1.5px dashed #424655',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <Icon name="add_circle" size={28} style={{ color: '#424655' }} />
                <span style={{ fontSize: 13, color: '#8c90a1' }}>Add another claim</span>
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
