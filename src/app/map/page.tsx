'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import type { BoroughInsight, MapPOI, MapUser } from '@/components/map/map-data'
import { buildMapInsights } from '@/components/map/map-data'
import { FALLBACK_USERS, USE_FALLBACKS } from '@/lib/fallbacks'
import { supabase } from '@/lib/supabase'
import { requireSession } from '@/app/_lib/session'
import type { SkillTag } from '@/types'

const HeatMap = dynamic(() => import('@/components/map/HeatMap').then(m => m.HeatMap), { ssr: false })

const POIS: MapPOI[] = [
  { borough: 'Southwark', type: 'aid_hub', label: "King's College Hospital Aid Hub" },
  { borough: 'Westminster', type: 'aid_hub', label: 'NHS Emergency HQ' },
  { borough: 'Lambeth', type: 'aid_hub', label: 'Brixton Aid Centre' },
  { borough: 'Camden', type: 'aid_hub', label: 'UCH Field Station' },
  { borough: 'Hackney', type: 'risk_alert', label: 'Grid failure zone — limited comms' },
]

const SKILLS: Array<SkillTag | 'All'> = ['All', 'Doctor', 'Nurse', 'Engineer', 'Legal', 'Builder', 'Other']

const SKILL_COLORS: Record<string, string> = {
  All: '#8c90a1',
  Doctor: '#22c55e',
  Nurse: '#ec4899',
  Engineer: '#3b82f6',
  Legal: '#a855f7',
  Builder: '#f59e0b',
  Other: '#6b7280',
}

const VERIFIED_TIERS = ['verified', 'trusted', 'gov_official'] as const
const VERIFIED_TIERS_SET = new Set(VERIFIED_TIERS)
const LONDON_POPULATION = 9_000_000

function formatCount(value: number): string {
  return value.toLocaleString()
}

function getLeadSkill(insight?: BoroughInsight): SkillTag | 'All' {
  return insight?.topSkills[0]?.skill ?? 'All'
}

