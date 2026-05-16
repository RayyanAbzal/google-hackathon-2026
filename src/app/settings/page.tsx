'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import type { Session, NotificationPreferences } from '@/types'
import { getInitials, requireSession } from '@/app/_lib/session'

type Tab = 'Profile' | 'Security' | 'Notifications' | 'Privacy'
const TABS: Tab[] = ['Profile', 'Security', 'Notifications', 'Privacy']

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [session, setSession] = useState<Session | null>(null)
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    vouch_received: true,
    claim_verified: true,
    tier_changed: true,
    account_created: true,
  })

  useEffect(() => {
    queueMicrotask(() => setSession(requireSession(router)))
  }, [router])

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

        {activeTab !== 'Profile' && activeTab !== 'Notifications' && (
          <div className="bento" style={{ color: '#8c90a1', fontSize: 14, textAlign: 'center', padding: 48 }}>
            Coming soon
          </div>
        )}

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
                  <input className="field-input" value={session?.display_name ?? ''} readOnly />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Display name
                  </label>
                  <input className="field-input" value={session?.display_name ?? ''} readOnly />
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

            {/* Sessions section */}
            <div className="bento" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>Devices signed in</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: 'laptop_mac', label: 'MacBook Pro', detail: 'Last active now', isCurrent: true },
                  { icon: 'smartphone', label: 'iPhone 15', detail: 'Last active 2 days ago', isCurrent: false },
                ].map((device) => (
                  <div
                    key={device.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: '#10141a',
                      border: '1px solid #424655',
                    }}
                  >
                    <Icon name={device.icon} size={20} style={{ color: '#8c90a1' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{device.label}</div>
                      <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{device.detail}</div>
                    </div>
                    {device.isCurrent ? (
                      <span style={{ fontSize: 12, color: '#40e56c', fontWeight: 600 }}>Current</span>
                    ) : (
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffb4ab',
                          fontSize: 13,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Sign out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffb4ab',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Delete account
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost">Cancel</button>
                <button className="btn-primary">Save changes</button>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
