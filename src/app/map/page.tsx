'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import dynamic from 'next/dynamic'
import type { MapUser, MapPOI } from '@/components/map/HeatMap'
const HeatMap = dynamic(() => import('@/components/map/HeatMap').then(m => m.HeatMap), { ssr: false })
import { FALLBACK_USERS, USE_FALLBACKS } from '@/lib/fallbacks'
import { supabase } from '@/lib/supabase'
import { requireSession } from '@/app/_lib/session'
import type { SkillTag } from '@/types'

const POIS: MapPOI[] = [
  { borough: 'Southwark',   type: 'aid_hub',    label: "King's College Hospital Aid Hub" },
  { borough: 'Westminster', type: 'aid_hub',    label: 'NHS Emergency HQ' },
  { borough: 'Lambeth',     type: 'aid_hub',    label: 'Brixton Aid Centre' },
  { borough: 'Camden',      type: 'aid_hub',    label: 'UCH Field Station' },
  { borough: 'Hackney',     type: 'risk_alert', label: 'Grid failure zone — limited comms' },
]

const SKILLS: Array<SkillTag | 'All'> = ['All', 'Doctor', 'Nurse', 'Engineer', 'Legal', 'Builder', 'Other']

const SKILL_COLORS: Record<string, string> = {
  All:      '#8c90a1',
  Doctor:   '#22c55e',
  Nurse:    '#ec4899',
  Engineer: '#3b82f6',
  Legal:    '#a855f7',
  Builder:  '#f59e0b',
  Other:    '#6b7280',
}

const VERIFIED_TIERS = ['verified', 'trusted', 'gov_official'] as const
const VERIFIED_TIERS_SET = new Set(VERIFIED_TIERS)
const LONDON_POPULATION = 9_000_000

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
      // leave previous value
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
    void fetchCount()
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
    return () => { supabase.removeChannel(channel) }
  }, [fetchCount, fetchUsers])

  const boroughUsers = useMemo(
    () => mapUsers.filter(u => u.borough === selectedBorough && u.tier && VERIFIED_TIERS_SET.has(u.tier as typeof VERIFIED_TIERS[number])),
    [mapUsers, selectedBorough]
  )

  const boroughAidHubs = useMemo(
    () => POIS.filter(p => p.borough === selectedBorough && p.type === 'aid_hub').length,
    [selectedBorough]
  )

  const boroughAlerts = useMemo(
    () => POIS.filter(p => p.borough === selectedBorough && p.type === 'risk_alert').length,
    [selectedBorough]
  )

  const nearestKm = boroughUsers.length > 0 ? '0.3km' : '—'

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="map" />
      <main className="ml-60 pt-14 px-8 py-8">

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Trust Map
            </h1>
            <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>
              Click a borough to inspect. Verified people and aid hubs across London.
            </p>
          </div>
          {/* Live verified counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 10,
            background: '#161b25',
            border: '1px solid #424655',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#40e56c', boxShadow: '0 0 6px #40e56c88', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#8c90a1' }}>Verified</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#dfe2eb', fontVariantNumeric: 'tabular-nums' }}>
              {verifiedCount !== null
                ? `${verifiedCount.toLocaleString()} / ${LONDON_POPULATION.toLocaleString()}`
                : '— / —'}
            </span>
          </div>
        </div>

        {/* Skill filter chips */}
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
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: `1px solid ${active ? color : '#424655'}`,
                  background: active ? `${color}22` : 'transparent',
                  color: active ? color : '#8c90a1',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
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

          {/* Map */}
          <div
            className="bento city-grid"
            style={{
              gridColumn: 'span 9',
              padding: 0,
              overflow: 'hidden',
              height: 580,
              position: 'relative',
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
                onBoroughClick={(name, users) => {
                  setSelectedBorough(name)
                  void users
                }}
              />
            )}
          </div>

          {/* Right panel */}
          <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Borough stats */}
            <div className="bento">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Icon name="location_on" size={18} style={{ color: '#b0c6ff' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{selectedBorough}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { value: String(boroughUsers.length), label: 'Verified' },
                  { value: String(boroughAidHubs),      label: 'Aid hubs' },
                  { value: String(boroughAlerts),        label: 'Alerts' },
                  { value: nearestKm,                    label: 'Nearest' },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#10141a',
                      border: '1px solid #424655',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#dfe2eb' }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <Link href="/find" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                Find help in {selectedBorough}
              </Link>
            </div>

            {/* People in selected borough */}
            {boroughUsers.length > 0 && (
              <div className="bento" style={{ padding: '14px 16px' }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 12px', color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  People here
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {boroughUsers.slice(0, 5).map(u => (
                    <div key={u.node_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: SKILL_COLORS[u.skill ?? 'Other'],
                      }} />
                      <span style={{ fontSize: 13, color: '#c2c6d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.display_name ?? u.username}
                      </span>
                      <span style={{ fontSize: 11, color: '#8c90a1', marginLeft: 'auto', flexShrink: 0 }}>{u.skill}</span>
                    </div>
                  ))}
                  {boroughUsers.length > 5 && (
                    <p style={{ fontSize: 11, color: '#8c90a1', margin: 0 }}>+{boroughUsers.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bento">
              <h3 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 14px', color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { shape: 'circle',  color: '#22c55e', label: 'Verified person' },
                  { shape: 'circle',  color: '#fff',    label: 'Gov Official (white border)' },
                  { shape: 'diamond', color: '#b0c6ff', label: 'Aid hub' },
                  { shape: 'diamond', color: '#ffb4ab', label: 'Risk alert' },
                ].map(({ shape, color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {shape === 'circle' ? (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}88` }} />
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
