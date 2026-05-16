'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSidebar } from '@/components/civic/SidebarProvider'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import type { MapUser } from '@/components/map/map-data'
import type { SkillTag, TrustTier } from '@/types'
import type { YPListingRow } from '@/app/api/find/listings/route'
import type { PopupListing } from '@/components/map/HeatMap'

const HeatMap = dynamic(() => import('@/components/map/HeatMap').then(m => m.HeatMap), { ssr: false })

interface DisplayListing {
  nodeId: string
  username: string | null
  refCode: string
  icon: string
  iconColor: string
  title: string
  sub: string
  note: string
  area: string
  avail: string
  availColor: string
  tierLabel: string
  tierColor: string
  subCategory: string
  borough: string
  featured: boolean
  score: number
  claimCount: number
  credentials: string[]
  totalVouches: number
}

const SEARCH_TO_SKILL: Array<[string, SkillTag]> = [
  ['doctor', 'Doctor'],
  ['nurse', 'Nurse'],
  ['engineer', 'Engineer'],
  ['legal', 'Legal'],
  ['lawyer', 'Legal'],
  ['solicitor', 'Legal'],
  ['builder', 'Builder'],
  ['construction', 'Builder'],
  ['medical', 'Doctor'],
  ['nhs', 'Nurse'],
]

const SKILL_ICON: Record<string, string> = {
  Doctor: 'stethoscope', Nurse: 'health_and_safety', Engineer: 'engineering',
  Legal: 'balance', Builder: 'construction', Other: 'person',
}

const SKILL_SUB: Record<string, string> = {
  Doctor: 'General · Adult', Nurse: 'A&E · Triage', Engineer: 'Structural · Utilities',
  Legal: 'Housing · Welfare', Builder: 'Infrastructure', Other: 'General',
}

const SKILL_SUBCATEGORY: Record<string, string> = {
  Doctor: 'MEDICAL · DOCTORS', Nurse: 'MEDICAL · NURSING',
  Engineer: 'ENGINEERING', Legal: 'LEGAL', Builder: 'TRADES', Other: 'OTHER',
}

const CREDENTIAL_LABEL: Record<string, string> = {
  degree: 'Degree', nhs_card: 'NHS card', employer_letter: 'Employer letter',
  professional_cert: 'Prof. cert',
}

const TIER_LABEL: Record<string, string> = { gov_official: 'T1', trusted: 'T2', verified: 'T3' }
const TIER_COLOR: Record<string, string> = { gov_official: '#40e56c', trusted: '#b0c6ff', verified: '#8c90a1' }

const SKILL_COLOR: Record<string, string> = {
  Doctor: '#22c55e', Nurse: '#ec4899', Engineer: '#3b82f6',
  Legal: '#a855f7', Builder: '#f59e0b', Other: '#6b7280',
}

const LONDON_POPULATION = 9_000_000

function toDisplayListing(row: YPListingRow): DisplayListing {
  const credNote = row.credentials.map(c => CREDENTIAL_LABEL[c] ?? c).join(' · ')
  const vouchNote = row.totalVouches > 0 ? `${row.totalVouches} vouch${row.totalVouches !== 1 ? 'es' : ''}` : ''
  const note = [credNote, vouchNote].filter(Boolean).join(' · ') || 'Verified member'
  const isAvailNow = row.tier === 'trusted' || row.tier === 'gov_official'
  return {
    nodeId: row.nodeId, username: row.username, refCode: row.nodeId,
    icon: SKILL_ICON[row.skill] ?? 'person', iconColor: SKILL_COLOR[row.skill] ?? '#b0c6ff',
    title: `Verified ${row.skill}`, sub: SKILL_SUB[row.skill] ?? 'General', note,
    area: row.borough, avail: isAvailNow ? 'Available now' : 'Available soon',
    availColor: isAvailNow ? '#40e56c' : '#ffc107',
    tierLabel: TIER_LABEL[row.tier] ?? 'T3', tierColor: TIER_COLOR[row.tier] ?? '#b0c6ff',
    subCategory: SKILL_SUBCATEGORY[row.skill] ?? 'OTHER', borough: row.borough,
    featured: row.tier === 'gov_official', score: row.score,
    claimCount: row.claimCount, credentials: row.credentials, totalVouches: row.totalVouches,
  }
}

interface YPListingProps {
  icon: string; iconColor: string; title: string; sub: string
  availColor: string; tierLabel: string; tierColor: string
  score: number; featured?: boolean; isActive?: boolean; onDetails: () => void
}