export default function MapPage() {
  const router = useRouter()

  useEffect(() => {
    requireSession(router)
  }, [router])

  const [selectedBorough, setSelectedBorough] = useState('Southwark')
  const [activeSkill, setActiveSkill] = useState<SkillTag | 'All'>('All')
  const [mapUsers, setMapUsers] = useState<MapUser[]>(USE_FALLBACKS ? (FALLBACK_USERS as MapUser[]) : [])
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(!USE_FALLBACKS)

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
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCount = useCallback(async () => {
    if (USE_FALLBACKS) {
      setVerifiedCount(FALLBACK_USERS.filter(u => u.tier && VERIFIED_TIERS_SET.has(u.tier as typeof VERIFIED_TIERS[number])).length)
      return
    }

    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('tier', [...VERIFIED_TIERS])

      if (error) throw error
      setVerifiedCount(count ?? 0)
    } catch {
      // keep previous count
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchUsers()
      void fetchCount()
    })
  }, [fetchUsers, fetchCount])

  useEffect(() => {
    if (USE_FALLBACKS) return

    const channel = supabase
      .channel('map-verified-count')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => {
        void fetchCount()
        void fetchUsers()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => {
        void fetchCount()
        void fetchUsers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCount, fetchUsers])

  const verifiedUsers = useMemo(
    () => mapUsers.filter(u => u.borough && u.tier && VERIFIED_TIERS_SET.has(u.tier as typeof VERIFIED_TIERS[number])),
    [mapUsers]
  )

  const allSkillInsights = useMemo(
    () => buildMapInsights(verifiedUsers, POIS, 'All'),
    [verifiedUsers]
  )

  const filteredInsights = useMemo(
    () => buildMapInsights(verifiedUsers, POIS, activeSkill),
    [verifiedUsers, activeSkill]
  )

  const selectedAllInsight = allSkillInsights.lookup[selectedBorough]
  const selectedInsight = filteredInsights.lookup[selectedBorough]
  const selectedTopSkill = getLeadSkill(selectedInsight ?? selectedAllInsight)

  const selectedPeople = selectedInsight?.people ?? []
  const selectedAidHubs = selectedAllInsight?.aidHubs ?? []
  const selectedRiskAlerts = selectedAllInsight?.riskAlerts ?? []

  const maxDensity = filteredInsights.maxWeightedCount
  const densityPercent = selectedInsight ? Math.round((selectedInsight.weightedCount / maxDensity) * 100) : 0
  const densityTone = densityPercent > 66 ? 'High' : densityPercent > 33 ? 'Medium' : 'Low'

  const topBorough = filteredInsights.insights[0]

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="map" />

      <main className="ml-60 px-8 py-8 pt-14">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #2f3746',
                background: 'rgba(16,20,26,0.9)',
                color: '#8c90a1',
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#40e56c', boxShadow: '0 0 8px #40e56c88' }} />
              Trust density map
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Trust Map
            </h1>
            <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 6, maxWidth: 640 }}>
              Verified people and aid hubs across London. Tap a borough to inspect the cluster, the skills inside it, and where help is available.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Verified', value: verifiedCount !== null ? `${formatCount(verifiedCount)} / ${formatCount(LONDON_POPULATION)}` : '— / —', accent: '#40e56c' },
              { label: 'Top borough', value: topBorough?.borough ?? '—', accent: '#b0c6ff' },
              { label: 'Lead skill', value: selectedTopSkill, accent: SKILL_COLORS[selectedTopSkill] ?? '#8c90a1' },
            ].map(card => (
              <div
                key={card.label}
                style={{
                  minWidth: 160,
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: '#161b25',
                  border: '1px solid #2f3746',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8c90a1', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: card.accent, boxShadow: `0 0 6px ${card.accent}88` }} />
                  {card.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dfe2eb', fontVariantNumeric: 'tabular-nums' }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {SKILLS.map(skill => {
            const active = activeSkill === skill
            const color = SKILL_COLORS[skill]

            return (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${active ? color : '#2f3746'}`,
                  background: active ? `${color}22` : '#141922',
                  color: active ? color : '#8c90a1',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {skill !== 'All' && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                )}
                {skill}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
          <div
            className="city-grid"
            style={{
              gridColumn: 'span 9',
              padding: 0,
              overflow: 'hidden',
              height: 620,
              position: 'relative',
              borderRadius: 16,
              border: '1px solid #2f3746',
              background: '#0b1018',
              boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c90a1', fontSize: 14 }}>
                Loading map data...
              </div>
            ) : (
              <HeatMap
                users={mapUsers}
                pois={POIS}
                selectedBorough={selectedBorough}
                activeSkill={activeSkill}
                onBoroughClick={name => {
                  setSelectedBorough(name)
                }}
              />
            )}
          </div>

          <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="bento">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Selected borough
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="location_on" size={18} style={{ color: '#b0c6ff' }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedBorough}</h3>
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#8c90a1', fontSize: 13 }}>
                    {selectedInsight
                      ? `${formatCount(selectedInsight.verifiedCount)} verified people currently shown`
                      : 'No verified people for this filter in this borough'}
                  </p>
                </div>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid #2f3746',
                    color: '#8c90a1',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeSkill === 'All' ? 'All skills' : activeSkill}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { value: formatCount(selectedInsight?.verifiedCount ?? 0), label: 'Verified', sub: selectedAllInsight ? `of ${formatCount(selectedAllInsight.verifiedCount)} total` : 'borough total' },
                  { value: String(selectedAidHubs.length), label: 'Aid hubs', sub: selectedAidHubs[0]?.label ?? 'local support' },
                  { value: String(selectedRiskAlerts.length), label: 'Alerts', sub: selectedRiskAlerts[0]?.label ?? 'watch area' },
                  { value: `${densityPercent}%`, label: 'Density', sub: densityTone },
                ].map(({ value, label, sub }) => (
                  <div
                    key={label}
                    style={{
                      padding: '12px 12px 10px',
                      borderRadius: 12,
                      background: '#10141a',
                      border: '1px solid #2f3746',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#dfe2eb', fontVariantNumeric: 'tabular-nums' }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, color: '#556074', marginTop: 4, minHeight: 12 }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Skill mix
                  </h4>
                  <span style={{ fontSize: 11, color: '#556074' }}>click a borough to update</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedAllInsight?.topSkills.slice(0, 4) ?? []).map(item => {
                    const width = selectedAllInsight && selectedAllInsight.verifiedCount > 0
                      ? Math.max(12, Math.round((item.count / selectedAllInsight.verifiedCount) * 100))
                      : 0

                    return (
                      <div key={item.skill}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#dfe2eb' }}>{item.skill}</span>
                          <span style={{ fontSize: 11, color: '#8c90a1' }}>{item.count}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: '#10141a', overflow: 'hidden', border: '1px solid #2f3746' }}>
                          <div
                            style={{
                              width: `${width}%`,
                              height: '100%',
                              borderRadius: 999,
                              background: SKILL_COLORS[item.skill],
                              boxShadow: `0 0 10px ${SKILL_COLORS[item.skill]}55`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Link href={`/find?borough=${encodeURIComponent(selectedBorough)}${activeSkill !== 'All' ? `&skill=${encodeURIComponent(activeSkill)}` : ''}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                Find help in {selectedBorough}
              </Link>
            </div>

            <div className="bento" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, margin: 0, color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  People here
                </h3>
                <span style={{ fontSize: 11, color: '#556074' }}>{selectedPeople.length} shown</span>
              </div>

              {selectedPeople.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedPeople.slice(0, 5).map(person => (
                    <div key={person.node_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: SKILL_COLORS[person.skill ?? 'Other'],
                          boxShadow: `0 0 8px ${SKILL_COLORS[person.skill ?? 'Other']}88`,
                        }}
                      />
                      <span style={{ fontSize: 13, color: '#c2c6d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {person.display_name ?? person.username}
                      </span>
                      <span style={{ fontSize: 11, color: '#8c90a1', marginLeft: 'auto', flexShrink: 0 }}>
                        {person.skill}
                      </span>
                    </div>
                  ))}
                  {selectedPeople.length > 5 && (
                    <p style={{ fontSize: 11, color: '#8c90a1', margin: 0 }}>+{selectedPeople.length - 5} more</p>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#8c90a1', fontSize: 13 }}>
                  No people match this filter here yet.
                </p>
              )}
            </div>

            <div className="bento">
              <h3 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 14px', color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Legend
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { shape: 'glow', color: '#3b82f6', label: 'Verified density' },
                  { shape: 'ring', color: '#7dd3fc', label: 'Selected borough' },
                  { shape: 'dot', color: '#b0c6ff', label: 'Aid hub' },
                  { shape: 'dot', color: '#ffb4ab', label: 'Risk alert' },
                ].map(({ shape, color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {shape === 'glow' ? (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}99` }} />
                    ) : shape === 'ring' ? (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${color}`, background: 'transparent', boxShadow: `0 0 8px ${color}55` }} />
                    ) : (
                      <div style={{ width: 10, height: 10, transform: 'rotate(45deg)', background: `${color}33`, border: `1.5px solid ${color}`, flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 13, color: '#c2c6d8' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
