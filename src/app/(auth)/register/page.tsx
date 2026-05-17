'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import type { MandatoryDocType, Session, TrustTier } from '@/types'
import { saveSession } from '@/app/_lib/session'

interface RegisterResult { token: string; user_id: string; node_id: string; score: number; tier: TrustTier }

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [docType, setDocType] = useState<MandatoryDocType>('passport')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!file) { setError('Please upload an ID document'); return }
    if (file.type !== 'image/png') { setError('Please upload a PNG image only'); return }

    setLoading(true)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res((reader.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })

      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim(), password, doc_type: docType, doc_image_base64: base64, mime_type: 'image/png' }),
      })
      const json = await resp.json() as { success: boolean; data?: RegisterResult; error?: string }
      if (!json.success || !json.data) { setError(json.error ?? 'Registration failed'); return }

      const session: Session = { ...json.data, display_name: name.trim(), username: null, skill: null, borough: null }
      saveSession(session)
      router.push('/unverified')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar authMode="public" />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>Create your account</h1>
            <p style={{ color: '#c2c6d8', fontSize: 15, marginTop: 8 }}>No email needed. Just a name, password, and one ID document.</p>
          </div>

          <form className="bento" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
            <div>
              <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 6 }}>Full name</label>
              <input className="field-input" placeholder="As shown on your ID" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 6 }}>Password</label>
                <input className="field-input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 6 }}>Confirm password</label>
                <input className="field-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 8 }}>Upload one document</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {(['passport', 'driving_licence'] as MandatoryDocType[]).map(dt => (
                  <button key={dt} type="button" onClick={() => setDocType(dt)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: docType === dt ? 'rgba(176,198,255,0.08)' : '#0a0e14', border: `1px solid ${docType === dt ? '#b0c6ff' : '#424655'}`, color: docType === dt ? '#b0c6ff' : '#c2c6d8', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{dt === 'passport' ? 'id_card' : 'drive_eta'}</span>
                    {dt === 'passport' ? 'Passport' : "Driver's licence"}
                  </button>
                ))}
              </div>

              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, background: 'rgba(64,229,108,0.05)', border: '1px solid rgba(64,229,108,0.4)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0a0e14', border: '1px solid rgba(64,229,108,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#40e56c' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: '#c2c6d8' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#c2c6d8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '24px', borderRadius: 10, background: '#0a0e14', border: '2px dashed #424655', color: '#8c90a1', cursor: 'pointer', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#b0c6ff' }}>cloud_upload</span>
                  Click to upload
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,.png"
                style={{ display: 'none' }}
                onChange={e => {
                  const nextFile = e.target.files?.[0] ?? null
                  if (nextFile && nextFile.type !== 'image/png') {
                    setFile(null)
                    setError('Please upload a PNG image only')
                    return
                  }
                  setError('')
                  setFile(nextFile)
                }}
              />
              <p style={{ fontSize: 12, color: '#8c90a1', marginTop: 8 }}>Only PNG images of a current passport or driving licence are accepted for sign-up.</p>
            </div>

            {error && <p style={{ fontSize: 13, color: '#ffb4ab', margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 8, background: '#b0c6ff', color: '#002d6f', fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating...' : 'Create account'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#c2c6d8', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#b0c6ff', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
