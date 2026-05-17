'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import type { MandatoryDocType, Session, TrustTier } from '@/types'
import { protectedFetch, saveSession, updateStoredSession } from '@/app/_lib/session'

interface RegisterResult { token: string; user_id: string; node_id: string; score: number; tier: TrustTier }

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [docType, setDocType] = useState<MandatoryDocType>('passport')
  const [file, setFile] = useState<File | null>(null)
  const [fileBack, setFileBack] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingSession, setPendingSession] = useState<Session | null>(null)
  const [username, setUsername] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const fileBackRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!file) { setError('Please upload an ID document'); return }
    if (file.type !== 'image/png') { setError('Please upload a PNG image only'); return }
    if (docType === 'driving_licence' && !fileBack) { setError("Please upload the back of your driver's licence too"); return }
    if (fileBack && fileBack.type !== 'image/png') { setError('Back image must also be a PNG'); return }

    setLoading(true)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res((reader.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })

      const base64Back = fileBack
        ? await new Promise<string>((res, rej) => {
            const reader = new FileReader()
            reader.onload = () => res((reader.result as string).split(',')[1])
            reader.onerror = rej
            reader.readAsDataURL(fileBack)
          })
        : undefined

      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: name.trim(),
          password,
          doc_type: docType,
          doc_image_base64: base64,
          ...(base64Back ? { doc_image_base64_back: base64Back } : {}),
          mime_type: 'image/png',
        }),
      })
      const json = await resp.json() as { success: boolean; data?: RegisterResult; error?: string }
      if (!json.success || !json.data) { setError(json.error ?? 'Registration failed'); return }

      const session: Session = { ...json.data, display_name: name.trim(), username: null, skill: null, borough: null }
      saveSession(session)
      setPendingSession(session)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingSession) return
    setError('')
    setLoading(true)
    try {
      const json = await protectedFetch<{ username: string }>('/api/auth/username', pendingSession, {
        method: 'PATCH',
        body: JSON.stringify({ username: username.trim().replace(/^@/, '') }),
      })
      if (!json.success) { setError(json.error); return }
      updateStoredSession({ username: json.data.username })
      router.push('/unverified')
    } catch {
      setError('Could not set username. Try another one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#070708', minHeight: '100vh', color: '#d2d2d6' }}>
      <TopBar authMode="public" />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {pendingSession ? 'Choose your username' : 'Create your account'}
            </h1>
            <p style={{ color: '#d2d2d6', fontSize: 15, marginTop: 8 }}>
              {pendingSession ? 'This is how people will find your trust profile.' : 'No email needed. Just a name, password, and one ID document.'}
            </p>
          </div>

          <form className="bento" style={{ padding: 32, display: pendingSession ? 'none' : 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
            <div>
              <label style={{ fontSize: 13, color: '#d2d2d6', display: 'block', marginBottom: 6 }}>Full name</label>
              <input className="field-input" placeholder="As shown on your ID" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: '#d2d2d6', display: 'block', marginBottom: 6 }}>Password</label>
                <input className="field-input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#d2d2d6', display: 'block', marginBottom: 6 }}>Confirm password</label>
                <input className="field-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#d2d2d6', display: 'block', marginBottom: 8 }}>
                {docType === 'driving_licence' ? 'Upload front + back' : 'Upload document'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {(['passport', 'driving_licence'] as MandatoryDocType[]).map(dt => (
                  <button key={dt} type="button" onClick={() => { setDocType(dt); setFile(null); setFileBack(null) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: docType === dt ? 'rgba(160,0,32,0.08)' : '#070708', border: `1px solid ${docType === dt ? '#a00020' : '#28282c'}`, color: docType === dt ? '#a00020' : '#d2d2d6', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{dt === 'passport' ? 'id_card' : 'drive_eta'}</span>
                    {dt === 'passport' ? 'Passport' : "Driver's licence"}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: docType === 'driving_licence' ? '1fr 1fr' : '1fr', gap: 10 }}>
                {/* Front / single */}
                <div>
                  {docType === 'driving_licence' && <div style={{ fontSize: 11, color: '#6a6a70', marginBottom: 6 }}>Front of licence</div>}
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: 'rgba(0,184,96,0.05)', border: '1px solid rgba(0,184,96,0.4)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00b860' }}>check</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      </div>
                      <button type="button" onClick={() => setFile(null)} style={{ padding: 4, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#d2d2d6' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '20px 12px', borderRadius: 10, background: '#070708', border: '2px dashed #28282c', color: '#6a6a70', cursor: 'pointer', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#a00020' }}>cloud_upload</span>
                      Click to upload
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/png,.png" style={{ display: 'none' }} onChange={e => {
                    const f = e.target.files?.[0] ?? null
                    if (f && f.type !== 'image/png') { setFile(null); setError('Please upload a PNG image only'); return }
                    setError(''); setFile(f)
                  }} />
                </div>

                {/* Back — driving licence only */}
                {docType === 'driving_licence' && <div>
                  <div style={{ fontSize: 11, color: '#6a6a70', marginBottom: 6 }}>Back of licence</div>
                    {fileBack ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: 'rgba(0,184,96,0.05)', border: '1px solid rgba(0,184,96,0.4)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00b860' }}>check</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileBack.name}</div>
                        </div>
                        <button type="button" onClick={() => setFileBack(null)} style={{ padding: 4, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#d2d2d6' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileBackRef.current?.click()} style={{ width: '100%', padding: '20px 12px', borderRadius: 10, background: '#070708', border: '2px dashed #28282c', color: '#6a6a70', cursor: 'pointer', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#a00020' }}>flip</span>
                        Click to upload
                      </button>
                    )}
                    <input ref={fileBackRef} type="file" accept="image/png,.png" style={{ display: 'none' }} onChange={e => {
                      const f = e.target.files?.[0] ?? null
                      if (f && f.type !== 'image/png') { setFileBack(null); setError('Back image must be a PNG'); return }
                      setError(''); setFileBack(f)
                    }} />
                  </div>}
              </div>

              <p style={{ fontSize: 12, color: '#6a6a70', marginTop: 8 }}>
                {docType === 'driving_licence' ? 'Upload both sides as PNG images.' : 'Upload a PNG image of your passport data page.'}
              </p>
            </div>

            {error && <p style={{ fontSize: 13, color: '#ff2d4a', margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 8, background: '#a00020', color: '#f5f5f5', fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating...' : 'Create account'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#d2d2d6', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#a00020', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
          {pendingSession && (
            <form className="bento" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleUsernameSubmit}>
              <div>
                <label style={{ fontSize: 13, color: '#d2d2d6', display: 'block', marginBottom: 6 }}>Username</label>
                <input
                  className="field-input"
                  placeholder="@username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  required
                />
                <p style={{ fontSize: 12, color: '#6a6a70', marginTop: 8 }}>
                  You'll use this to sign in. Letters, numbers and underscores only.
                </p>
              </div>

              {error && <p style={{ fontSize: 13, color: '#ff2d4a', margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 8, background: '#a00020', color: '#f5f5f5', fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Saving...' : 'Save username'}
                {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
              </button>
              <button type="button" className="btn-ghost" style={{ justifyContent: 'center' }} onClick={() => router.push('/unverified')}>
                Skip for now
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
