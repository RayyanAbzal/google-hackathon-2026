'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import type { Session } from '@/types'
import { protectedFetch, saveSession, updateStoredSession } from '@/app/_lib/session'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [pendingSession, setPendingSession] = useState<Session | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function destination(): string {
    if (typeof window === 'undefined') return '/dashboard'
    return new URLSearchParams(window.location.search).get('returnTo') ?? '/dashboard'
  }

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
      saveSession(json.data)
      if (!json.data.username) {
        setPendingSession(json.data)
        setUsername('')
        return
      }
      router.push(destination())
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

      if (!json.success) {
        setError(json.error)
        return
      }

      updateStoredSession({ username: json.data.username })
      router.push(destination())
    } catch {
      setError('Could not set username. Try another one.')
    } finally {
      setLoading(false)
    }
  }

  function skipUsername() {
    router.push(destination())
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar authMode="public" />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>Sign in</h1>
            <p style={{ color: '#c2c6d8', fontSize: 15, marginTop: 8 }}>Welcome back. Enter your username and password.</p>
          </div>

          <form className="bento" style={{ padding: 32, display: pendingSession ? 'none' : 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
            <div>
              <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 6 }}>Username</label>
              <input
                className="field-input"
                placeholder="@username"
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

          {pendingSession && (
            <form className="bento" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleUsernameSubmit}>
              <div>
                <label style={{ fontSize: 13, color: '#c2c6d8', display: 'block', marginBottom: 6 }}>Choose your username</label>
                <input
                  className="field-input"
                  placeholder="@username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
                <p style={{ fontSize: 12, color: '#8c90a1', marginTop: 8 }}>
                  This lets people find your trust profile without using your raw User ID.
                </p>
              </div>

              {error && <p style={{ fontSize: 13, color: '#ffb4ab', margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 24px', borderRadius: 8, background: '#b0c6ff', color: '#002d6f', fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Saving...' : 'Save username'}
                {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
              </button>
              <button type="button" className="btn-ghost" style={{ justifyContent: 'center' }} onClick={skipUsername}>
                Skip for now
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
