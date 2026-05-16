'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useSidebar } from '@/components/civic/SidebarProvider'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import type { MapPOI, MapUser } from '@/components/map/map-data'
import { FALLBACK_USERS, USE_FALLBACKS } from '@/lib/fallbacks'
import { supabase } from '@/lib/supabase'

const HeatMap = dynamic(() => import('@/components/map/HeatMap').then(m => m.HeatMap), { ssr: false })

const CATEGORIES = ['Medical', 'Legal', 'Engineering', 'Trades']
const BOROUGHS = ['Southwark', 'Lambeth', 'Hackney']
const STATUSES = ['Available now', 'Today']

interface Result {
  refCode: string
  icon: string
  iconColor: string
  title: string
  sub: string
  dist: string
  avail: string
  availColor: string
  tier: string
  tierColor: string
  note: string
  featured?: boolean
  category: string
  subCategory: string
  borough: string
  prof: string
  detail: string
  contact: string
}

const ALL_RESULTS: Result[] = [
  // Medical - Doctors - Southwark
  { refCode: 'SE1·001', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'General · Adult', dist: '0.4 km · SE1', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: "At Guy's · 12 min wait", featured: true, category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Southwark', prof: 'Doctor', detail: 'General practitioner with 8 years experience. Specialises in post-disaster triage and adult primary care.', contact: "Report to Guy's Aid Hub reception desk. Bring your CivicTrust ID." },
  { refCode: 'SE1·002', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Paediatrics', dist: '0.7 km · SE1', avail: 'From 2:00 pm', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'House calls available', category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Southwark', prof: 'Doctor', detail: 'Paediatric specialist. Available for house calls within 1.5 km radius.', contact: 'Contact Southwark Aid Hub to arrange a house call.' },
  { refCode: 'SE1·004', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'General · Adult', dist: '1.1 km · SE1', avail: 'Available now', availColor: '#b0c6ff', tier: 'T2', tierColor: '#b0c6ff', note: '7 vouches · 1 gov', category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Southwark', prof: 'Doctor', detail: 'General practitioner, Southwark station.', contact: 'Southwark Aid Hub.' },
  { refCode: 'SE1·007', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Geriatrics', dist: '1.3 km · SE1', avail: 'From 4:00 pm', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'Care-home triage', category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Southwark', prof: 'Doctor', detail: 'Geriatric specialist focused on elderly patients.', contact: 'Book through Southwark Aid Hub coordinator.' },
  // Medical - Nursing - Southwark
  { refCode: 'SE1·011', icon: 'health_and_safety', iconColor: '#b0c6ff', title: 'Verified Nurse', sub: 'A&E · Triage', dist: '0.4 km · SE1', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: "Co-located at Guy's", category: 'Medical', subCategory: 'MEDICAL · NURSING & PHARMACY', borough: 'Southwark', prof: 'Nurse', detail: "A&E triage nurse with critical care certification. Co-located with Guy's Aid Hub.", contact: "Guy's Aid Hub triage entrance." },
  { refCode: 'SE1·012', icon: 'health_and_safety', iconColor: '#b0c6ff', title: 'Verified Nurse', sub: 'Community · Home visits', dist: '1.2 km · SE1', avail: 'From 1:00 pm', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: '2 km radius', category: 'Medical', subCategory: 'MEDICAL · NURSING & PHARMACY', borough: 'Southwark', prof: 'Nurse', detail: 'Community nurse accepting home visits. Covers Southwark and northern Lambeth.', contact: 'Request via Southwark Aid Hub.' },
  { refCode: 'SE1·021', icon: 'medication', iconColor: '#b0c6ff', title: 'Verified Pharmacist', sub: 'Emergency dispensing', dist: '0.6 km · SE1', avail: 'Open now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Walk-in welcome', featured: true, category: 'Medical', subCategory: 'MEDICAL · NURSING & PHARMACY', borough: 'Southwark', prof: 'Nurse', detail: 'Emergency pharmacist. Can dispense critical medication.', contact: 'Walk in to Southwark dispensary on Borough Road.' },
  { refCode: 'SE1·023', icon: 'medication', iconColor: '#b0c6ff', title: 'Verified Pharmacist', sub: 'Pre-booked refills', dist: '1.8 km · SE1', avail: 'From 11:00 am', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'Coord. via hub', category: 'Medical', subCategory: 'MEDICAL · NURSING & PHARMACY', borough: 'Southwark', prof: 'Nurse', detail: 'Pharmacist for pre-booked medication refills.', contact: 'Coordinate via aid hub.' },
  // Legal - Southwark
  { refCode: 'SE1·101', icon: 'balance', iconColor: '#b0c6ff', title: 'Verified Lawyer', sub: 'Housing · Tenancy', dist: '0.8 km · SE1', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Pro bono · emergency', category: 'Legal', subCategory: 'LEGAL · HOUSING & WELFARE', borough: 'Southwark', prof: 'Lawyer', detail: 'Housing solicitor offering pro bono emergency advice for displaced residents.', contact: "Guy's Aid Hub, legal desk." },
  { refCode: 'SE1·102', icon: 'gavel', iconColor: '#b0c6ff', title: 'Verified Lawyer', sub: 'Benefits · Welfare', dist: '1.1 km · SE1', avail: 'From 11:00 am', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'Welfare rights', category: 'Legal', subCategory: 'LEGAL · HOUSING & WELFARE', borough: 'Southwark', prof: 'Lawyer', detail: 'Welfare rights solicitor helping residents access emergency benefits.', contact: 'Book at Southwark Aid Hub legal clinic.' },
  { refCode: 'SE1·104', icon: 'balance', iconColor: '#b0c6ff', title: 'Verified Lawyer', sub: 'Immigration · Asylum', dist: '1.6 km · SE1', avail: 'From 3:00 pm', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'Pro bono · urgent', category: 'Legal', subCategory: 'LEGAL · HOUSING & WELFARE', borough: 'Southwark', prof: 'Lawyer', detail: 'Immigration lawyer supporting asylum seekers. Urgent cases prioritised.', contact: 'Southwark Aid Hub, immigration desk.' },
  // Engineering - Southwark
  { refCode: 'SE1·201', icon: 'engineering', iconColor: '#b0c6ff', title: 'Structural Engineer', sub: 'Buildings · Safety', dist: '0.5 km · SE1', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Inspections', category: 'Engineering', subCategory: 'ENGINEERING · STRUCTURAL & UTILITIES', borough: 'Southwark', prof: 'Engineer', detail: 'Structural engineer assessing building safety. Can certify safe entry or condemn structures.', contact: 'Request inspection via Southwark Aid Hub coordinator.' },
  { refCode: 'SE1·202', icon: 'power', iconColor: '#b0c6ff', title: 'Electrical Engineer', sub: 'Grid · Restore', dist: '1.0 km · SE1', avail: 'From 3:00 pm', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'HV certified', category: 'Engineering', subCategory: 'ENGINEERING · STRUCTURAL & UTILITIES', borough: 'Southwark', prof: 'Engineer', detail: 'Electrical engineer supporting emergency grid restoration.', contact: 'Contact through Southwark council emergency line.' },
  { refCode: 'SE1·204', icon: 'plumbing', iconColor: '#b0c6ff', title: 'Water Engineer', sub: 'Pipes · Sanitation', dist: '0.9 km · SE1', avail: 'Available now', availColor: '#b0c6ff', tier: 'T2', tierColor: '#b0c6ff', note: 'Safety assessments', category: 'Engineering', subCategory: 'ENGINEERING · STRUCTURAL & UTILITIES', borough: 'Southwark', prof: 'Engineer', detail: 'Water systems engineer assessing pipe integrity and coordinating clean water distribution.', contact: 'Southwark Aid Hub, utilities team.' },
  // Lambeth
  { refCode: 'SW9·001', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'General · Adult', dist: '0.9 km · SW9', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'At Brixton Hub · 8 min wait', category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Lambeth', prof: 'Doctor', detail: 'General practitioner, Lambeth station.', contact: 'Brixton Aid Hub, Coldharbour Lane entrance.' },
  { refCode: 'SW9·002', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'Geriatrics', dist: '1.1 km · SW9', avail: 'From 4:00 pm', availColor: '#fbbf24', tier: 'T2', tierColor: '#b0c6ff', note: 'Elderly care specialist', category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Lambeth', prof: 'Doctor', detail: 'Geriatric specialist focused on elderly patients.', contact: 'Book through Lambeth Aid Hub coordinator.' },
  { refCode: 'SW9·011', icon: 'health_and_safety', iconColor: '#b0c6ff', title: 'Verified Nurse', sub: 'Paediatric · ICU', dist: '0.6 km · SW9', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Brixton Hub · on-site', category: 'Medical', subCategory: 'MEDICAL · NURSING & PHARMACY', borough: 'Lambeth', prof: 'Nurse', detail: 'Paediatric ICU nurse at Brixton Aid Hub.', contact: 'Brixton Aid Hub, paediatrics wing.' },
  { refCode: 'SW9·101', icon: 'balance', iconColor: '#b0c6ff', title: 'Verified Lawyer', sub: 'Immigration · Asylum', dist: '0.5 km · SW9', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Pro bono · urgent cases', category: 'Legal', subCategory: 'LEGAL · HOUSING & WELFARE', borough: 'Lambeth', prof: 'Lawyer', detail: 'Immigration lawyer supporting asylum seekers.', contact: 'Brixton Aid Hub, immigration desk.' },
  { refCode: 'SW9·201', icon: 'engineering', iconColor: '#b0c6ff', title: 'Civil Engineer', sub: 'Roads · Infrastructure', dist: '0.7 km · SW9', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Road clearance ops', category: 'Engineering', subCategory: 'ENGINEERING · STRUCTURAL & UTILITIES', borough: 'Lambeth', prof: 'Engineer', detail: 'Civil engineer coordinating road clearance and infrastructure repair.', contact: 'Lambeth Aid Hub operations desk.' },
  // Hackney
  { refCode: 'E8·001', icon: 'stethoscope', iconColor: '#b0c6ff', title: 'Verified Doctor', sub: 'General · Adult', dist: '0.5 km · E8', avail: 'Available now', availColor: '#b0c6ff', tier: 'T3', tierColor: '#b0c6ff', note: 'Hackney Hub · 20 min wait', category: 'Medical', subCategory: 'MEDICAL · DOCTORS', borough: 'Hackney', prof: 'Doctor', detail: 'General practitioner at Hackney Aid Hub.', contact: 'Hackney Aid Hub, Mare Street.' },
  { refCode: 'E8·011', icon: 'health_and_safety', iconColor: '#b0c6ff', title: 'Verified Nurse', sub: 'Mental Health', dist: '0.8 km · E8', avail: 'Available now', availColor: '#b0c6ff', tier: 'T2', tierColor: '#b0c6ff', note: 'Mental health triage', category: 'Medical', subCategory: 'MEDICAL · NURSING & PHARMACY', borough: 'Hackney', prof: 'Nurse', detail: 'Mental health nurse providing crisis support.', contact: 'Hackney Aid Hub, welfare wing.' },
  { refCode: 'E8·201', icon: 'plumbing', iconColor: '#b0c6ff', title: 'Water Engineer', sub: 'Pipes · Sanitation', dist: '0.6 km · E8', avail: 'Available now', availColor: '#b0c6ff', tier: 'T2', tierColor: '#b0c6ff', note: 'Water safety assessments', category: 'Engineering', subCategory: 'ENGINEERING · STRUCTURAL & UTILITIES', borough: 'Hackney', prof: 'Engineer', detail: 'Water systems engineer assessing pipe integrity.', contact: 'Hackney Aid Hub, utilities team.' },
]

const POIS: MapPOI[] = [
  { borough: 'Southwark', type: 'aid_hub', label: "Guy's Aid Hub" },
  { borough: 'Lambeth', type: 'aid_hub', label: 'Brixton Aid Centre' },
  { borough: 'Hackney', type: 'aid_hub', label: 'Hackney Aid Hub' },
  { borough: 'Westminster', type: 'aid_hub', label: 'NHS Emergency HQ' },
  { borough: 'Camden', type: 'aid_hub', label: 'UCH Field Station' },
]

interface YPListingProps {
  refCode: string
  icon: string
  iconColor: string
  title: string
  sub: string
  dist: string
  avail: string
  availColor: string
  tier: string
  tierColor: string
  note: string
  featured?: boolean
  onDetails: () => void
}

function YPListing({ refCode, icon, iconColor, title, sub, dist, avail, availColor, tier, tierColor, note, featured, onDetails }: YPListingProps) {
  return (
    <div
      onClick={onDetails}
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 32px 1fr 88px 108px 40px',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderTop: '1px solid rgba(66,70,85,0.4)',
        background: featured ? 'rgba(176,198,255,0.04)' : 'transparent',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    >
      {featured && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#b0c6ff' }} />}

      <div className="mono" style={{ fontSize: 10, color: '#8c90a1', letterSpacing: '0.05em' }}>{refCode}</div>

      <div style={{ width: 30, height: 30, borderRadius: 6, background: `${iconColor}18`, border: `1px solid ${iconColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: iconColor }}>{icon}</span>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          {featured && (
            <span className="mono" style={{ fontSize: 9, padding: '2px 5px', background: '#b0c6ff', color: '#002d6f', borderRadius: 3, letterSpacing: '0.08em', fontWeight: 700 }}>FEATURED</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 1 }}>{sub} · {note}</div>
      </div>

      <div className="mono" style={{ fontSize: 10, color: '#c2c6d8', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 3 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#8c90a1' }}>location_on</span>
        {dist}
      </div>

      <div style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, color: availColor }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: availColor, boxShadow: `0 0 5px ${availColor}`, display: 'inline-block', flexShrink: 0 }} />
        {avail}
      </div>

      <span className="mono" style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: tierColor, background: `${tierColor}1a`, border: `1px solid ${tierColor}50`, textAlign: 'center' }}>{tier}</span>
    </div>
  )
}

interface YPSectionProps {
  title: string
  count: number
  children: React.ReactNode
}

function YPSection({ title, count, children }: YPSectionProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '9px 14px', background: '#0a0e14', border: '1px solid rgba(66,70,85,0.55)', borderBottom: 'none' }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#dfe2eb', letterSpacing: '0.12em' }}>{title}</span>
        <span className="meta">{count} LISTINGS</span>
      </div>
      <div style={{ border: '1px solid rgba(66,70,85,0.55)', background: '#181c22' }}>
        {children}
      </div>
    </div>
  )
}

const VERIFIED_TIERS = ['verified', 'trusted', 'gov_official'] as const

export default function FindPage() {
  const [activeCategory, setActiveCategory] = useState('Medical')
  const [activeBorough, setActiveBorough] = useState('Southwark')
  const [activeStatus, setActiveStatus] = useState('Available now')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Result | null>(null)
  const { width: sidebarWidth } = useSidebar()

  const [mapUsers, setMapUsers] = useState<MapUser[]>(USE_FALLBACKS ? (FALLBACK_USERS as MapUser[]) : [])

  const fetchUsers = useCallback(async () => {
    if (USE_FALLBACKS) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('node_id, username, display_name, borough, skill, tier')
        .in('tier', [...VERIFIED_TIERS])
      if (error) throw error
      setMapUsers((data ?? []) as MapUser[])
    } catch {
      setMapUsers(FALLBACK_USERS as MapUser[])
    }
  }, [])

  useEffect(() => { void fetchUsers() }, [fetchUsers])

  const filtered = ALL_RESULTS.filter(r => {
    const catMatch = r.category === activeCategory
    const boroughMatch = r.borough === activeBorough
    const statusMatch = activeStatus === 'Available now' ? r.availColor === '#b0c6ff' : true
    if (search.trim()) {
      const q = search.toLowerCase()
      return catMatch && boroughMatch && statusMatch &&
        (r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.note.toLowerCase().includes(q))
    }
    return catMatch && boroughMatch && statusMatch
  })

  const bySubCategory = filtered.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.subCategory]) acc[r.subCategory] = []
    acc[r.subCategory].push(r)
    return acc
  }, {})

  const counts = {
    Medical: ALL_RESULTS.filter(r => r.category === 'Medical' && r.borough === activeBorough).length,
    Legal: ALL_RESULTS.filter(r => r.category === 'Legal' && r.borough === activeBorough).length,
    Engineering: ALL_RESULTS.filter(r => r.category === 'Engineering' && r.borough === activeBorough).length,
    Trades: 0,
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="find" />

      <main style={{ marginLeft: sidebarWidth, paddingTop: 56, transition: 'margin-left 0.2s ease' }}>
        <div style={{ padding: '24px 28px 32px' }}>

          {/* Masthead */}
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1 }}>The Yellow Pages.</h1>
            <p style={{ color: '#8c90a1', fontSize: 13, margin: 0 }}>Every verified doctor, nurse, engineer and lawyer — pinned to the map.</p>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', background: '#181c22', border: '1px solid #424655', borderRadius: 8, gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8c90a1' }}>search</span>
              <input
                placeholder="Search by role, specialty or note…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#dfe2eb', fontSize: 14, padding: '10px 0', fontFamily: 'inherit' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: '#8c90a1', cursor: 'pointer', lineHeight: 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
            </div>
            <button
              style={{ padding: '0 18px', background: '#b0c6ff', color: '#002d6f', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, padding: '10px 14px', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 8, background: '#181c22', alignItems: 'center' }}>
            {/* Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="meta" style={{ minWidth: 60 }}>CATEGORY</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: 'none',
                      background: c === activeCategory ? 'rgba(176,198,255,0.15)' : 'rgba(66,70,85,0.3)',
                      color: c === activeCategory ? '#b0c6ff' : '#8c90a1',
                      outline: c === activeCategory ? '1px solid rgba(176,198,255,0.5)' : '1px solid transparent',
                    }}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div style={{ width: 1, height: 20, background: 'rgba(66,70,85,0.6)' }} />

            {/* Borough */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="meta" style={{ minWidth: 50 }}>BOROUGH</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {BOROUGHS.map(b => (
                  <button
                    key={b}
                    onClick={() => setActiveBorough(b)}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: 'none',
                      background: b === activeBorough ? 'rgba(176,198,255,0.15)' : 'rgba(66,70,85,0.3)',
                      color: b === activeBorough ? '#b0c6ff' : '#8c90a1',
                      outline: b === activeBorough ? '1px solid rgba(176,198,255,0.5)' : '1px solid transparent',
                    }}
                  >{b}</button>
                ))}
              </div>
            </div>

            <div style={{ width: 1, height: 20, background: 'rgba(66,70,85,0.6)' }} />

            {/* Availability */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="meta" style={{ minWidth: 50 }}>STATUS</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveStatus(s)}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: 'none',
                      background: s === activeStatus ? 'rgba(176,198,255,0.12)' : 'rgba(66,70,85,0.3)',
                      color: s === activeStatus ? '#b0c6ff' : '#8c90a1',
                      outline: s === activeStatus ? '1px solid rgba(176,198,255,0.4)' : '1px solid transparent',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <span className="meta">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Main: map + scrollable results */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 16, alignItems: 'flex-start' }}>

            {/* MAP COLUMN — sticky */}
            <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative', height: 480, border: '1px solid rgba(66,70,85,0.5)', borderRadius: 10, overflow: 'hidden', background: '#0a0e14' }}>
                <HeatMap
                  users={mapUsers}
                  pois={POIS}
                  selectedBorough={activeBorough}
                  activeSkill="All"
                  onBoroughClick={(name) => { if (BOROUGHS.includes(name)) setActiveBorough(name) }}
                />

                <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '7px 12px', background: 'rgba(16,20,26,0.92)', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 6, zIndex: 500, pointerEvents: 'none' }}>
                  <span className="meta">DENSITY HEATMAP</span>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>Verified people nearby</div>
                </div>
              </div>

              {/* At-a-glance counts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 8, overflow: 'hidden' }}>
                {([
                  ['MEDICAL', counts.Medical, '#b0c6ff'],
                  ['LEGAL', counts.Legal, '#b0c6ff'],
                  ['ENGIN.', counts.Engineering, '#b0c6ff'],
                  ['TRADES', counts.Trades, '#8c90a1'],
                ] as const).map(([l, n, c], i, arr) => (
                  <div key={l} style={{ padding: '10px 12px', background: '#181c22', borderRight: i < arr.length - 1 ? '1px solid rgba(66,70,85,0.5)' : 'none' }}>
                    <span className="meta">{l}</span>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: c, marginTop: 2, letterSpacing: '-0.02em' }}>
                      {String(n).padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SCROLLABLE RESULTS COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingTop: 14, paddingRight: 2 }}>

              {/* Featured aid hub */}
              <div style={{ border: '2px solid #b0c6ff', borderRadius: 8, padding: 16, background: 'rgba(176,198,255,0.04)', marginBottom: 16, position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: -10, left: 14, padding: '2px 8px', background: '#b0c6ff', color: '#002d6f', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', borderRadius: 3 }}>
                  AID HUB · NEAREST
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(176,198,255,0.1)', border: '1px solid #b0c6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#b0c6ff' }}>local_hospital</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>
                      {"Guy's Aid Hub"}
                      <span className="mono" style={{ fontSize: 11, color: '#8c90a1', fontWeight: 400, marginLeft: 6 }}>· REF SE1-A-001</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: '#c2c6d8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                        Borough Rd · 0.3 km · 4 min walk
                      </span>
                      <span style={{ color: '#b0c6ff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#b0c6ff', display: 'inline-block' }} />
                        4 doctors · 2 nurses · 1 pharmacist on-site
                      </span>
                    </div>
                  </div>
                  <button style={{ padding: '8px 14px', background: '#b0c6ff', color: '#002d6f', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Walk to hub →
                  </button>
                </div>
              </div>

              {/* YP sections — scrollable */}
              {Object.entries(bySubCategory).map(([subCat, rows]) => (
                <YPSection key={subCat} title={subCat} count={rows.length}>
                  {rows.map(r => (
                    <YPListing
                      key={r.refCode}
                      refCode={r.refCode}
                      icon={r.icon}
                      iconColor={r.iconColor}
                      title={r.title}
                      sub={r.sub}
                      dist={r.dist}
                      avail={r.avail}
                      availColor={r.availColor}
                      tier={r.tier}
                      tierColor={r.tierColor}
                      note={r.note}
                      featured={r.featured}
                      onDetails={() => setSelected(r)}
                    />
                  ))}
                </YPSection>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14, border: '1px solid rgba(66,70,85,0.5)', borderRadius: 8 }}>
                  No verified {activeCategory.toLowerCase()} listings in {activeBorough}{search ? ` matching "${search}"` : ''}.
                </div>
              )}

              {/* Privacy note */}
              <div style={{ marginTop: 12, padding: 12, border: '1px dashed rgba(66,70,85,0.5)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#b0c6ff', marginTop: 1, flexShrink: 0 }}>visibility_off</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Names are hidden by default.</div>
                  <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2, lineHeight: 1.5 }}>You see role, area, availability, and the hub they report to — never the person directly. Contact happens at the hub.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Details modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bento"
            style={{ maxWidth: 480, width: '100%', padding: 28, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: '#8c90a1', cursor: 'pointer', lineHeight: 1 }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: `${selected.iconColor}18`, border: `1px solid ${selected.iconColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: selected.iconColor }}>{selected.icon}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: '#c2c6d8' }}>{selected.sub}</div>
              </div>
              <span style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: selected.tierColor, background: `${selected.tierColor}1a`, border: `1px solid ${selected.tierColor}55` }}>
                {selected.tier}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c2c6d8', marginBottom: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
              {selected.dist}
              <span style={{ color: '#424655' }}>·</span>
              <span style={{ color: selected.availColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected.availColor, display: 'inline-block' }} />
                {selected.avail}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#dfe2eb', lineHeight: 1.6, marginBottom: 18 }}>{selected.detail}</p>
            <div style={{ background: 'rgba(176,198,255,0.06)', border: '1px solid rgba(176,198,255,0.2)', borderRadius: 8, padding: 14, marginBottom: 18 }}>
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
