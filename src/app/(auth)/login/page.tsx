'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import type { Session } from '@/types'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      })
      const json = await res.json() as { success: boolean; data?: Session; error?: string }
      if (!json.success || !json.data) {
        setError(json.error ?? 'Invalid credentials')
        return
      }
      localStorage.setItem('civictrust_session', JSON.stringify(json.data))
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>Sign in</h1>
            <p style={{ color: '#c2c6d8', fontSize: 15, marginTop: 8 }}>Welcome back. Enter your Node ID and password.</p>
          </div>

          <form className="bento" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
            <div>
              <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 6 }}>Node ID</label>
              <input
                className="field-input"
                style={{ fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                placeholder="BLK-XXXX-LDN"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: '#c2c6d8' }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: '#8c90a1', textDecoration: 'none' }}>Lost access?</a>
              </div>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p style={{ fontSize: 13, color: '#ffb4ab', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 8, background: '#b0c6ff', color: '#002d6f', fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#c2c6d8', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: '#b0c6ff', textDecoration: 'none' }}>Create one</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
