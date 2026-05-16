'use client'

import Link from 'next/link'
import Sidebar from '@/components/civic/Sidebar'
import { useSidebar } from '@/components/civic/SidebarProvider'
import MeshGraph from '@/components/civic/svg/MeshGraph'

export default function LandingContent() {
  const { width: sidebarWidth } = useSidebar()

  return (
    <>
      <Sidebar active="" mode="public" />
      <main style={{ marginLeft: sidebarWidth, paddingTop: 56, transition: 'margin-left 0.2s ease' }}>

        {/* Hero */}
        <section style={{ padding: '96px 64px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(66,70,85,0.6)' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
            <MeshGraph width={1280} height={600} dense seed={3} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(16,20,26,0) 0%, rgba(16,20,26,0.9) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: 80, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.0, maxWidth: 900, margin: '0 auto', marginBottom: 0 }}>
              Rebuilding trust<br />
              <span style={{ color: '#b0c6ff' }}>when records are gone.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#c2c6d8', marginTop: 28, maxWidth: 600, margin: '28px auto 0', lineHeight: 1.6 }}>
              Prove who you are, find verified doctors and tradespeople, and rebuild your reputation — even with no digital records.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 36 }}>
              <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#b0c6ff', color: '#002d6f', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                Create account
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 20px', background: '#262a31', border: '1px solid #424655', borderRadius: 8, color: '#dfe2eb', fontSize: 14, textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: '80px 64px', borderBottom: '1px solid rgba(66,70,85,0.6)', background: 'rgba(24,28,34,0.35)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>How it works</h2>
            <p style={{ color: '#c2c6d8', textAlign: 'center', fontSize: 15, marginBottom: 48, maxWidth: 480, margin: '12px auto 48px' }}>Four simple steps. No central server, no waiting on banks.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                ['1', 'Create account', 'Name, password, one ID document.', '#b0c6ff'],
                ['2', 'Add evidence', 'Upload a passport, degree, or work ID.', '#b0c6ff'],
                ['3', 'Get vouched', 'People you know confirm your identity.', '#b0c6ff'],
                ['4', 'Get verified', 'Appear on the public directory.', '#40e56c'],
              ].map(([n, title, desc, col]) => (
                <div key={n} style={{ border: '1px solid #424655', borderRadius: 12, padding: 24, background: '#181c22' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${col}18`, border: `1px solid ${col}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: col, fontWeight: 600, marginBottom: 16 }}>
                    {n}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#c2c6d8', lineHeight: 1.55, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust tiers */}
        <section style={{ padding: '80px 64px', borderBottom: '1px solid rgba(66,70,85,0.6)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Trust tiers</h2>
            <p style={{ color: '#c2c6d8', textAlign: 'center', fontSize: 15, marginBottom: 48, maxWidth: 480, margin: '12px auto 48px' }}>Your score climbs as you add evidence and get vouched.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Tier 0', name: 'Unverified', pts: '0–19 points', col: '#8c90a1', bg: 'rgba(140,144,161,0.1)', border: 'rgba(140,144,161,0.3)' },
                { label: 'Tier 1', name: 'Verified', pts: '20–54 points', col: '#b0c6ff', bg: 'rgba(176,198,255,0.1)', border: 'rgba(176,198,255,0.3)' },
                { label: 'Tier 2', name: 'Trusted', pts: '55–90 points', col: '#b0c6ff', bg: 'rgba(86,141,255,0.12)', border: 'rgba(86,141,255,0.5)' },
                { label: 'Tier 3', name: 'Gov Official', pts: '91–100 points', col: '#40e56c', bg: 'rgba(64,229,108,0.1)', border: 'rgba(64,229,108,0.4)' },
              ].map(t => (
                <div key={t.label} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, background: '#181c22' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 9999, background: t.bg, border: `1px solid ${t.border}`, color: t.col, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                    {t.label}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 16, marginBottom: 4 }}>{t.name}</h3>
                  <p style={{ fontSize: 13, color: '#8c90a1', margin: 0 }}>{t.pts}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fraud resistance */}
        <section style={{ padding: '80px 64px', borderBottom: '1px solid rgba(66,70,85,0.6)', background: 'rgba(24,28,34,0.35)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Built to resist fraud</h2>
            <p style={{ color: '#c2c6d8', textAlign: 'center', fontSize: 15, marginBottom: 48, maxWidth: 480, margin: '12px auto 48px' }}>Anti-fraud rules run on every claim and every vouch.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { icon: 'content_copy', title: 'Duplicates blocked', desc: 'Same document twice? Both copies are paused.' },
                { icon: 'person_off', title: 'Names must match', desc: 'Across every document. A mismatch stops verification.' },
                { icon: 'hub', title: 'Vouch rings detected', desc: 'Coordinated cross-vouching is flagged automatically.' },
              ].map(f => (
                <div key={f.title} style={{ border: '1px solid #424655', borderRadius: 12, padding: 24, background: '#181c22' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#b0c6ff', display: 'block', marginBottom: 12 }}>{f.icon}</span>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{f.title}</h4>
                  <p style={{ fontSize: 13, color: '#c2c6d8', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '96px 64px', textAlign: 'center', borderBottom: '1px solid rgba(66,70,85,0.6)' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>Ready to rebuild your trust?</h2>
            <p style={{ color: '#c2c6d8', fontSize: 16, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Two minutes. One document. The rest happens as the people around you vouch.
            </p>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#b0c6ff', color: '#002d6f', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              Create account
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '20px 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(66,70,85,0.5)' }}>
          <span style={{ fontSize: 12, color: '#8c90a1' }}>CivicTrust · London Mesh</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'How it works', href: '#' },
              { label: 'Aid hubs', href: '#' },
              { label: 'Sign in', href: '/login' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ fontSize: 12, color: '#8c90a1', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#b0c6ff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8c90a1')}>
                {l.label}
              </Link>
            ))}
          </div>
        </footer>
      </main>
    </>
  )
}