function YPListing({ icon, iconColor, title, sub, availColor, tierLabel, tierColor, score, featured, isActive, onDetails }: YPListingProps) {
  return (
    <div
      onClick={onDetails}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderTop: '1px solid rgba(66,70,85,0.4)',
        background: isActive ? `${iconColor}08` : (featured ? 'rgba(251,191,36,0.04)' : 'transparent'),
        cursor: 'pointer',
        transition: 'background 0.1s',
        borderLeft: isActive ? `2px solid ${iconColor}` : (featured ? `2px solid ${tierColor}` : '2px solid transparent'),
      }}
    >
      {/* Icon */}
      <div style={{ width: 30, height: 30, borderRadius: 6, background: `${iconColor}18`, border: `1px solid ${iconColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: iconColor }}>{icon}</span>
      </div>
      {/* Title + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 1 }}>{sub}</div>
      </div>
      {/* Score */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: tierColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{score}</div>
      </div>
      {/* Status dot */}
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: availColor, boxShadow: `0 0 6px ${availColor}`, display: 'inline-block', flexShrink: 0 }} />
      {/* Tier badge */}
      <span className="mono" style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: tierColor, background: `${tierColor}1a`, border: `1px solid ${tierColor}50`, textAlign: 'center', flexShrink: 0 }}>{tierLabel}</span>
    </div>
  )
}

function YPSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '9px 14px', background: '#0a0e14', border: '1px solid rgba(66,70,85,0.55)', borderBottom: 'none' }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#dfe2eb', letterSpacing: '0.12em' }}>{title}</span>
        <span className="meta">{count} LISTINGS</span>
      </div>
      <div style={{ border: '1px solid rgba(66,70,85,0.55)', background: '#181c22' }}>{children}</div>
    </div>
  )
}

export default function FindPage() {
  const [allListings, setAllListings] = useState<YPListingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeBorough, setActiveBorough] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [mapSkill, setMapSkill] = useState<SkillTag | 'All'>('All')
  const [resetMap, setResetMap] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [boroughReports, setBoroughReports] = useState<Record<string, string>>({})
  const [reportLoading, setReportLoading] = useState(false)
  const { width: sidebarWidth } = useSidebar()

  useEffect(() => {
    fetch('/api/find/listings')
      .then(r => r.json() as Promise<{ success: boolean; data?: YPListingRow[] }>)
      .then(json => { if (json.success && json.data) setAllListings(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Debounced Claude NL search
  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setMapSkill('All')
      return
    }

    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/find/interpret-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })
        const json: { skill: SkillTag | null; borough: string | null } = await res.json()

        if (json.skill) {
          setMapSkill(json.skill)
        } else {
          const lower = q.toLowerCase()
          const matched = SEARCH_TO_SKILL.find(([term]) => lower.includes(term) || term.includes(lower))
          setMapSkill(matched?.[1] ?? 'All')
        }

        if (json.borough) {
          setActiveBorough(json.borough)
          setSelectedListingId(null)
        }
      } catch {
        const lower = q.toLowerCase()
        const matched = SEARCH_TO_SKILL.find(([term]) => lower.includes(term) || term.includes(lower))
        setMapSkill(matched?.[1] ?? 'All')
      } finally {
        setSearchLoading(false)
      }
    }, 600)

    return () => {
      clearTimeout(timer)
      setSearchLoading(false)
    }
  }, [search])

  // Borough skill counts — passed to report API
  const boroughCounts = useMemo((): Record<string, number> => {
    if (!activeBorough) return {}
    return allListings
      .filter(r => r.borough === activeBorough)
      .reduce<Record<string, number>>((acc, r) => { acc[r.skill] = (acc[r.skill] ?? 0) + 1; return acc }, {})
  }, [allListings, activeBorough])

  // Fetch borough situation report (cached, abortable)
  useEffect(() => {
    if (!activeBorough || allListings.length === 0 || boroughReports[activeBorough] !== undefined) return
    const ctrl = new AbortController()
    const boroughTotal = allListings.filter(r => r.borough === activeBorough).length
    setReportLoading(true)
    fetch('/api/find/borough-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borough: activeBorough, counts: boroughCounts, total: boroughTotal }),
      signal: ctrl.signal,
    })
      .then(r => r.json() as Promise<{ report: string }>)
      .then(json => {
        if (json.report) setBoroughReports(prev => ({ ...prev, [activeBorough]: json.report }))
      })
      .catch(() => {})
      .finally(() => setReportLoading(false))
    return () => { ctrl.abort(); setReportLoading(false) }
  // boroughCounts memoized on [allListings, activeBorough] — safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBorough, boroughCounts])

  const mapUsers = useMemo((): MapUser[] =>
    allListings.map(r => ({ node_id: r.nodeId, username: r.username, borough: r.borough, skill: r.skill as SkillTag, tier: r.tier as TrustTier })),
    [allListings]
  )

  const allBoroughs = useMemo(() =>
    [...new Set(allListings.map(r => r.borough))].sort(),
    [allListings]
  )

  const filtered = useMemo((): DisplayListing[] => {
    const q = search.trim().toLowerCase()
    return allListings
      .filter(r => !activeBorough || r.borough === activeBorough)
      .filter(r => {
        if (!q) return true
        if (mapSkill !== 'All') return r.skill === mapSkill
        return r.skill.toLowerCase().includes(q) || r.borough.toLowerCase().includes(q) || r.credentials.some(c => c.toLowerCase().includes(q))
      })
      .map(toDisplayListing)
      .sort((a, b) => b.score - a.score)
  }, [allListings, activeBorough, search, mapSkill])

  const bySubCategory = useMemo(() =>
    filtered.reduce<Record<string, DisplayListing[]>>((acc, r) => { (acc[r.subCategory] ??= []).push(r); return acc }, {}),
    [filtered]
  )

  const activeListing = useMemo(
    () => filtered.find(r => r.nodeId === selectedListingId) ?? null,
    [filtered, selectedListingId]
  )

  const popupListing = useMemo((): PopupListing | null => {
    if (!activeListing) return null
    return {
      nodeId: activeListing.nodeId,
      title: activeListing.title,
      sub: activeListing.sub,
      tierLabel: activeListing.tierLabel,
      tierColor: activeListing.tierColor,
      iconColor: activeListing.iconColor,
      icon: activeListing.icon,
      score: activeListing.score,
      totalVouches: activeListing.totalVouches,
      credentials: activeListing.credentials,
      avail: activeListing.avail,
      availColor: activeListing.availColor,
      borough: activeListing.borough,
      username: activeListing.username,
    }
  }, [activeListing])

  const totalVerified = allListings.length
  const skillFilteredCount = useMemo(
    () => mapSkill === 'All' ? 0 : allListings.filter(r => r.skill === mapSkill).length,
    [allListings, mapSkill]
  )
  const totalDoctors = useMemo(() => allListings.filter(r => r.skill === 'Doctor' || r.skill === 'Nurse').length, [allListings])
  const totalEngineers = useMemo(() => allListings.filter(r => r.skill === 'Engineer').length, [allListings])
  const totalLegal = useMemo(() => allListings.filter(r => r.skill === 'Legal').length, [allListings])

  return (
    <div style={{ background: '#10141a', height: '100vh', color: '#dfe2eb', overflow: 'hidden' }}>
      <TopBar />
      <Sidebar active="find" />

      <main style={{ marginLeft: sidebarWidth, paddingTop: 56, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header + search */}
        <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 2px', lineHeight: 1 }}>The Yellow Pages.</h1>
          <p style={{ color: '#8c90a1', fontSize: 12, margin: '0 0 10px' }}>Every verified doctor, nurse, engineer and builder — pinned to the map.</p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', background: '#181c22', border: '1px solid #424655', borderRadius: 8, gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8c90a1' }}>search</span>
              <input
                placeholder="Search by role, credential or borough…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#dfe2eb', fontSize: 14, padding: '10px 0', fontFamily: 'inherit' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {searchLoading && (
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#8c90a1', animation: 'spin 1s linear infinite' }}>progress_activity</span>
              )}
              {search && !searchLoading && (
                <button onClick={() => { setSearch(''); setMapSkill('All') }} style={{ background: 'transparent', border: 'none', color: '#8c90a1', cursor: 'pointer', lineHeight: 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Side-by-side panels */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderTop: '1px solid rgba(66,70,85,0.4)' }}>

          {/* LEFT: Map 65% */}
          <div style={{ flex: '0 0 65%', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(66,70,85,0.4)' }}>
            <HeatMap
              users={mapUsers}
              selectedBorough={activeBorough}
              activeSkill={mapSkill}
              onBoroughClick={(name) => {
                if (name === activeBorough) {
                  setActiveBorough('')
                  setSelectedListingId(null)
                  setResetMap(true)
                  setTimeout(() => setResetMap(false), 100)
                } else {
                  setActiveBorough(name)
                  setSelectedListingId(null)
                }
              }}
              focusedBorough={activeBorough || null}
              popupListing={popupListing}
              onPopupClose={() => setSelectedListingId(null)}
              resetToOverview={resetMap}
            />

            {/* Bottom-left: map hint */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '7px 12px', background: 'rgba(16,20,26,0.92)', border: `1px solid ${mapSkill !== 'All' ? `${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}50` : 'rgba(66,70,85,0.5)'}`, borderRadius: 6, zIndex: 500, pointerEvents: 'none', transition: 'border-color 0.2s' }}>
              <span className="meta" style={{ color: mapSkill !== 'All' ? (SKILL_COLOR[mapSkill] ?? '#b0c6ff') : '#8c90a1' }}>
                {mapSkill !== 'All' ? mapSkill.toUpperCase() + ' DENSITY' : 'DENSITY HEATMAP'}
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{mapSkill !== 'All' ? `Showing ${mapSkill.toLowerCase()} density` : 'Showing all verified people'}</div>
            </div>

            {/* Bottom-right: verified counter */}
            {totalVerified > 0 && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '10px 14px', background: 'rgba(16,20,26,0.92)', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 6, zIndex: 500, pointerEvents: 'none', textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 9, color: '#8c90a1', letterSpacing: '0.1em', marginBottom: 3 }}>VERIFIED LONDONERS</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#b0c6ff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {totalVerified.toLocaleString()} <span style={{ fontSize: 13, color: '#556074', fontWeight: 400 }}>/ {LONDON_POPULATION.toLocaleString()}</span>
                </div>
                {mapSkill !== 'All' ? (
                  <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 4, textAlign: 'right' }}>
                    <span style={{ color: SKILL_COLOR[mapSkill] ?? '#b0c6ff' }}>●</span>{' '}
                    {skillFilteredCount} {mapSkill.toLowerCase()}{skillFilteredCount !== 1 ? 's' : ''} verified
                  </div>
                ) : (totalDoctors > 0 || totalEngineers > 0 || totalLegal > 0) ? (
                  <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 4, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {totalDoctors > 0 && <span><span style={{ color: '#22c55e' }}>●</span> {totalDoctors} medical</span>}
                    {totalEngineers > 0 && <span><span style={{ color: '#3b82f6' }}>●</span> {totalEngineers} engineers</span>}
                    {totalLegal > 0 && <span><span style={{ color: '#a855f7' }}>●</span> {totalLegal} legal</span>}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* RIGHT: Listings 35% */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#181c22' }}>

            {/* Borough + result count */}
            <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(66,70,85,0.4)', background: '#0a0e14', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#b0c6ff' }}>location_on</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#dfe2eb' }}>{activeBorough || 'All boroughs'}</span>
                <span style={{ fontSize: 12, color: '#556074' }}>·</span>
                <span style={{ fontSize: 12, color: '#8c90a1' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                {search && <span style={{ fontSize: 10, color: '#8c90a1' }}>for &ldquo;{search}&rdquo;</span>}
              </div>
            </div>

            {/* Borough situation report */}
            {activeBorough && (
              <div style={{ minHeight: 44, padding: '8px 14px', borderBottom: '1px solid rgba(66,70,85,0.4)', background: 'rgba(176,198,255,0.04)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#b0c6ff', marginTop: 2, flexShrink: 0 }}>smart_toy</span>
                {reportLoading || !boroughReports[activeBorough] ? (
                  <div style={{ fontSize: 11, color: '#556074', fontStyle: 'italic' }}>
                    {reportLoading ? 'Analysing coverage…' : ''}
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: '#8c90a1', margin: 0, lineHeight: 1.6 }}>{boroughReports[activeBorough]}</p>
                )}
              </div>
            )}

            {/* Scrollable listings */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading && (
                <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14 }}>Loading listings...</div>
              )}

              {!loading && Object.entries(bySubCategory).map(([subCat, rows]) => (
                <YPSection key={subCat} title={subCat} count={rows.length}>
                  {rows.map(r => (
                    <YPListing
                      key={r.nodeId}
                      icon={r.icon} iconColor={r.iconColor}
                      title={r.title} sub={r.sub}
                      availColor={r.availColor}
                      tierLabel={r.tierLabel} tierColor={r.tierColor}
                      score={r.score} featured={r.featured}
                      isActive={r.nodeId === selectedListingId}
                      onDetails={() => {
                        setSelectedListingId(r.nodeId)
                        setActiveBorough(r.borough)
                      }}
                    />
                  ))}
                </YPSection>
              ))}

              {!loading && filtered.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14 }}>
                  No verified listings in {activeBorough || 'any borough'}{search ? ` matching "${search}"` : ''}.
                </div>
              )}

              <div style={{ margin: 12, padding: 12, border: '1px dashed rgba(66,70,85,0.5)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#b0c6ff', marginTop: 1, flexShrink: 0 }}>visibility_off</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Names are hidden by default.</div>
                  <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2, lineHeight: 1.5 }}>You see role, area, credentials, and the hub they report to — never the person directly. Contact happens at the hub.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
