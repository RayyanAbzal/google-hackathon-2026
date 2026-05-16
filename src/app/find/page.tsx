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
const TIER_COLOR: Record<string, string> = { gov_official: '#fbbf24', trusted: '#b0c6ff', verified: '#b0c6ff' }

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
    availColor: isAvailNow ? '#b0c6ff' : '#fbbf24',
    tierLabel: TIER_LABEL[row.tier] ?? 'T3', tierColor: TIER_COLOR[row.tier] ?? '#b0c6ff',
    subCategory: SKILL_SUBCATEGORY[row.skill] ?? 'OTHER', borough: row.borough,
    featured: row.tier === 'gov_official', score: row.score,
    claimCount: row.claimCount, credentials: row.credentials, totalVouches: row.totalVouches,
  }
}

interface YPListingProps {
  refCode: string; icon: string; iconColor: string; title: string; sub: string
  area: string; avail: string; availColor: string; tierLabel: string; tierColor: string
  note: string; featured?: boolean; isActive?: boolean; onDetails: () => void
}

function YPListing({ refCode, icon, iconColor, title, sub, area, avail, availColor, tierLabel, tierColor, note, featured, isActive, onDetails }: YPListingProps) {
  return (
    <div
      onClick={onDetails}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 32px 1fr 110px 120px 44px',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderTop: '1px solid rgba(66,70,85,0.4)',
        background: isActive ? `${iconColor}08` : (featured ? 'rgba(251,191,36,0.04)' : 'transparent'),
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.1s',
        borderLeft: isActive ? `2px solid ${iconColor}` : (featured ? '2px solid #fbbf24' : '2px solid transparent'),
      }}
    >
      <div className="mono" style={{ fontSize: 9, color: '#8c90a1', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refCode}</div>
      <div style={{ width: 30, height: 30, borderRadius: 6, background: `${iconColor}18`, border: `1px solid ${iconColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: iconColor }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          {featured && <span className="mono" style={{ fontSize: 9, padding: '2px 5px', background: '#fbbf24', color: '#000', borderRadius: 3, letterSpacing: '0.08em', fontWeight: 700 }}>GOV</span>}
        </div>
        <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub} · {note}</div>
      </div>
      <div className="mono" style={{ fontSize: 10, color: '#c2c6d8', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 3 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#8c90a1' }}>location_on</span>{area}
      </div>
      <div style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, color: availColor }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: availColor, boxShadow: `0 0 5px ${availColor}`, display: 'inline-block', flexShrink: 0 }} />{avail}
      </div>
      <span className="mono" style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: tierColor, background: `${tierColor}1a`, border: `1px solid ${tierColor}50`, textAlign: 'center' }}>{tierLabel}</span>
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
  const [searchLoading, setSearchLoading] = useState(false)
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

  const mapUsers = useMemo((): MapUser[] =>
    allListings.map(r => ({ node_id: r.nodeId, username: r.username, borough: r.borough, skill: r.skill as SkillTag, tier: r.tier as TrustTier })),
    [allListings]
  )

  const allBoroughs = useMemo(() =>
    [...new Set(allListings.map(r => r.borough))].sort(),
    [allListings]
  )

  useEffect(() => {
    if (allBoroughs.length > 0 && !allBoroughs.includes(activeBorough)) {
      setActiveBorough(allBoroughs[0])
    }
  }, [allBoroughs, activeBorough])

  const filtered = useMemo((): DisplayListing[] => {
    const q = search.trim().toLowerCase()
    return allListings
      .filter(r => r.borough === activeBorough)
      .filter(r => !q || r.skill.toLowerCase().includes(q) || r.borough.toLowerCase().includes(q) || r.credentials.some(c => c.toLowerCase().includes(q)))
      .map(toDisplayListing)
  }, [allListings, activeBorough, search])

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
              {mapSkill !== 'All' && !searchLoading && (
                <span style={{ fontSize: 9, color: SKILL_COLOR[mapSkill] ?? '#b0c6ff', background: `${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}18`, border: `1px solid ${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}40`, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.06em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {mapSkill.toUpperCase()} · AI matched
                </span>
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
                setActiveBorough(name)
                setSelectedListingId(null)
              }}
              focusedBorough={activeListing?.borough ?? null}
              popupListing={popupListing}
              onPopupClose={() => setSelectedListingId(null)}
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
            {activeBorough && (
              <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(66,70,85,0.4)', background: '#0a0e14', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#b0c6ff' }}>location_on</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#dfe2eb' }}>{activeBorough}</span>
                  <span style={{ fontSize: 12, color: '#556074' }}>·</span>
                  <span style={{ fontSize: 12, color: '#8c90a1' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                  {search && <span style={{ fontSize: 10, color: '#8c90a1' }}>for &ldquo;{search}&rdquo;</span>}
                </div>
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
                      refCode={r.refCode} icon={r.icon} iconColor={r.iconColor}
                      title={r.title} sub={r.sub} area={r.area}
                      avail={r.avail} availColor={r.availColor}
                      tierLabel={r.tierLabel} tierColor={r.tierColor}
                      note={r.note} featured={r.featured}
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
                  No verified listings in {activeBorough || 'this area'}{search ? ` matching "${search}"` : ''}.
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
