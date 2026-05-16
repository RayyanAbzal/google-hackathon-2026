'use client'

import { useState } from 'react'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import { useSidebar } from '@/components/civic/SidebarProvider'

interface Result {
  icon: string
  iconColor: string
  title: string
  sub: string
  dist: string
  avail: string
  availColor: string
  tierLabel: string
  tierColor: string
  tierBg: string
  note: string
  isHub?: boolean
  category: string
  borough: string
}

const ALL_RESULTS: Result[] = [
  // Southwark - Medical
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', dist: '0.4 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: "At Guy's · 12 min wait", category: 'Doctor', borough: 'Southwark' },
  { icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Paediatrics', dist: '0.7 km', avail: 'From 2:00 pm', availColor: '#fbbf24', tierLabel: 'Tier 2', tierColor: '#b0c6ff', tierBg: 'rgba(176,198,255,0.1)', note: 'House calls available', category: 'Doctor', borough: 'Southwark' },
  { icon: 'local_hospital', iconColor: '#40e56c', title: "Guy's Aid Hub", sub: 'A&E · Paediatrics · Pharmacy', dist: '0.3 km', avail: '4 doctors on-site', availColor: '#40e56c', tierLabel: 'Hub', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'Wait time · 12 min', isHub: true, category: 'Doctor', borough: 'Southwark' },
  { icon: 'medication', iconColor: '#40e56c', title: 'Verified Pharmacist', sub: 'Emergency dispensing', dist: '0.6 km', avail: 'Open now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'Walk-in welcome', category: 'Nurse', borough: 'Southwark' },
  { icon: 'health_and_safety', iconColor: '#40e56c', title: 'Verified Nurse', sub: 'A&E · Triage', dist: '0.4 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: "Co-located at Guy's", category: 'Nurse', borough: 'Southwark' },
  // Southwark - Legal
  { icon: 'balance', iconColor: '#40e56c', title: 'Verified Lawyer', sub: 'Housing · Tenancy', dist: '0.8 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'Pro bono · emergency', category: 'Lawyer', borough: 'Southwark' },
  { icon: 'gavel', iconColor: '#b0c6ff', title: 'Verified Lawyer', sub: 'Benefits · Welfare', dist: '1.1 km', avail: 'From 11:00 am', availColor: '#fbbf24', tierLabel: 'Tier 2', tierColor: '#b0c6ff', tierBg: 'rgba(176,198,255,0.1)', note: 'Welfare rights', category: 'Lawyer', borough: 'Southwark' },
  // Southwark - Engineering
  { icon: 'engineering', iconColor: '#40e56c', title: 'Structural Engineer', sub: 'Buildings · Safety', dist: '0.5 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'Inspections', category: 'Engineer', borough: 'Southwark' },
  // Lambeth
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', dist: '0.9 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'At Brixton Hub · 8 min wait', category: 'Doctor', borough: 'Lambeth' },
  { icon: 'balance', iconColor: '#40e56c', title: 'Verified Lawyer', sub: 'Immigration · Asylum', dist: '0.5 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'Pro bono · urgent cases', category: 'Lawyer', borough: 'Lambeth' },
  // Hackney
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', dist: '1.0 km', avail: 'Available now', availColor: '#40e56c', tierLabel: 'Tier 3', tierColor: '#40e56c', tierBg: 'rgba(64,229,108,0.1)', note: 'At Hackney Hub', category: 'Doctor', borough: 'Hackney' },
  { icon: 'engineering', iconColor: '#b0c6ff', title: 'Electrical Engineer', sub: 'Grid · Restore', dist: '0.7 km', avail: 'From 3:00 pm', availColor: '#fbbf24', tierLabel: 'Tier 2', tierColor: '#b0c6ff', tierBg: 'rgba(176,198,255,0.1)', note: 'HV certified', category: 'Engineer', borough: 'Hackney' },
]

const PROFESSIONS = ['Doctor', 'Nurse', 'Engineer', 'Lawyer']
const BOROUGHS = ['Southwark', 'Lambeth', 'Hackney']

export default function FindPage() {
  const { width: sidebarWidth } = useSidebar()
  const [query, setQuery] = useState('Doctor in Southwark')
  const [activeProf, setActiveProf] = useState('Doctor')
  const [activeBorough, setActiveBorough] = useState('Southwark')
  const [activeAvail, setActiveAvail] = useState('Now')

  const results = ALL_RESULTS.filter(r =>
    r.category === activeProf && r.borough === activeBorough
  ).slice(0, 4)

  const tier3Count = results.filter(r => r.tierLabel === 'Tier 3').length

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar authMode="public" />
      <Sidebar active="find" mode="public" />

      <main style={{ marginLeft: sidebarWidth, padding: '80px 36px 36px 36px', transition: 'margin-left 0.2s ease' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', paddingTop: 8, paddingBottom: 32 }}>
            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Find verified help nearby.</h1>
            <p style={{ color: '#c2c6d8', fontSize: 15, margin: 0 }}>Every listing is verified by the community. No account needed.</p>
          </div>

          {/* Search */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, background: '#181c22' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#8c90a1', marginLeft: 8 }}>search</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What do you need help with?"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: '#dfe2eb', padding: '8px 0' }}
            />
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.35)', borderRadius: 8, color: '#b0c6ff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="search" size={16} /> Search
            </button>
          </div>

          {/* Filters */}
          <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', background: '#181c22' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>Profession:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {PROFESSIONS.map(p => (
                  <button key={p} onClick={() => setActiveProf(p)} style={{ padding: '5px 12px', borderRadius: 9999, background: activeProf === p ? 'rgba(176,198,255,0.1)' : '#1c2026', border: `1px solid ${activeProf === p ? '#b0c6ff' : '#424655'}`, color: activeProf === p ? '#b0c6ff' : '#c2c6d8', fontSize: 12, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>Area:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {BOROUGHS.map(b => (
                  <button key={b} onClick={() => setActiveBorough(b)} style={{ padding: '5px 12px', borderRadius: 9999, background: activeBorough === b ? 'rgba(176,198,255,0.1)' : '#1c2026', border: `1px solid ${activeBorough === b ? '#b0c6ff' : '#424655'}`, color: activeBorough === b ? '#b0c6ff' : '#c2c6d8', fontSize: 12, cursor: 'pointer' }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>Available:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Now', 'Today'].map(a => (
                  <button key={a} onClick={() => setActiveAvail(a)} style={{ padding: '5px 12px', borderRadius: 9999, background: activeAvail === a ? 'rgba(176,198,255,0.1)' : '#1c2026', border: `1px solid ${activeAvail === a ? '#b0c6ff' : '#424655'}`, color: activeAvail === a ? '#b0c6ff' : '#c2c6d8', fontSize: 12, cursor: 'pointer' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results + map */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

            {/* Result cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
              {results.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: '#8c90a1' }}>
                  No results for {activeProf} in {activeBorough}
                </div>
              ) : results.map((r, i) => (
                <article key={i} style={{ border: '1px solid #424655', borderRadius: 12, padding: 20, background: '#181c22' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${r.iconColor}18`, border: `1px solid ${r.iconColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.iconColor }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{r.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 2 }}>{r.sub}</div>
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 9999, background: r.tierBg, border: `1px solid ${r.tierColor}55`, color: r.tierColor, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0, marginLeft: 8 }}>
                      {r.tierLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: '#8c90a1', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                    {r.dist}
                    <span style={{ color: '#424655' }}>·</span>
                    <span style={{ color: r.availColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.availColor, display: 'inline-block', boxShadow: `0 0 6px ${r.availColor}` }} />
                      {r.avail}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(66,70,85,0.6)' }}>
                    <div style={{ fontSize: 12, color: '#8c90a1' }}>{r.note}</div>
                    <button style={{ fontSize: 13, color: '#b0c6ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Details →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Mini map + privacy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ border: '1px solid #424655', borderRadius: 12, overflow: 'hidden', background: '#181c22' }}>
                <div style={{ position: 'relative', height: 240, background: '#0a0e14', backgroundImage: 'linear-gradient(to right, rgba(66,70,85,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(66,70,85,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice">
                    <path d="M-20 140 Q 50 110 140 135 T 340 120 L 400 120 L 400 155 Q 340 165 240 148 T 50 165 L -20 185 Z" fill="#181c22" stroke="#262a31" />
                    <circle cx="160" cy="170" r="12" fill="#b0c6ff" opacity="0.15" />
                    <circle cx="160" cy="170" r="5" fill="#b0c6ff" stroke="#10141a" strokeWidth="1.5" />
                    <circle cx="140" cy="150" r="5" fill="#40e56c" stroke="#10141a" strokeWidth="1.5" />
                    <circle cx="200" cy="190" r="5" fill="#40e56c" stroke="#10141a" strokeWidth="1.5" />
                    <circle cx="120" cy="195" r="4" fill="#b0c6ff" stroke="#10141a" strokeWidth="1.5" />
                    <circle cx="230" cy="210" r="4" fill="#40e56c" stroke="#10141a" strokeWidth="1.5" />
                  </svg>
                  <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(24,28,34,0.85)', border: '1px solid rgba(66,70,85,0.6)' }}>
                    {activeBorough} · 1.2 km
                  </div>
                  <a href="/map" style={{ position: 'absolute', top: 10, right: 10, fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(24,28,34,0.85)', border: '1px solid rgba(176,198,255,0.4)', color: '#b0c6ff', textDecoration: 'none' }}>
                    Full map →
                  </a>
                </div>
                <div style={{ padding: 16, borderTop: '1px solid #424655', display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#40e56c' }}>{results.length}</div>
                    <div style={{ fontSize: 11, color: '#8c90a1' }}>Results</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#b0c6ff' }}>{tier3Count}</div>
                    <div style={{ fontSize: 11, color: '#8c90a1' }}>Tier 3</div>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid #424655', borderRadius: 12, padding: 20, background: '#181c22', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#b0c6ff', marginTop: 2, flexShrink: 0 }}>visibility_off</span>
                <p style={{ fontSize: 13, color: '#8c90a1', margin: 0, lineHeight: 1.5 }}>
                  Full names are hidden. You&apos;ll only see role, area, and availability. Contact happens at the aid hub.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
