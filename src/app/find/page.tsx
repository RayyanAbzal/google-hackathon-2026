'use client'

import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/civic/TopBar'

const PROFESSIONS = ['Doctor', 'Nurse', 'Engineer', 'Lawyer']
const AREAS = ['Southwark', 'Lambeth', 'Hackney']
const AVAILABILITY = ['Now', 'Today']

const RESULTS = [
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', tier: 'tier-3-outline', tierLabel: 'Tier 3', area: 'Southwark · 0.4 km', avail: 'Available now', availColor: '#40e56c', note: "At Guy's Aid Hub · 12 min wait" },
  { icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Paediatrics', tier: 'tier-2', tierLabel: 'Tier 2', area: 'Southwark · 0.7 km', avail: 'From 2:00 pm', availColor: '#fbbf24', note: 'House calls available' },
  { icon: 'local_hospital', iconColor: '#40e56c', title: "Guy's Aid Hub", sub: 'A&E · Paediatrics · Pharmacy', tier: 'tier-3', tierLabel: 'Hub', area: 'Southwark · 0.3 km', avail: '4 doctors on-site', availColor: '#40e56c', note: 'Wait time · 12 min' },
  { icon: 'medication', iconColor: '#40e56c', title: 'Verified Pharmacist', sub: 'Emergency dispensing', tier: 'tier-3-outline', tierLabel: 'Tier 3', area: 'Southwark · 0.6 km', avail: 'Open now', availColor: '#40e56c', note: 'Walk-in welcome' },
]

export default function FindPage() {
  const [activeProf, setActiveProf] = useState('Doctor')
  const [activeArea, setActiveArea] = useState('Southwark')
  const [activeAvail, setActiveAvail] = useState('Now')
  const [search, setSearch] = useState('Doctor in Southwark')

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <main style={{ paddingTop: 56, padding: '56px 32px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', paddingBottom: 32 }}>
            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.01em' }}>Find verified help nearby.</h1>
            <p style={{ color: '#c2c6d8', fontSize: 15, marginTop: 8, maxWidth: 480, margin: '8px auto 0' }}>Every listing is verified by the community. No account needed.</p>
          </div>

          {/* Search */}
          <div className="bento" style={{ padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#8c90a1', marginLeft: 8 }}>search</span>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: '#dfe2eb', padding: '8px 0' }}
              placeholder="What do you need help with?"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn-primary" style={{ flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="bento" style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>Profession:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {PROFESSIONS.map(p => <span key={p} className={`chip ${activeProf === p ? 'chip-active' : ''}`} onClick={() => setActiveProf(p)}>{p}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>Area:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {AREAS.map(a => <span key={a} className={`chip ${activeArea === a ? 'chip-active' : ''}`} onClick={() => setActiveArea(a)}>{a}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>Available:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {AVAILABILITY.map(av => <span key={av} className={`chip ${activeAvail === av ? 'chip-active' : ''}`} onClick={() => setActiveAvail(av)}>{av}</span>)}
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 20 }}>
            <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {RESULTS.map((r, i) => (
                <article key={i} className="bento" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: `${r.iconColor}18`, border: `1px solid ${r.iconColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.iconColor }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{r.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#c2c6d8' }}>{r.sub}</div>
                      </div>
                    </div>
                    <span className={`tier-badge ${r.tier}`} style={{ fontSize: 10 }}>{r.tierLabel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c2c6d8', marginBottom: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                    {r.area}
                    <span style={{ color: '#424655' }}>·</span>
                    <span style={{ color: r.availColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="dot" style={{ background: r.availColor, boxShadow: `0 0 6px ${r.availColor}80` }} />
                      {r.avail}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(66,70,85,0.6)' }}>
                    <div style={{ fontSize: 12, color: '#8c90a1' }}>{r.note}</div>
                    <button style={{ fontSize: 13, color: '#b0c6ff', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Details →</button>
                  </div>
                </article>
              ))}
            </div>

            <aside style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="bento" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="city-grid" style={{ position: 'relative', height: 260 }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice">
                    <path d="M-20 150 Q 60 120 160 145 T 380 130 L 460 130 L 460 165 Q 380 175 280 158 T 60 175 L -20 195 Z" fill="#181c22" stroke="#262a31" />
                    <circle cx="180" cy="180" r="14" fill="#b0c6ff" opacity="0.18" />
                    <circle cx="180" cy="180" r="6" fill="#b0c6ff" stroke="#10141a" strokeWidth="2" />
                    <circle cx="160" cy="160" r="6" fill="#40e56c" stroke="#10141a" strokeWidth="2" />
                    <circle cx="220" cy="200" r="6" fill="#40e56c" stroke="#10141a" strokeWidth="2" />
                    <circle cx="140" cy="210" r="5" fill="#b0c6ff" stroke="#10141a" strokeWidth="2" />
                    <circle cx="260" cy="220" r="5" fill="#40e56c" stroke="#10141a" strokeWidth="2" />
                  </svg>
                  <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,20,26,0.85)', border: '1px solid rgba(66,70,85,0.6)' }}>Southwark · 1.2 km</div>
                  <Link href="/map" style={{ position: 'absolute', top: 12, right: 12, fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,20,26,0.85)', border: '1px solid rgba(176,198,255,0.4)', color: '#b0c6ff', textDecoration: 'none' }}>Full map →</Link>
                </div>
                <div style={{ padding: 16, borderTop: '1px solid #424655', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: '#40e56c' }}>4</div><div style={{ fontSize: 11, color: '#8c90a1' }}>Results</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: '#b0c6ff' }}>3</div><div style={{ fontSize: 11, color: '#8c90a1' }}>Tier 3</div></div>
                </div>
              </div>
              <div className="bento" style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: '#c2c6d8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#b0c6ff', marginTop: 2, flexShrink: 0 }}>visibility_off</span>
                <p style={{ margin: 0 }}>Full names are hidden. You&apos;ll only see role, area, and availability. Contact happens at the aid hub.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
