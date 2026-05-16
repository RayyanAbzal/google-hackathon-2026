'use client'

import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/civic/TopBar'

const PROFESSIONS = ['Doctor', 'Nurse', 'Engineer', 'Lawyer']
const AREAS = ['Southwark', 'Lambeth', 'Hackney']
const AVAILABILITY = ['Now', 'Today']

interface Result {
  icon: string
  iconColor: string
  title: string
  sub: string
  tier: string
  tierLabel: string
  area: string
  borough: string
  avail: string
  availColor: string
  note: string
  prof: string
  detail: string
  contact: string
}

const ALL_RESULTS: Result[] = [
  // Doctor — Southwark
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', tier: 'tier-3-outline', tierLabel: 'Tier 3', borough: 'Southwark', area: 'Southwark · 0.4 km', avail: 'Available now', availColor: '#40e56c', note: "At Guy's Aid Hub · 12 min wait", prof: 'Doctor', detail: 'General practitioner with 8 years experience. Specialises in post-disaster triage and adult primary care.', contact: "Report to Guy's Aid Hub reception desk. Bring your CivicTrust ID." },
  { icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Paediatrics', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Southwark', area: 'Southwark · 0.7 km', avail: 'From 2:00 pm', availColor: '#fbbf24', note: 'House calls available', prof: 'Doctor', detail: 'Paediatric specialist. Available for house calls within 1.5 km radius. Pre-book via hub coordinator.', contact: 'Contact Southwark Aid Hub to arrange a house call.' },
  { icon: 'local_hospital', iconColor: '#40e56c', title: "Guy's Aid Hub", sub: 'A&E · Paediatrics · Pharmacy', tier: 'tier-3', tierLabel: 'Hub', borough: 'Southwark', area: 'Southwark · 0.3 km', avail: '4 doctors on-site', availColor: '#40e56c', note: 'Wait time · 12 min', prof: 'Doctor', detail: 'Fully staffed emergency hub. Four verified doctors, two nurses, and a pharmacist currently on-site.', contact: 'Walk in. No appointment needed.' },
  { icon: 'medication', iconColor: '#40e56c', title: 'Verified Pharmacist', sub: 'Emergency dispensing', tier: 'tier-3-outline', tierLabel: 'Tier 3', borough: 'Southwark', area: 'Southwark · 0.6 km', avail: 'Open now', availColor: '#40e56c', note: 'Walk-in welcome', prof: 'Doctor', detail: 'Emergency pharmacist. Can dispense critical medication with verified prescription. Walk-in accepted.', contact: 'Walk in to Southwark dispensary point on Borough Road.' },
  // Doctor — Lambeth
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', tier: 'tier-3-outline', tierLabel: 'Tier 3', borough: 'Lambeth', area: 'Lambeth · 0.9 km', avail: 'Available now', availColor: '#40e56c', note: 'At Brixton Aid Hub · 8 min wait', prof: 'Doctor', detail: 'General practitioner, Lambeth station. Handling walk-in adult consultations throughout the day.', contact: 'Brixton Aid Hub, Coldharbour Lane entrance.' },
  { icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Geriatrics', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Lambeth', area: 'Lambeth · 1.1 km', avail: 'From 4:00 pm', availColor: '#fbbf24', note: 'Elderly care specialist', prof: 'Doctor', detail: 'Geriatric specialist focused on elderly patients. Can coordinate care home triage.', contact: 'Book through Lambeth Aid Hub coordinator.' },
  // Doctor — Hackney
  { icon: 'stethoscope', iconColor: '#40e56c', title: 'Verified Doctor', sub: 'General · Adult', tier: 'tier-3', tierLabel: 'Tier 3', borough: 'Hackney', area: 'Hackney · 0.5 km', avail: 'Available now', availColor: '#40e56c', note: 'Hackney Hub · 20 min wait', prof: 'Doctor', detail: 'General practitioner at Hackney Aid Hub. Currently handling high volume — expect 20 min wait.', contact: 'Hackney Aid Hub, Mare Street.' },
  // Nurse — Southwark
  { icon: 'health_and_safety', iconColor: '#40e56c', title: 'Verified Nurse', sub: 'A&E · Triage', tier: 'tier-3-outline', tierLabel: 'Tier 3', borough: 'Southwark', area: 'Southwark · 0.4 km', avail: 'Available now', availColor: '#40e56c', note: "At Guy's Aid Hub", prof: 'Nurse', detail: 'A&E triage nurse with critical care certification. Co-located with Guy\'s Aid Hub doctors.', contact: "Guy's Aid Hub triage entrance." },
  { icon: 'health_and_safety', iconColor: '#b0c6ff', title: 'Verified Nurse', sub: 'Community · Home visits', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Southwark', area: 'Southwark · 1.2 km', avail: 'From 1:00 pm', availColor: '#fbbf24', note: 'Home visits within 2 km', prof: 'Nurse', detail: 'Community nurse accepting home visits for patients who cannot travel. Covers Southwark and northern Lambeth.', contact: 'Request via Southwark Aid Hub.' },
  // Nurse — Lambeth
  { icon: 'health_and_safety', iconColor: '#40e56c', title: 'Verified Nurse', sub: 'Paediatric · ICU', tier: 'tier-3', tierLabel: 'Tier 3', borough: 'Lambeth', area: 'Lambeth · 0.6 km', avail: 'Available now', availColor: '#40e56c', note: 'Brixton Aid Hub · on-site', prof: 'Nurse', detail: 'Paediatric ICU nurse. Specialist in neonatal and infant critical care at Brixton Aid Hub.', contact: 'Brixton Aid Hub, paediatrics wing.' },
  // Nurse — Hackney
  { icon: 'health_and_safety', iconColor: '#40e56c', title: 'Verified Nurse', sub: 'Mental Health', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Hackney', area: 'Hackney · 0.8 km', avail: 'Available now', availColor: '#40e56c', note: 'Mental health triage', prof: 'Nurse', detail: 'Mental health nurse providing crisis support. Trained in trauma response for disaster scenarios.', contact: 'Hackney Aid Hub, welfare wing.' },
  // Engineer — Southwark
  { icon: 'engineering', iconColor: '#40e56c', title: 'Structural Engineer', sub: 'Buildings · Safety', tier: 'tier-3-outline', tierLabel: 'Tier 3', borough: 'Southwark', area: 'Southwark · 0.5 km', avail: 'Available now', availColor: '#40e56c', note: 'Building inspections', prof: 'Engineer', detail: 'Structural engineer assessing building safety post-event. Can certify safe entry or condemn structures.', contact: 'Request inspection via Southwark Aid Hub coordinator.' },
  { icon: 'power', iconColor: '#b0c6ff', title: 'Electrical Engineer', sub: 'Grid · Emergency restore', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Southwark', area: 'Southwark · 1.0 km', avail: 'From 3:00 pm', availColor: '#fbbf24', note: 'Grid restoration work', prof: 'Engineer', detail: 'Electrical engineer supporting emergency grid restoration. Certified for high-voltage work.', contact: 'Contact through Southwark council emergency line.' },
  // Engineer — Lambeth
  { icon: 'engineering', iconColor: '#40e56c', title: 'Civil Engineer', sub: 'Roads · Infrastructure', tier: 'tier-3', tierLabel: 'Tier 3', borough: 'Lambeth', area: 'Lambeth · 0.7 km', avail: 'Available now', availColor: '#40e56c', note: 'Road clearance ops', prof: 'Engineer', detail: 'Civil engineer coordinating road clearance and infrastructure repair in Lambeth.', contact: 'Lambeth Aid Hub operations desk.' },
  // Engineer — Hackney
  { icon: 'plumbing', iconColor: '#40e56c', title: 'Water Engineer', sub: 'Pipes · Sanitation', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Hackney', area: 'Hackney · 0.6 km', avail: 'Available now', availColor: '#40e56c', note: 'Water safety assessments', prof: 'Engineer', detail: 'Water systems engineer. Assessing pipe integrity and coordinating clean water distribution.', contact: 'Hackney Aid Hub, utilities team.' },
  // Lawyer — Southwark
  { icon: 'balance', iconColor: '#40e56c', title: 'Verified Lawyer', sub: 'Housing · Tenancy', tier: 'tier-3-outline', tierLabel: 'Tier 3', borough: 'Southwark', area: 'Southwark · 0.8 km', avail: 'Available now', availColor: '#40e56c', note: 'Pro bono emergency advice', prof: 'Lawyer', detail: 'Housing solicitor offering pro bono emergency advice for displaced residents. Tenancy disputes, eviction protection.', contact: "Guy's Aid Hub, legal desk." },
  { icon: 'gavel', iconColor: '#b0c6ff', title: 'Verified Lawyer', sub: 'Benefits · Welfare', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Southwark', area: 'Southwark · 1.1 km', avail: 'From 11:00 am', availColor: '#fbbf24', note: 'Welfare rights specialist', prof: 'Lawyer', detail: 'Welfare rights solicitor helping residents access emergency benefits and government support.', contact: 'Book slot at Southwark Aid Hub legal clinic.' },
  // Lawyer — Lambeth
  { icon: 'balance', iconColor: '#40e56c', title: 'Verified Lawyer', sub: 'Immigration · Asylum', tier: 'tier-3', tierLabel: 'Tier 3', borough: 'Lambeth', area: 'Lambeth · 0.5 km', avail: 'Available now', availColor: '#40e56c', note: 'Pro bono · urgent cases', prof: 'Lawyer', detail: 'Immigration lawyer supporting asylum seekers and migrants whose documents were destroyed. Urgent cases prioritised.', contact: 'Brixton Aid Hub, immigration desk.' },
  // Lawyer — Hackney
  { icon: 'gavel', iconColor: '#40e56c', title: 'Verified Lawyer', sub: 'Employment · Contracts', tier: 'tier-2', tierLabel: 'Tier 2', borough: 'Hackney', area: 'Hackney · 0.9 km', avail: 'Available now', availColor: '#40e56c', note: 'Employment rights advice', prof: 'Lawyer', detail: 'Employment lawyer advising workers on contract disputes, unfair dismissal, and emergency wage claims.', contact: 'Hackney Aid Hub, legal wing.' },
]

export default function FindPage() {
  const [activeProf, setActiveProf] = useState('Doctor')
  const [activeArea, setActiveArea] = useState('Southwark')
  const [activeAvail, setActiveAvail] = useState('Now')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Result | null>(null)

  const filtered = ALL_RESULTS.filter(r => {
    const profMatch = r.prof === activeProf
    const areaMatch = r.borough === activeArea
    const availMatch = activeAvail === 'Now'
      ? r.availColor === '#40e56c'
      : true
    return profMatch && areaMatch && availMatch
  })

  function handleSearch() {
    const q = search.trim().toLowerCase()
    if (!q) return
    const match = PROFESSIONS.find(p => p.toLowerCase().includes(q))
    if (match) setActiveProf(match)
    const areaMatch = AREAS.find(a => a.toLowerCase().includes(q))
    if (areaMatch) setActiveArea(areaMatch)
  }

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
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-primary" style={{ flexShrink: 0 }} onClick={handleSearch}>
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
            <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
              {filtered.length === 0 && (
                <div style={{ gridColumn: 'span 2', padding: 40, textAlign: 'center', color: '#8c90a1', fontSize: 14 }}>
                  No verified {activeProf.toLowerCase()}s available in {activeArea} right now.
                </div>
              )}
              {filtered.map((r, i) => (
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
                    <button
                      style={{ fontSize: 13, color: '#b0c6ff', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                      onClick={() => setSelected(r)}
                    >
                      Details →
                    </button>
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
                  <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,20,26,0.85)', border: '1px solid rgba(66,70,85,0.6)' }}>{activeArea} · 1.2 km</div>
                  <Link href="/map" style={{ position: 'absolute', top: 12, right: 12, fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,20,26,0.85)', border: '1px solid rgba(176,198,255,0.4)', color: '#b0c6ff', textDecoration: 'none' }}>Full map →</Link>
                </div>
                <div style={{ padding: 16, borderTop: '1px solid #424655', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: '#40e56c' }}>{filtered.length}</div><div style={{ fontSize: 11, color: '#8c90a1' }}>Results</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: '#b0c6ff' }}>{filtered.filter(r => r.tier.includes('tier-3')).length}</div><div style={{ fontSize: 11, color: '#8c90a1' }}>Tier 3</div></div>
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

      {/* Details modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bento"
            style={{ maxWidth: 480, width: '100%', padding: 28, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#8c90a1', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: `${selected.iconColor}18`, border: `1px solid ${selected.iconColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected.iconColor }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{selected.icon}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.title}</div>
                <div style={{ fontSize: 13, color: '#c2c6d8' }}>{selected.sub}</div>
              </div>
              <span className={`tier-badge ${selected.tier}`} style={{ marginLeft: 'auto', fontSize: 11 }}>{selected.tierLabel}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c2c6d8', marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>location_on</span>
              {selected.area}
              <span style={{ color: '#424655' }}>·</span>
              <span style={{ color: selected.availColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="dot" style={{ background: selected.availColor, boxShadow: `0 0 6px ${selected.availColor}80` }} />
                {selected.avail}
              </span>
            </div>

            <p style={{ fontSize: 14, color: '#dfe2eb', lineHeight: 1.6, marginBottom: 20 }}>{selected.detail}</p>

            <div style={{ background: 'rgba(176,198,255,0.06)', border: '1px solid rgba(176,198,255,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#b0c6ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>How to make contact</div>
              <p style={{ fontSize: 13, color: '#c2c6d8', margin: 0, lineHeight: 1.5 }}>{selected.contact}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8c90a1' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#b0c6ff' }}>verified</span>
              Listing verified by CivicTrust community
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
