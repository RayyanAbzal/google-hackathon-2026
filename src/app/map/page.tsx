'use client'

import Link from 'next/link'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import { HeatMap } from '@/components/map/HeatMap'
import { FALLBACK_USERS } from '@/lib/fallbacks'

// Approximate SVG positions for borough labels used as pin anchors (within 800x620 SVG)
const PINS = [
  { label: 'Southwark',   cx: 430, cy: 340, color: '#40e56c', icon: 'local_hospital' },
  { label: 'Hackney',     cx: 445, cy: 230, color: '#b0c6ff', icon: 'engineering' },
  { label: 'Lambeth',     cx: 400, cy: 370, color: '#40e56c', icon: 'local_hospital' },
  { label: 'Westminster', cx: 360, cy: 290, color: '#b0c6ff', icon: 'account_balance' },
  { label: 'Hackney risk',cx: 460, cy: 215, color: '#ffb4ab', icon: 'warning' },
]

const LEGEND = [
  { color: '#40e56c', label: 'Verified person' },
  { color: '#b0c6ff', label: 'Aid hub' },
  { color: '#fbbf24', label: 'Partial' },
  { color: '#ffb4ab', label: 'Risk alert' },
]

export default function MapPage() {
  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="map" />
      <main className="ml-60 pt-14 px-8 py-8">

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Trust Map
          </h1>
          <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>
            Verified people and aid hubs across London.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

          {/* Map */}
          <div
            className="bento city-grid"
            style={{
              gridColumn: 'span 9',
              padding: 0,
              overflow: 'hidden',
              height: 600,
              position: 'relative',
            }}
          >
            <HeatMap users={FALLBACK_USERS} />

            {/* Pin overlays — rendered on top of D3 SVG for visual demo */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              {PINS.map((pin) => (
                <div
                  key={pin.label}
                  style={{
                    position: 'absolute',
                    left: `${(pin.cx / 800) * 100}%`,
                    top: `${(pin.cy / 620) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: `${pin.color}22`,
                      border: `2px solid ${pin.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 8px ${pin.color}55`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 12, color: pin.color }}
                    >
                      {pin.icon}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      color: pin.color,
                      background: 'rgba(10,14,20,0.8)',
                      padding: '1px 4px',
                      borderRadius: 3,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pin.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Borough stats */}
            <div className="bento">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Icon name="location_on" size={18} style={{ color: '#b0c6ff' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Southwark</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { value: '12', label: 'Verified' },
                  { value: '4',  label: 'Aid hubs' },
                  { value: '1',  label: 'Alert' },
                  { value: '0.3km', label: 'Nearest' },
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
                Find help in Southwark
              </Link>
            </div>

            {/* Legend */}
            <div className="bento">
              <h3 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 14px', color: '#8c90a1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LEGEND.map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${color}88`,
                      }}
                    />
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
