'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSidebar } from '@/components/civic/SidebarProvider'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import type { MapUser } from '@/components/map/map-data'
import type { SkillTag, TrustTier } from '@/types'
import type { YPListingRow } from '@/app/api/find/listings/route'

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

// Maps search terms to a SkillTag so the heatmap highlights relevant density
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

const AID_HUB_LABELS: Record<string, string> = {
  Southwark: "Guy's Aid Hub", Lambeth: 'Brixton Aid Centre',
  Hackney: 'Hackney Aid Hub', Westminster: 'NHS Emergency HQ', Camden: 'UCH Field Station',
}

const LONDON_POPULATION = 9_000_000

function getAidHub(borough: string): string {
  return AID_HUB_LABELS[borough] ?? `${borough} Aid Hub`
}

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
  note: string; featured?: boolean; onDetails: () => void
}

function YPListing({ refCode, icon, iconColor, title, sub, area, avail, availColor, tierLabel, tierColor, note, featured, onDetails }: YPListingProps) {
  return (
    <div
      onClick={onDetails}
      style={{ display: 'grid', gridTemplateColumns: '80px 32px 1fr 110px 120px 44px', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: '1px solid rgba(66,70,85,0.4)', background: featured ? 'rgba(251,191,36,0.04)' : 'transparent', position: 'relative', cursor: 'pointer', transition: 'background 0.1s' }}
    >
      {featured && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#fbbf24' }} />}
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
  const [selected, setSelected] = useState<DisplayListing | null>(null)
  const { width: sidebarWidth } = useSidebar()

  useEffect(() => {
    fetch('/api/find/listings')
      .then(r => r.json() as Promise<{ success: boolean; data?: YPListingRow[] }>)
      .then(json => { if (json.success && json.data) setAllListings(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const mapUsers = useMemo((): MapUser[] =>
    allListings.map(r => ({ node_id: r.nodeId, username: r.username, borough: r.borough, skill: r.skill as SkillTag, tier: r.tier as TrustTier })),
    [allListings]
  )

  // Derive which skill the heatmap should highlight from the search string
  const mapSkill = useMemo((): SkillTag | 'All' => {
    const q = search.trim().toLowerCase()
    if (!q) return 'All'
    return SEARCH_TO_SKILL.find(([term]) => q.includes(term) || term.includes(q))?.[1] ?? 'All'
  }, [search])

  // All boroughs that have any listing (for borough chips)
  const allBoroughs = useMemo(() =>
    [...new Set(allListings.map(r => r.borough))].sort(),
    [allListings]
  )

  // Auto-select first borough when listings load
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

  // Totals across all boroughs for the map overlay
  const totalVerified = allListings.length

  // When a skill is active, show that skill's count; otherwise show top-3 category breakdown
  const skillFilteredCount = useMemo(() =>
    mapSkill === 'All' ? 0 : allListings.filter(r => r.skill === mapSkill).length,
    [allListings, mapSkill]
  )
  const totalDoctors = useMemo(() => allListings.filter(r => r.skill === 'Doctor' || r.skill === 'Nurse').length, [allListings])
  const totalEngineers = useMemo(() => allListings.filter(r => r.skill === 'Engineer').length, [allListings])
  const totalLegal = useMemo(() => allListings.filter(r => r.skill === 'Legal').length, [allListings])

  const mapHint = mapSkill !== 'All'
    ? `Showing ${mapSkill.toLowerCase()} density`
    : 'Showing all verified people'

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="find" />

      <main style={{ marginLeft: sidebarWidth, paddingTop: 56, transition: 'margin-left 0.2s ease' }}>
        <div style={{ padding: '24px 28px 32px' }}>

          {/* Header + search */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1 }}>The Yellow Pages.</h1>
            <p style={{ color: '#8c90a1', fontSize: 13, margin: '0 0 14px' }}>Every verified doctor, nurse, engineer and builder — pinned to the map.</p>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', background: '#181c22', border: '1px solid #424655', borderRadius: 8, gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8c90a1' }}>search</span>
                <input
                  placeholder="Search by role, credential or borough…"
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
            </div>
          </div>

          {/* Full-width map hero */}
          <div style={{ position: 'relative', height: 480, border: '1px solid rgba(66,70,85,0.5)', borderRadius: 10, overflow: 'hidden', background: '#0a0e14', marginBottom: 16 }}>
            <HeatMap
              users={mapUsers}
              selectedBorough={activeBorough}
              activeSkill={mapSkill}
              onBoroughClick={(name) => setActiveBorough(name)}
            />

            {/* Bottom-left: map hint — changes with search */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '7px 12px', background: 'rgba(16,20,26,0.92)', border: `1px solid ${mapSkill !== 'All' ? `${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}50` : 'rgba(66,70,85,0.5)'}`, borderRadius: 6, zIndex: 500, pointerEvents: 'none', transition: 'border-color 0.2s' }}>
              <span className="meta" style={{ color: mapSkill !== 'All' ? (SKILL_COLOR[mapSkill] ?? '#b0c6ff') : '#8c90a1' }}>
                {mapSkill !== 'All' ? mapSkill.toUpperCase() + ' DENSITY' : 'DENSITY HEATMAP'}
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{mapHint}</div>
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

          {/* Showing label + stats bar */}
          {activeBorough && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#b0c6ff' }}>location_on</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#dfe2eb' }}>{activeBorough}</span>
                <span style={{ fontSize: 13, color: '#556074' }}>·</span>
                <span style={{ fontSize: 13, color: '#8c90a1' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                {search && <span style={{ fontSize: 11, color: '#8c90a1' }}>for &ldquo;{search}&rdquo;</span>}
              </div>
              {filtered.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(['Doctor', 'Nurse'] as const).some(s => filtered.some(r => r.icon === SKILL_ICON[s])) && (
                    <span style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>stethoscope</span>
                      {filtered.filter(r => r.iconColor === SKILL_COLOR['Doctor'] || r.iconColor === SKILL_COLOR['Nurse']).length} medical
                    </span>
                  )}
                  {filtered.some(r => r.iconColor === SKILL_COLOR['Engineer']) && (
                    <span style={{ fontSize: 11, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>engineering</span>
                      {filtered.filter(r => r.iconColor === SKILL_COLOR['Engineer']).length} engineers
                    </span>
                  )}
                  {filtered.some(r => r.iconColor === SKILL_COLOR['Legal']) && (
                    <span style={{ fontSize: 11, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>balance</span>
                      {filtered.filter(r => r.iconColor === SKILL_COLOR['Legal']).length} legal
                    </span>
                  )}
                  {filtered.some(r => r.iconColor === SKILL_COLOR['Builder']) && (
                    <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>construction</span>
                      {filtered.filter(r => r.iconColor === SKILL_COLOR['Builder']).length} trades
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Listings */}
          <div>
            {loading && (
              <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14, border: '1px solid rgba(66,70,85,0.5)', borderRadius: 8 }}>Loading listings...</div>
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
                    onDetails={() => { setSelected(r); setActiveBorough(r.borough) }}
                  />
                ))}
              </YPSection>
            ))}

            {!loading && filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14, border: '1px solid rgba(66,70,85,0.5)', borderRadius: 8 }}>
                No verified listings in {activeBorough || 'this area'}{search ? ` matching "${search}"` : ''}.
              </div>
            )}

            <div style={{ marginTop: 12, padding: 12, border: '1px dashed rgba(66,70,85,0.5)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#b0c6ff', marginTop: 1, flexShrink: 0 }}>visibility_off</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Names are hidden by default.</div>
                <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2, lineHeight: 1.5 }}>You see role, area, credentials, and the hub they report to — never the person directly. Contact happens at the hub.</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal detail */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSelected(null)}
        >
          <div className="bento" style={{ maxWidth: 480, width: '100%', padding: 28, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: '#8c90a1', cursor: 'pointer', lineHeight: 1 }}>
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
              <span style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: selected.tierColor, background: `${selected.tierColor}1a`, border: `1px solid ${selected.tierColor}55` }}>{selected.tierLabel}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c2c6d8', marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
              {selected.area}
              <span style={{ color: '#424655' }}>·</span>
              <span style={{ color: selected.availColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected.availColor, display: 'inline-block' }} />{selected.avail}
              </span>
              <span style={{ color: '#424655' }}>·</span>
              <span className="mono" style={{ fontSize: 10, color: '#8c90a1' }}>Score {selected.score}</span>
            </div>

            {selected.credentials.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Verified credentials</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.credentials.map(c => (
                    <span key={c} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.25)', color: '#b0c6ff', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified</span>
                      {CREDENTIAL_LABEL[c] ?? c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(176,198,255,0.06)', border: '1px solid rgba(176,198,255,0.2)', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: '#b0c6ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>How to make contact</div>
              <p style={{ fontSize: 13, color: '#c2c6d8', margin: 0, lineHeight: 1.5 }}>Contact via {getAidHub(selected.borough)} with your CivicTrust ID. Ask for a verified {selected.title.replace('Verified ', '').toLowerCase()}.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8c90a1' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#b0c6ff' }}>verified</span>
                CivicTrust verified · {selected.claimCount} claim{selected.claimCount !== 1 ? 's' : ''}
                {selected.totalVouches > 0 && ` · ${selected.totalVouches} vouch${selected.totalVouches !== 1 ? 'es' : ''}`}
              </div>
              {selected.username && (
                <Link href={`/profile/${selected.username}`} style={{ padding: '6px 12px', background: 'rgba(176,198,255,0.12)', border: '1px solid rgba(176,198,255,0.3)', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#b0c6ff', textDecoration: 'none' }}>
                  View Profile →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
