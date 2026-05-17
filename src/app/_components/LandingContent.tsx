'use client'

import Link from 'next/link'
import MeshGraph from '@/components/civic/svg/MeshGraph'

export default function LandingContent() {
  return (
    <>
      <main style={{ paddingTop: 56 }}>

        {/* Hero */}
        <section style={{ position: 'relative', padding: '72px 72px 96px', overflow: 'hidden', borderBottom: '1px solid rgba(66,70,85,0.5)' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.7, pointerEvents: 'none' }}>
            <MeshGraph width={1280} height={680} dense seed={3} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(16,20,26,0) 0%, rgba(16,20,26,0.85) 60%, rgba(16,20,26,1) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 760 }}>
            <span className="meta" style={{ color: '#b0c6ff' }}>BLACKOUT · T+14:00 · LONDON</span>
            <h1 style={{ fontSize: 80, fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.03em', marginTop: 18, marginBottom: 0 }}>
              Trust is a<br />
              <span style={{ color: '#b0c6ff' }}>network,</span><br />
              not a record.
            </h1>
            <p style={{ fontSize: 19, color: '#c2c6d8', marginTop: 28, maxWidth: 540, lineHeight: 1.55 }}>
              When the records are gone, the people are not. Prove who you are by the people who vouch for you — and find verified doctors, nurses, and engineers nearby.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36, alignItems: 'center' }}>
              <Link href="/register" style={{ padding: '14px 24px', background: '#b0c6ff', color: '#002d6f', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                Create your node
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 28, marginTop: 40 }}>
              {[
                ['12,847', 'verified nodes'],
                ['38,221', 'vouches issued'],
                ['142', 'aid hubs live'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{n}</div>
                  <span className="meta">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How a node is born */}
        <section style={{ padding: '80px 72px', borderBottom: '1px solid rgba(66,70,85,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 48 }}>
            <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>How a node is born</h2>
            <span className="meta">FOUR STEPS · NO CENTRAL SERVER</span>
          </div>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            <svg style={{ position: 'absolute', top: 36, left: 0, right: 0, height: 2, width: '100%', pointerEvents: 'none' }} viewBox="0 0 1000 2" preserveAspectRatio="none">
              <line x1="60" y1="1" x2="940" y2="1" stroke="#b0c6ff" strokeOpacity="0.4" strokeDasharray="4 6" />
            </svg>
            {[
              ['01', 'Identify', 'Name, password, one ID document.', '#b0c6ff'],
              ['02', 'Evidence', 'Passport, degree, work ID.', '#b0c6ff'],
              ['03', 'Vouch', 'People who know you confirm it.', '#b0c6ff'],
              ['04', 'Verified', 'You appear on the public directory.', '#40e56c'],
            ].map(([n, t, d, col]) => (
              <div key={n} style={{ paddingRight: 28 }}>
                <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `${col}18`, border: `1px solid ${col}55` }} />
                  <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1px solid ${col}40` }} />
                  <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: col }} />
                </div>
                <span className="meta" style={{ color: col }}>STEP {n}</span>
                <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 8px' }}>{t}</h3>
                <p style={{ fontSize: 14, color: '#c2c6d8', lineHeight: 1.55 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust tiers — concentric rings */}
        <section style={{ padding: '80px 72px', borderBottom: '1px solid rgba(66,70,85,0.5)', background: 'rgba(24,28,34,0.35)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 48, alignItems: 'center' }}>
            <div>
              <span className="meta">TRUST AS DISTANCE FROM CENTER</span>
              <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', margin: '12px 0 16px' }}>Four rings of trust.</h2>
              <p style={{ fontSize: 16, color: '#c2c6d8', marginBottom: 32, lineHeight: 1.55, maxWidth: 460 }}>
                Each ring brings you closer to government-verified status. The further you go, the more people the city can rely on you.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Tier 0', 'Unverified', '0–19 pts', '#8c90a1'],
                  ['Tier 1', 'Verified', '20–54 pts', '#b0c6ff'],
                  ['Tier 2', 'Trusted', '55–90 pts', '#b0c6ff'],
                  ['Tier 3', 'Gov Official', '91–100 pts', '#40e56c'],
                ].map(([t, n, p, col]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 10, background: '#181c22' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <div style={{ width: 70 }}><span className="meta" style={{ color: col }}>{t}</span></div>
                    <div style={{ fontWeight: 600, flex: 1 }}>{n}</div>
                    <div className="mono" style={{ fontSize: 12, color: '#8c90a1' }}>{p}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 460 460" width="100%" height="100%">
                {[200, 150, 100, 50].map((r, i) => {
                  const cols = ['#8c90a1', '#b0c6ff', '#b0c6ff', '#40e56c']
                  return (
                    <circle
                      key={i} cx="230" cy="230" r={r}
                      fill="none" stroke={cols[i]}
                      strokeOpacity={0.4 + i * 0.1}
                      strokeDasharray={i === 3 ? undefined : '3 5'}
                      strokeWidth={i === 3 ? 1.5 : 1}
                    />
                  )
                })}
                {[
                  // Tier 0 dots — on outer ring r=200
                  [80, 100, '#8c90a1', 3], [380, 110, '#8c90a1', 3], [60, 320, '#8c90a1', 3], [400, 360, '#8c90a1', 3],
                  // Tier 1 dots — on ring r=150
                  [305, 100, '#b0c6ff', 4], [155, 100, '#b0c6ff', 4], [355, 310, '#b0c6ff', 4], [105, 310, '#b0c6ff', 4],
                  // Tier 2 dots — on ring r=100
                  [317, 180, '#b0c6ff', 4], [143, 180, '#b0c6ff', 4], [317, 280, '#b0c6ff', 4], [143, 280, '#b0c6ff', 4],
                ].map(([x, y, c, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill={c as string} />
                ))}
                <circle cx="230" cy="230" r="18" fill="#40e56c" />
                <circle cx="230" cy="230" r="28" fill="none" stroke="#40e56c" strokeOpacity="0.5" />
                <text x="230" y="234" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.5" fill="#0a0e14">GOV</text>
              </svg>
            </div>
          </div>
        </section>

        {/* Fraud resistance */}
        <section style={{ padding: '80px 72px', borderBottom: '1px solid rgba(66,70,85,0.5)' }}>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>The mesh resists fraud.</h2>
          <p style={{ color: '#c2c6d8', fontSize: 16, marginBottom: 48, maxWidth: 540 }}>Anti-fraud rules run on every claim and every vouch — without a central server.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              ['content_copy', 'Duplicates blocked', 'Same document twice? Both copies are paused.', 7],
              ['hub', 'Vouches carry weight', 'A government vouch counts twice. Trusted users outweigh strangers.', 8],
              ['person_off', 'Names must match', 'Across every document. A mismatch stops verification.', 9],
            ].map(([icon, t, d, s]) => (
              <div key={t as string} style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 14, padding: 24, background: '#181c22', height: 220 }}>
                <div style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.6, width: 200, height: 200 }}>
                  <MeshGraph width={200} height={200} seed={s as number} />
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#b0c6ff', display: 'block' }}>{icon}</span>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>{t}</h4>
                <p style={{ fontSize: 13, color: '#c2c6d8', lineHeight: 1.55, maxWidth: 230 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '96px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.45 }}>
            <MeshGraph width={1280} height={300} seed={11} />
          </div>
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Join the mesh.</h2>
            <p style={{ color: '#c2c6d8', fontSize: 16, maxWidth: 480, margin: '0 auto 32px' }}>Two minutes. One document. The rest happens as people around you vouch.</p>
            <Link href="/register" style={{ padding: '14px 28px', background: '#b0c6ff', color: '#002d6f', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              Create your node
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '20px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(66,70,85,0.5)' }}>
          <span className="meta">CivicTrust · London Mesh · T+14:00:00</span>
          <div style={{ display: 'flex', gap: 18 }}>
            {['How it works', 'Aid hubs', 'Sign in'].map(l => (
              <Link key={l} href={l === 'Sign in' ? '/login' : '#'} style={{ fontSize: 12, color: '#8c90a1', textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
        </footer>
      </main>
    </>
  )
}
