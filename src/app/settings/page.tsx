'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import type { Session, NotificationPreferences } from '@/types'
import { getInitials, protectedFetch, requireSession, updateStoredSession } from '@/app/_lib/session'

type Tab = 'Profile' | 'Notifications'
const TABS: Tab[] = ['Profile', 'Notifications']

interface ProfileRecord {
  id: string
  node_id: string
  username: string | null
  display_name: string
  skill: string | null
  score: number
  tier: string
  borough: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [session, setSession] = useState<Session | null>(null)
  const [name, setName] = useState('')
  const [usernameValue, setUsernameValue] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    vouch_received: true,
    claim_verified: true,
    tier_changed: true,
    account_created: true,
  })

  useEffect(() => {
    queueMicrotask(() => setSession(requireSession(router)))
  }, [router])

  useEffect(() => {
    if (!session) return
    queueMicrotask(() => {
      setName(session.display_name)
      setUsernameValue(session.username ?? '')
      setLoadingProfile(true)
      protectedFetch<ProfileRecord>(`/api/users/node/${session.node_id}`, session)
        .then((json) => {
          if (json.success) {
            setName(json.data.display_name)
            setUsernameValue(json.data.username ?? '')
          } else {
            setSaveError(json.error ?? 'Unable to load profile from the database')
          }
        })
        .catch(() => setSaveError('Unable to load profile from the database'))
        .finally(() => setLoadingProfile(false))
    })
  }, [session])

  async function handleSaveProfile() {
    if (!session) return
    setSaveError('')
    setSaveMessage('')
    setSavingProfile(true)

    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Full name cannot be empty')
      }

      let updatedSession = session
      if (trimmedName !== session.display_name) {
        const result = await protectedFetch<{ display_name: string }>('/api/auth/profile', session, {
          method: 'PATCH',
          body: JSON.stringify({ display_name: trimmedName }),
        })
        if (!result.success) {
          throw new Error(result.error ?? 'Unable to save full name')
        }
        updatedSession = updateStoredSession({ display_name: result.data.display_name }) ?? updatedSession
        setSession(updatedSession)
      }

      const trimmedUsername = usernameValue.trim()
      if (trimmedUsername !== (session.username ?? '')) {
        if (!trimmedUsername) {
          throw new Error('Display name cannot be empty')
        }
        const result = await protectedFetch<{ username: string }>('/api/auth/username', session, {
          method: 'PATCH',
          body: JSON.stringify({ username: trimmedUsername }),
        })
        if (!result.success) {
          throw new Error(result.error ?? 'Unable to save display name')
        }
        updatedSession = updateStoredSession({ username: result.data.username }) ?? updatedSession
        setSession(updatedSession)
      }

      setSaveMessage('Profile saved successfully.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setSaveMessage('')
      setSaveError('Click Delete account again to confirm.')
      return
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('civictrust_session')
    }
    router.replace('/login')
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="settings" session={session} />
      <main className="ml-60 pt-14 px-8 py-8">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>Manage your account details.</p>
        </div>

        {/* Tab row */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid rgba(66,70,85,0.6)',
            marginBottom: 28,
          }}
        >
          {TABS.map((tab) => {
            const isActive = tab === activeTab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #b0c6ff' : '2px solid transparent',
                  color: isActive ? '#b0c6ff' : '#8c90a1',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  marginBottom: -1,
                  transition: 'color 0.15s',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {activeTab === 'Notifications' && (
          <div className="bento">
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>Notification preferences</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'vouch_received' as const, label: 'New vouch received', description: 'Get notified when someone vouches for you' },
                { key: 'claim_verified' as const, label: 'Claim verified', description: 'Get notified when your documents are verified' },
                { key: 'tier_changed' as const, label: 'Tier promoted', description: 'Get notified when your trust tier increases' },
                { key: 'account_created' as const, label: 'Account created', description: 'Welcome notifications and onboarding updates' },
              ].map(({ key, label, description }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px',
                    borderRadius: 10,
                    background: '#10141a',
                    border: '1px solid #424655',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#8c90a1' }}>{description}</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                      style={{
                        width: 18,
                        height: 18,
                        cursor: 'pointer',
                        accentColor: '#b0c6ff',
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'flex-end' }}>
              <button className="btn-ghost">Cancel</button>
              <button className="btn-primary" onClick={() => {}}>Save preferences</button>
            </div>
          </div>
        )}

        {activeTab === 'Profile' && (
          <>
            {/* Profile section */}
            <div className="bento" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>Profile</h2>

              {/* Avatar row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #424655' }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(176,198,255,0.15)',
                    border: '2px solid rgba(176,198,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#b0c6ff',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(session?.display_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Profile photo</div>
                  <div style={{ fontSize: 13, color: '#8c90a1' }}>
                    Optional. Shown to people who scan your QR.
                  </div>
                </div>
                <button className="btn-ghost" style={{ fontSize: 13 }}>Change</button>
              </div>

              {/* Fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Full name
                  </label>
                  <input
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="As shown on your ID"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Display name
                  </label>
                  <input
                    className="field-input"
                    value={usernameValue}
                    onChange={(e) => setUsernameValue(e.target.value)}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Role
                  </label>
                  <select className="field-input">
                    <option>Doctor</option>
                    <option>Engineer</option>
                    <option>Legal</option>
                    <option>Builder</option>
                    <option>Nurse</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Borough
                  </label>
                  <select className="field-input">
                    <option>Southwark</option>
                    <option>Hackney</option>
                    <option>Lambeth</option>
                    <option>Westminster</option>
                    <option>Camden</option>
                    <option>Islington</option>
                    <option>Tower Hamlets</option>
                    <option>Newham</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    User ID
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="field-input"
                      value={session?.user_id ?? ''}
                      disabled
                      style={{ fontFamily: 'monospace', opacity: 0.6 }}
                      readOnly
                    />
                    <button className="btn-ghost" style={{ flexShrink: 0 }}>
                      <Icon name="content_copy" size={16} />
                      Copy
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#424655', marginTop: 6 }}>
                    Your User ID is permanent and cannot be changed.
                  </p>
                </div>
              </div>

              {(saveError || saveMessage || loadingProfile) && (
                <div style={{ marginTop: 20, color: saveError ? '#ffb4ab' : '#8c90a1', fontSize: 13 }}>
                  {loadingProfile ? 'Loading profile from database...' : saveError || saveMessage}
                </div>
              )}
            </div>

            {/* Password section */}
            <div className="bento" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>Password</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Current password
                  </label>
                  <input className="field-input" type="password" placeholder="••••••••" />
                </div>
                <div />
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    New password
                  </label>
                  <input className="field-input" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Confirm new password
                  </label>
                  <input className="field-input" type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDeleteAccount}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffb4ab',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {confirmDelete ? 'Confirm delete account' : 'Delete account'}
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" type="button" onClick={() => {
                  setName(session?.display_name ?? '')
                  setUsernameValue(session?.username ?? '')
                  setSaveError('')
                  setSaveMessage('')
                  setConfirmDelete(false)
                }}>
                  Cancel
                </button>
                <button className="btn-primary" type="button" onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
