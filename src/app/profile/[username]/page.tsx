'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import TierBadge from '@/components/civic/TierBadge'
import Icon from '@/components/civic/Icon'
import type { Claim, Session, User } from '@/types'
import { getInitials, protectedFetch, requireSession } from '@/app/_lib/session'

interface UserProfileResult {
  user: User
  claims: Claim[]
}

const CIRCUMFERENCE = 276.46

function claimTitle(claim: Claim): string {
  const type = claim.type.charAt(0).toUpperCase() + claim.type.slice(1)
  return claim.extracted_institution ? `${type} · ${claim.extracted_institution}` : type
}

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams<{ username: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfileResult | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [error, setError] = useState('')
  const [flagging, setFlagging] = useState<string | null>(null)
  const [flagConfirm, setFlagConfirm] = useState<string | null>(null)
  const [flagResult, setFlagResult] = useState<{ claimId: string; msg: string } | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      const current = requireSession(router)
      setSession(current)
      if (!current) return

      const username = params.username
      const ownProfile =
        username === current.username ||
        username === current.node_id ||
        username === current.user_id ||
        username === 'me'

      if (ownProfile && !current.username) {
        setProfile({
          user: {
            id: current.user_id,
            node_id: current.node_id,
            username: current.username,
            display_name: current.display_name,
            skill: null,
            score: current.score,
            tier: current.tier,
            borough: null,
            created_at: new Date().toISOString(),
          },
          claims: [],
        })
      }

      const claimsRequest = protectedFetch<Claim[]>(`/api/claims/${current.user_id}`, current)
        .then((json) => { if (json.success) setClaims(json.data) })
        .catch(() => setClaims([]))

      const profileSlug = username === 'me' || username === current.user_id || username === current.node_id
        ? current.username
        : username

      if (!profileSlug) { void claimsRequest; return }

      protectedFetch<UserProfileResult>(`/api/users/${profileSlug}`, current)
        .then((json) => {
          if (json.success) { setProfile(json.data); setClaims(json.data.claims); return }
          if (!ownProfile) setError(json.error)
        })
        .catch(() => { if (!ownProfile) setError('Could not load this profile.') })
    })
  }, [params.username, router])

  async function handleFlag(claimId: string) {
    if (!session) return
    setFlagging(claimId)
    setFlagConfirm(null)
    try {
      const json = await protectedFetch<{ penalized_vouchers: number }>('/api/vouch/flag', session, {
        method: 'POST',
        body: JSON.stringify({ claim_id: claimId }),
      })
      if (json.success) {
        setFlagResult({ claimId, msg: `Flagged. ${json.data.penalized_vouchers} voucher(s) penalized.` })
      } else {
        setFlagResult({ claimId, msg: json.error })
      }
    } catch {
      setFlagResult({ claimId, msg: 'Could not submit flag. Try again.' })
    } finally {
      setFlagging(null)
    }
  }

  const user = profile?.user
  const score = user?.score ?? session?.score ?? 0
  const dashOffset = CIRCUMFERENCE * (1 - score / 100)
  const verifiedClaims = useMemo(() => claims.filter((claim) => claim.status === 'verified'), [claims])

  const isOwnProfile = user?.id === session?.user_id
  const canFlag = !isOwnProfile && (session?.tier === 'trusted' || session?.tier === 'gov_official')

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="dashboard" session={session} />
      <main className="ml-60 pt-14 px-8 py-8">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              {user?.display_name ?? session?.display_name ?? 'Trust profile'}
            </h1>
            <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>
              @{user?.username ?? session?.username ?? 'username-not-set'} · {user?.borough ?? 'London Mesh'}
            </p>
          </div>
          <Link href="/vouch" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="qr_code_2" size={16} />
            Share User ID
          </Link>
        </div>

        {error && (
          <div className="bento" style={{ padding: 18, marginBottom: 20, color: '#ffb4ab' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
          <section className="bento" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#b0c6ff' }}>
              {getInitials(user?.display_name ?? session?.display_name)}
            </div>
            <div style={{ position: 'relative', width: 176, height: 176, margin: '0 auto 18px' }}>
              <svg viewBox="0 0 100 100" style={{ width: 176, height: 176, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#424655" strokeWidth="3" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#40e56c" strokeWidth="4" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={`${dashOffset}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 48, fontWeight: 700 }}>{score}</span>
                <span style={{ fontSize: 12, color: '#8c90a1' }}>out of 100</span>
              </div>
            </div>
            <TierBadge tier={user?.tier ?? session?.tier ?? 'unverified'} />
            <div style={{ marginTop: 18, fontSize: 13, color: '#8c90a1', overflowWrap: 'anywhere' }}>
              {user?.id ?? session?.user_id ?? 'No User ID'}
            </div>
          </section>

          <section className="bento" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Verified claims</h2>
              <Link href="/add-evidence" className="btn-primary" style={{ fontSize: 13 }}>
                <Icon name="add" size={16} />
                Add claim
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {verifiedClaims.map((claim) => (
                <article key={claim.id} className="bento" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(64,229,108,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="fact_check" size={18} style={{ color: '#40e56c' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{claimTitle(claim)}</div>
                      <div style={{ fontSize: 12, color: '#8c90a1' }}>{claim.doc_type}</div>
                    </div>
                    {canFlag && (
                      <button
                        onClick={() => setFlagConfirm(claim.id)}
                        title="Flag this claim as fraudulent"
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.08)', color: '#ffb4ab', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
                      >
                        <Icon name="flag" size={13} />
                        Flag
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#c2c6d8' }}>
                    Confidence {Math.round((claim.confidence ?? 0.9) * 100)}%
                    {claim.flags > 0 && (
                      <span style={{ marginLeft: 8, color: '#ffb4ab' }}>· {claim.flags} flag{claim.flags !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {flagResult?.claimId === claim.id && (
                    <div style={{ marginTop: 8, fontSize: 12, color: flagResult.msg.startsWith('Flagged') ? '#40e56c' : '#ffb4ab' }}>
                      {flagResult.msg}
                    </div>
                  )}
                </article>
              ))}

              {verifiedClaims.length === 0 && (
                <div className="bento" style={{ gridColumn: 'span 2', padding: 24, color: '#8c90a1', textAlign: 'center' }}>
                  No verified claims yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Confirmation dialog */}
      {flagConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="bento" style={{ padding: 32, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <Icon name="flag" size={36} style={{ color: '#ffb4ab', marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Flag this claim?</h3>
            <p style={{ fontSize: 14, color: '#8c90a1', marginBottom: 24 }}>
              This marks the claim as potentially fraudulent. Penalties are applied to vouchers based on your trust tier. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn-ghost"
                onClick={() => setFlagConfirm(null)}
                disabled={!!flagging}
              >
                Cancel
              </button>
              <button
                onClick={() => { void handleFlag(flagConfirm) }}
                disabled={!!flagging}
                style={{ padding: '10px 24px', borderRadius: 8, background: 'rgba(255,180,171,0.15)', border: '1px solid rgba(255,180,171,0.4)', color: '#ffb4ab', fontSize: 14, fontWeight: 700, cursor: flagging ? 'not-allowed' : 'pointer', opacity: flagging ? 0.6 : 1 }}
              >
                {flagging ? 'Flagging...' : 'Yes, flag it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
