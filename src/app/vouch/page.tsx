'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import TierBadge from '@/components/civic/TierBadge'
import Icon from '@/components/civic/Icon'
import type { Claim, Session, TrustTier, SkillTag } from '@/types'
import { protectedFetch } from '@/app/_lib/session'

interface FoundUser {
  id: string
  node_id: string
  username: string | null
  display_name: string
  skill: SkillTag | null
  score: number
  tier: TrustTier
  borough: string | null
}

type VouchState = 'idle' | 'loading' | 'found' | 'confirming' | 'success' | 'circular' | 'error'
type ScanState  = 'off' | 'scanning' | 'done'

export default function VouchPage() {
  const router = useRouter()
  const [session]                      = useState<Session | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('civictrust_session')
    return raw ? JSON.parse(raw) as Session : null
  })
  const [nodeInput, setNodeInput]     = useState('')
  const [foundUser, setFoundUser]     = useState<FoundUser | null>(null)
  const [vouchState, setVouchState]   = useState<VouchState>('idle')
  const [voucheeNewScore, setVoucheeNewScore] = useState<number | null>(null)
  const [errorMsg, setErrorMsg]       = useState('')
  const [foundUserClaims, setFoundUserClaims] = useState<Claim[]>([])
  const [flagConfirm, setFlagConfirm] = useState<string | null>(null)
  const [flagging, setFlagging]       = useState<string | null>(null)
  const [flagResult, setFlagResult]   = useState<{ claimId: string; msg: string } | null>(null)
  const [scanState, setScanState]     = useState<ScanState>('off')
  const scannerRef                    = useRef<HTMLDivElement>(null)
  // html5-qrcode instance stored in ref so it survives renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef                    = useRef<any>(null)

  useEffect(() => {
    if (!session) router.push('/login')
  }, [session, router])

  const lookupByNodeId = useCallback(async (id: string) => {
    const normalized = id.trim().toUpperCase()
    if (!normalized) return
    setVouchState('loading')
    setErrorMsg('')
    setFoundUser(null)

    try {
      const res  = await fetch(`/api/users/node/${encodeURIComponent(normalized)}`)
      const json = await res.json()
      if (!json.success) { setErrorMsg(json.error ?? 'User not found'); setVouchState('error'); return }
      if (json.data.id === session?.user_id) { setErrorMsg('Cannot vouch for yourself'); setVouchState('error'); return }
      setFoundUser(json.data as FoundUser)
      setVouchState('found')
      setFlagResult(null)
      if (session) {
        protectedFetch<Claim[]>(`/api/claims/${json.data.id}`, session)
          .then(r => { if (r.success) setFoundUserClaims(r.data.filter(c => c.status === 'verified')) })
          .catch(() => {})
      }
    } catch {
      setErrorMsg('Network error — try again')
      setVouchState('error')
    }
  }, [session])

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch { /* already stopped */ }
      html5QrRef.current = null
    }
    setScanState('off')
  }, [])

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return
    setScanState('scanning')

    // Dynamic import keeps html5-qrcode out of SSR bundle
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-scan-target')
    html5QrRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        async (decodedText: string) => {
          await stopScanner()
          setScanState('done')
          setNodeInput(decodedText.trim().toUpperCase())
          await lookupByNodeId(decodedText)
        },
        undefined
      )
    } catch {
      setScanState('off')
      html5QrRef.current = null
    }
  }, [lookupByNodeId, stopScanner])

  // Clean up scanner when navigating away
  useEffect(() => () => { stopScanner() }, [stopScanner])

  const handleLookup = () => lookupByNodeId(nodeInput)

  const handleConfirmVouch = async () => {
    if (!foundUser || !session) return
    setVouchState('confirming')
    setErrorMsg('')

    try {
      const res  = await fetch('/api/vouch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body:    JSON.stringify({ vouchee_id: foundUser.id }),
      })
      const json = await res.json()
      if (!json.success) { setErrorMsg(json.error ?? 'Vouch failed'); setVouchState('found'); return }
      setVoucheeNewScore(json.data?.new_score ?? null)
      setVouchState(json.data?.circular ? 'circular' : 'success')
    } catch {
      setErrorMsg('Network error — try again')
      setVouchState('found')
    }
  }

  const handleReject = () => {
    setFoundUser(null)
    setNodeInput('')
    setVouchState('idle')
    setErrorMsg('')
    setVoucheeNewScore(null)
    setFoundUserClaims([])
    setFlagConfirm(null)
    setFlagResult(null)
    setScanState('off')
  }

  const [copied, setCopied] = useState(false)

  const copyNodeId = () => {
    const id = session?.node_id
    if (!id) return
    const finish = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id).then(finish).catch(() => {
        // fallback for non-HTTPS
        const el = document.createElement('textarea')
        el.value = id
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        finish()
      })
    } else {
      const el = document.createElement('textarea')
      el.value = id
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      finish()
    }
  }

  if (!session) return null

  const initials = session.display_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const canVouch = session.tier === 'verified' || session.tier === 'trusted' || session.tier === 'gov_official'
  const canFlag  = session.tier === 'trusted' || session.tier === 'gov_official'
  const vouchPower = session.tier === 'gov_official' ? 10 : session.tier === 'trusted' ? 6.25 : session.tier === 'verified' ? 5 : 0

  async function handleFlag(claimId: string) {
    if (!session || !foundUser) return
    setFlagging(claimId)
    setFlagConfirm(null)
    try {
      const json = await protectedFetch<{ penalized_vouchers: number }>('/api/vouch/flag', session, {
        method: 'POST',
        body: JSON.stringify({ claim_id: claimId }),
      })
      if (json.success) {
        setFlagResult({ claimId, msg: `Flagged — ${json.data.penalized_vouchers} voucher(s) penalised.` })
        // Refresh the found user's score so it reflects the penalty immediately
        const refreshed = await fetch(`/api/users/node/${foundUser.node_id}`).then(r => r.json())
        if (refreshed.success) setFoundUser(refreshed.data as FoundUser)
      } else {
        setFlagResult({ claimId, msg: json.error })
      }
    } catch {
      setFlagResult({ claimId, msg: 'Could not submit flag. Try again.' })
    } finally {
      setFlagging(null)
    }
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="vouch" />
      <main className="ml-60 pt-14 px-8 py-8">

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Vouch</h1>
          <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>
            Scan someone&apos;s QR code or enter their Node ID to vouch for their identity.
          </p>
        </div>

        {!canVouch && (
          <div
            className="bento"
            style={{
              marginBottom: 24,
              borderColor: 'rgba(251,191,36,0.4)',
              background: 'rgba(251,191,36,0.06)',
              color: '#fbbf24',
              fontSize: 14,
            }}
          >
            Your account is unverified. You can show your QR code to receive vouches, but only Verified, Trusted, and Government accounts can vouch for colleagues.
          </div>
        )}

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 10, background: 'rgba(255,180,171,0.07)',
            border: '1px solid rgba(255,180,171,0.25)', marginBottom: 24,
            fontSize: 13, color: '#ffb4ab',
          }}
        >
          <Icon name="warning" size={18} style={{ color: '#ffb4ab', flexShrink: 0 }} />
          False vouches carry a trust penalty. Your current vouch power is +{vouchPower} points.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

          {/* Left — Your QR code */}
          <div className="bento" style={{ gridColumn: 'span 5' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Your QR code</h2>
            <p style={{ fontSize: 13, color: '#8c90a1', marginBottom: 20 }}>
              Let others scan this to vouch for you.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div
                style={{
                  padding: 12, borderRadius: 12,
                  background: '#ffffff',
                  border: '1px solid #424655',
                }}
              >
                <QRCodeSVG
                  value={session.node_id}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0a0e14"
                  level="M"
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: '#b0c6ff' }}>
                {session.node_id}
              </div>
              <div style={{ fontSize: 13, color: '#8c90a1', marginTop: 4 }}>{session.display_name}</div>
            </div>

            <button onClick={copyNodeId} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: copied ? '#40e56c' : undefined }}>
              <Icon name={copied ? 'check' : 'content_copy'} size={16} />
              {copied ? 'Copied!' : 'Copy Node ID'}
            </button>
          </div>

          {/* Right — Scan + lookup + confirm */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Scan / lookup card */}
            <div className="bento">
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Vouch for someone</h2>

              {/* Camera target — hidden when not scanning */}
              <div
                id="qr-scan-target"
                ref={scannerRef}
                style={{
                  display: scanState === 'scanning' ? 'block' : 'none',
                  width: '100%', borderRadius: 10, overflow: 'hidden',
                  marginBottom: 12,
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                {/* Scanner toggle */}
                <button
                  onClick={scanState === 'scanning' ? stopScanner : startScanner}
                  style={{
                    height: 52, borderRadius: 10, border: '1px solid #424655',
                    background: scanState === 'scanning' ? 'rgba(255,180,171,0.1)' : '#0a0e14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: scanState === 'scanning' ? '#ffb4ab' : '#c2c6d8',
                  }}
                >
                  <Icon name={scanState === 'scanning' ? 'stop' : 'qr_code_scanner'} size={22} />
                  {scanState === 'scanning' ? 'Stop' : 'Scan QR'}
                </button>

                <div>
                  <label style={{ fontSize: 12, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Or enter Node ID
                  </label>
                  <input
                    className="field-input"
                    placeholder="BLK-XXXXX-LDN"
                    value={nodeInput}
                    onChange={(e) => setNodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLookup() }}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <button
                  onClick={handleLookup}
                  disabled={vouchState === 'loading'}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon name="search" size={16} />
                  {vouchState === 'loading' ? 'Looking up…' : 'Look up'}
                </button>
              </div>

              {errorMsg && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#ffb4ab' }}>{errorMsg}</div>
              )}
            </div>

            {/* Person preview + confirm — shown after lookup */}
            {vouchState === 'circular' ? (
              <div className="bento" style={{ textAlign: 'center', padding: 40, border: '1px solid rgba(255,180,171,0.35)', background: 'rgba(255,180,171,0.05)' }}>
                <Icon name="warning" size={48} style={{ color: '#ffb4ab', marginBottom: 12 }} />
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Circular vouching detected</div>
                <div style={{ fontSize: 14, color: '#8c90a1', marginBottom: 6 }}>
                  {foundUser?.display_name} already vouches for you. Both parties have been penalised <strong style={{ color: '#ffb4ab' }}>−20 pts</strong>.
                </div>
                {voucheeNewScore !== null && (
                  <div style={{ fontSize: 14, color: '#8c90a1' }}>
                    Their score is now <strong style={{ color: '#ffb4ab' }}>{voucheeNewScore}</strong>.
                  </div>
                )}
                <button onClick={handleReject} className="btn-ghost" style={{ marginTop: 20 }}>
                  Vouch someone else
                </button>
              </div>
            ) : vouchState === 'success' ? (
              <div
                className="bento"
                style={{
                  textAlign: 'center', padding: 40,
                  border: '1px solid rgba(64,229,108,0.35)',
                  background: 'rgba(64,229,108,0.05)',
                }}
              >
                <Icon name="check_circle" size={48} style={{ color: '#40e56c', marginBottom: 12 }} />
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Vouch confirmed</div>
                <div style={{ fontSize: 14, color: '#8c90a1' }}>
                  {foundUser?.display_name} has been vouched.
                  {voucheeNewScore !== null && (
                    <> Their score is now <strong style={{ color: '#40e56c' }}>{voucheeNewScore}</strong>.</>
                  )}
                </div>
                <button onClick={handleReject} className="btn-ghost" style={{ marginTop: 20 }}>
                  Vouch someone else
                </button>
              </div>
            ) : foundUser ? (
              <div className="bento">
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #424655',
                  }}
                >
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(176,198,255,0.15)',
                      border: '2px solid rgba(176,198,255,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: '#b0c6ff', flexShrink: 0,
                    }}
                  >
                    {foundUser.display_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{foundUser.display_name}</div>
                    <div style={{ fontSize: 13, color: '#8c90a1', marginTop: 2 }}>
                      {foundUser.skill ?? 'Other'}{foundUser.borough ? ` · ${foundUser.borough}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <TierBadge tier={foundUser.tier} />
                    <div style={{ fontSize: 13, color: '#8c90a1', marginTop: 6 }}>
                      Score {foundUser.score} / 100
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    paddingTop: 8,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14, color: '#c2c6d8' }}>
                    Vouch {foundUser.display_name.split(' ')[0]} for +5 points?
                  </span>
                  <button onClick={handleReject} className="btn-ghost">Reject</button>
                  <button
                    onClick={handleConfirmVouch}
                    disabled={!canVouch || vouchState === 'confirming'}
                    style={{
                      padding: '10px 20px', borderRadius: 8,
                      background: 'rgba(64,229,108,0.15)',
                      border: '1px solid rgba(64,229,108,0.4)',
                      color: '#40e56c', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s',
                      opacity: vouchState === 'confirming' ? 0.6 : 1,
                    }}
                  >
                    <Icon name="handshake" size={16} />
                    {vouchState === 'confirming' ? 'Confirming…' : 'Confirm vouch'}
                  </button>
                </div>

                {/* Claims + flag section */}
                {canFlag && foundUserClaims.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #424655' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#8c90a1', marginBottom: 12 }}>VERIFIED CLAIMS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {foundUserClaims.map(claim => (
                        <div key={claim.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#10141a', border: '1px solid #424655' }}>
                          <Icon name="fact_check" size={16} style={{ color: '#40e56c', flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 13 }}>
                            <span style={{ fontWeight: 600 }}>{claim.doc_type.replace(/_/g, ' ')}</span>
                            {claim.flags > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: '#ffb4ab' }}>{claim.flags} flag{claim.flags !== 1 ? 's' : ''}</span>}
                          </div>
                          {flagResult?.claimId === claim.id ? (
                            <span style={{ fontSize: 12, color: flagResult.msg.startsWith('Flagged') ? '#40e56c' : '#ffb4ab' }}>{flagResult.msg}</span>
                          ) : (
                            <button
                              onClick={() => setFlagConfirm(claim.id)}
                              disabled={!!flagging}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.08)', color: '#ffb4ab', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Icon name="flag" size={12} />
                              Flag
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Placeholder when nothing looked up yet */
              <div
                className="bento"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 12, padding: 40,
                  color: '#424655', minHeight: 160,
                }}
              >
                <Icon name="person_search" size={40} style={{ color: '#424655' }} />
                <div style={{ fontSize: 14 }}>Scan a QR code or enter a Node ID to begin</div>
              </div>
            )}

          </div>
        </div>

        {/* Vouch API gate: score >= 20 (Verified). 403 = voucher below threshold. */}

        {/* Your identity row */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(176,198,255,0.15)', border: '1px solid rgba(176,198,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#b0c6ff',
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: 13, color: '#8c90a1' }}>
            Vouching as {session.display_name} · {session.node_id}
          </span>
          <TierBadge tier={session.tier} />
        </div>

      </main>

      {flagConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="bento" style={{ padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <Icon name="flag" size={36} style={{ color: '#ffb4ab', marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Flag this claim?</h3>
            <p style={{ fontSize: 14, color: '#8c90a1', marginBottom: 24 }}>
              This marks the claim as potentially fraudulent. Penalties apply to vouchers based on your tier ({session.tier === 'gov_official' ? '−30 pts' : '−15 pts'}). Cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setFlagConfirm(null)} disabled={!!flagging}>Cancel</button>
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
