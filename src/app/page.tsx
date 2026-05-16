import Link from 'next/link'
import TopBar from '@/components/civic/TopBar'

export default function Home() {
  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <main style={{ paddingTop: 56 }}>

        {/* Hero */}
        <section style={{ padding: '96px 32px 80px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 80, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.0, maxWidth: 1000, margin: '0 auto' }}>
            Rebuilding trust<br />
            <span style={{ color: '#b0c6ff' }}>when records are gone.</span>
          </h1>
          <p style={{ color: '#c2c6d8', fontSize: 18, marginTop: 32, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Prove who you are, find verified doctors and tradespeople, and rebuild your reputation — even with no digital records.
          </p>
          <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/register" className="btn-solid-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              Create account
            </Link>
            <Link href="/login" className="btn-ghost">Sign in</Link>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: '80px 32px', borderTop: '1px solid rgba(66,70,85,0.6)', background: 'rgba(24,28,34,0.3)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'center', marginBottom: 12 }}>How it works</h2>
            <p style={{ color: '#c2c6d8', textAlign: 'center', fontSize: 15, marginBottom: 48, maxWidth: 520, margin: '0 auto 48px' }}>Four simple steps. No central server, no waiting on banks.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
              {[
                { n: '1', title: 'Create account', desc: 'Name, password, one ID document.', color: '#b0c6ff' },
                { n: '2', title: 'Add evidence', desc: 'Upload a passport, degree, or work ID.', color: '#b0c6ff' },
                { n: '3', title: 'Get vouched', desc: 'People you know confirm your identity.', color: '#b0c6ff' },
                { n: '4', title: 'Get verified', desc: 'Appear on the public directory.', color: '#40e56c' },
              ].map(s => (
                <div key={s.n} className="bento" style={{ padding: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${s.color}18`, border: `1px solid ${s.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontWeight: 600, marginBottom: 16 }}>{s.n}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#c2c6d8' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust tiers */}
        <section style={{ padding: '80px 32px', borderTop: '1px solid rgba(66,70,85,0.6)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>Trust tiers</h2>
            <p style={{ color: '#c2c6d8', textAlign: 'center', fontSize: 15, maxWidth: 520, margin: '0 auto 48px' }}>Your score climbs as you add evidence and get vouched.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { cls: 'tier-0', label: 'Tier 0', name: 'Unverified', pts: '0–29 points' },
                { cls: 'tier-1', label: 'Tier 1', name: 'Partial', pts: '30–49 points' },
                { cls: 'tier-2', label: 'Tier 2', name: 'Community Verified', pts: '50–74 points' },
                { cls: 'tier-3', label: 'Tier 3', name: 'Government Verified', pts: '75+ points' },
              ].map(t => (
                <div key={t.cls} className="bento" style={{ padding: 24 }}>
                  <span className={`tier-badge ${t.cls}`}>{t.label}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 16, marginBottom: 4 }}>{t.name}</h3>
                  <p style={{ fontSize: 13, color: '#c2c6d8' }}>{t.pts}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fraud resistance */}
        <section style={{ padding: '80px 32px', borderTop: '1px solid rgba(66,70,85,0.6)', background: 'rgba(24,28,34,0.3)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>Built to resist fraud</h2>
            <p style={{ color: '#c2c6d8', textAlign: 'center', fontSize: 15, maxWidth: 520, margin: '0 auto 48px' }}>Anti-fraud rules run on every claim and every vouch.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { icon: 'content_copy', title: 'Duplicates blocked', desc: 'Same document twice? Both copies are paused.' },
                { icon: 'person_off', title: 'Names must match', desc: 'Across every document. A mismatch stops verification.' },
                { icon: 'hub', title: 'Vouch rings detected', desc: 'Coordinated cross-vouching is flagged automatically.' },
              ].map(f => (
                <div key={f.icon} className="bento" style={{ padding: 24 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#b0c6ff', display: 'block', marginBottom: 12 }}>{f.icon}</span>
                  <h4 style={{ fontWeight: 600, marginBottom: 6 }}>{f.title}</h4>
                  <p style={{ fontSize: 13, color: '#c2c6d8' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '96px 32px', borderTop: '1px solid rgba(66,70,85,0.6)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 20 }}>Ready to rebuild your trust?</h2>
          <p style={{ color: '#c2c6d8', fontSize: 16, maxWidth: 480, margin: '0 auto 32px' }}>Two minutes. One document. The rest happens as the people around you vouch.</p>
          <Link href="/register" className="btn-solid-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            Create account
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ padding: '24px 32px', borderTop: '1px solid rgba(66,70,85,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8c90a1' }}>CivicTrust · London Mesh</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['How it works', 'Aid hubs'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: '#8c90a1', textDecoration: 'none' }}>{l}</a>
            ))}
            <Link href="/login" style={{ fontSize: 12, color: '#8c90a1', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
