'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import type { Session } from '@/types'
import { getDisplayFirstName, requireSession, updateStoredSession } from '@/app/_lib/session'

interface ScoreStatus {
  score: number
  tier: Session['tier']
  passport_count: number
  other_doc_count: number
  eligible_vouches: number
}

export default function UnverifiedPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<ScoreStatus | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    queueMicrotask(() => {
      const current = requireSession(router)
      setSession(current)
      if (!current) return

      const refreshStatus = () => fetch(`/api/score/${current.user_id}`)
        .then((response) => response.json() as Promise<{ success: boolean; data?: ScoreStatus }>)
        .then((json) => {
          if (!json.success || !json.data) return
          setStatus(json.data)
          const updated = updateStoredSession({ score: json.data.score, tier: json.data.tier })
          if (updated) setSession(updated)
          if (json.data.tier !== 'unverified') router.replace('/dashboard')
        })
        .catch(() => {})

      refreshStatus()
      timer = setInterval(refreshStatus, 10000)
    })

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [router])

  function signOut() {
    if (typeof window !== 'undefined') localStorage.removeItem('civictrust_session')
    router.push('/login')
  }

  const score = status?.score ?? session?.score ?? 0
  const eligibleVouches = status?.eligible_vouches ?? 0
  const vouchesNeeded = Math.max(0, 2 - eligibleVouches)
  const documentPoints = status ? Math.min(20, Math.max(0, score)) : 20
  const documentProgress = Math.min(100, Math.round((documentPoints / 20) * 100))
  const vouchProgress = Math.min(100, Math.round((eligibleVouches / 2) * 100))

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <main style={{ paddingTop: 56, padding: '56px 32px 48px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="bento" style={{ padding: 32, marginBottom: 24, borderColor: 'rgba(245,158,11,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>hourglass_top</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Unverified</span>
                  <span style={{ fontSize: 13, color: '#8c90a1', fontFamily: 'monospace' }}>{session?.username ? `@${session.username}` : session?.node_id ?? 'Creating identity...'}</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Welcome, {getDisplayFirstName(session?.display_name)}. Your account isn&apos;t verified yet.</h1>
                <p style={{ fontSize: 14, color: '#c2c6d8' }}>
                  You have the document points needed. You still need {vouchesNeeded === 0 ? 'no more' : vouchesNeeded} eligible {vouchesNeeded === 1 ? 'vouch' : 'vouches'} to reach <span style={{ color: '#40e56c' }}>Tier 1 - Verified</span>.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(66,70,85,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c90a1', marginBottom: 6 }}>
                <span>{documentPoints} / 20 document points - {eligibleVouches} / 2 eligible vouches</span>
                <span style={{ color: '#fbbf24' }}>{vouchProgress}% vouches</span>
              </div>
              <div style={{ height: 8, borderRadius: 9999, background: '#0a0e14', overflow: 'hidden' }}>
                <div style={{ width: `${documentProgress}%`, height: '100%', background: '#fbbf24', borderRadius: 9999 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Link href="/add-evidence" className="bento" style={{ padding: 24, borderColor: 'rgba(176,198,255,0.4)', display: 'block', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0c6ff', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>upload_file</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Add evidence</h2>
              <p style={{ fontSize: 14, color: '#c2c6d8', marginBottom: 16 }}>Upload a credential, work ID, or residency document. Each one raises your score.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#b0c6ff', fontWeight: 600 }}>
                Start adding <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </Link>

            <Link href="/vouch" className="bento" style={{ padding: 24, display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(64,229,108,0.15)', border: '1px solid rgba(64,229,108,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#40e56c', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>handshake</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Get vouched</h2>
              <p style={{ fontSize: 14, color: '#c2c6d8', marginBottom: 16 }}>Share your QR with verified people who know you. You need at least 2 eligible vouches.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#40e56c', fontWeight: 600 }}>
                Show my QR <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </Link>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={signOut} style={{ fontSize: 13, color: '#8c90a1', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
          </div>
        </div>
      </main>
    </div>
  )
}
