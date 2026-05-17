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
    <div style={{ background: '#070708', minHeight: '100vh', color: '#d2d2d6' }}>
      <TopBar />
      <main style={{ paddingTop: 56, padding: '56px 32px 48px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="bento" style={{ padding: 32, marginBottom: 24, borderColor: 'rgba(204,119,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(204,119,0,0.15)', border: '1px solid rgba(204,119,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cc7700', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>hourglass_top</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, background: 'rgba(204,119,0,0.15)', border: '1px solid rgba(204,119,0,0.4)', color: '#cc7700', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Unverified</span>
                  <span style={{ fontSize: 13, color: '#6a6a70', fontFamily: 'monospace' }}>{session?.username ? `@${session.username}` : session?.node_id ?? 'Creating identity...'}</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Welcome, {getDisplayFirstName(session?.display_name)}. Your account isn&apos;t verified yet.</h1>
                <p style={{ fontSize: 14, color: '#d2d2d6' }}>
                  You have the document points needed. You still need {vouchesNeeded === 0 ? 'no more' : vouchesNeeded} eligible {vouchesNeeded === 1 ? 'vouch' : 'vouches'} to reach <span style={{ color: '#00b860' }}>Tier 1 - Verified</span>.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(40,40,44,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6a6a70', marginBottom: 6 }}>
                <span>{documentPoints} / 20 document points - {eligibleVouches} / 2 eligible vouches</span>
                <span style={{ color: '#cc7700' }}>{vouchProgress}% vouches</span>
              </div>
              <div style={{ height: 8, borderRadius: 9999, background: '#070708', overflow: 'hidden' }}>
                <div style={{ width: `${documentProgress}%`, height: '100%', background: '#cc7700', borderRadius: 9999 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Link href="/add-evidence" className="bento" style={{ padding: 24, borderColor: 'rgba(160,0,32,0.4)', display: 'block', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(160,0,32,0.15)', border: '1px solid rgba(160,0,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a00020', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>upload_file</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Add evidence</h2>
              <p style={{ fontSize: 14, color: '#d2d2d6', marginBottom: 16 }}>Upload a credential, work ID, or residency document. Each one raises your score.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#a00020', fontWeight: 600 }}>
                Start adding <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </Link>

            <Link href="/vouch" className="bento" style={{ padding: 24, display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,184,96,0.15)', border: '1px solid rgba(0,184,96,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00b860', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>handshake</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Get vouched</h2>
              <p style={{ fontSize: 14, color: '#d2d2d6', marginBottom: 16 }}>Share your QR with verified people who know you. You need at least 2 eligible vouches.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#00b860', fontWeight: 600 }}>
                Show my QR <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </Link>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={signOut} style={{ fontSize: 13, color: '#6a6a70', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
          </div>
        </div>
      </main>
    </div>
  )
}
