'use client'

import { useState } from 'react'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import TierBadge from '@/components/civic/TierBadge'
import Icon from '@/components/civic/Icon'

type VouchType = 'regular' | 'government' | 'mutual'

const VOUCH_OPTIONS: { id: VouchType; label: string; pts: string; locked?: boolean }[] = [
  { id: 'regular',    label: 'Regular',    pts: '+10 pts' },
  { id: 'government', label: 'Government', pts: '+20',   locked: true },
  { id: 'mutual',     label: 'Mutual',     pts: '+12 each way' },
]

export default function VouchPage() {
  const [vouchType, setVouchType] = useState<VouchType>('regular')
  const [nodeInput, setNodeInput] = useState('')

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="vouch" />
      <main className="ml-60 pt-14 px-8 py-8">

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Vouch</h1>
          <p style={{ fontSize: 15, color: '#8c90a1', marginTop: 4 }}>
            Scan someone&apos;s QR code or enter their Node ID to vouch for their identity.
          </p>
        </div>

        {/* Warning bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(255,180,171,0.07)',
            border: '1px solid rgba(255,180,171,0.25)',
            marginBottom: 24,
            fontSize: 13,
            color: '#ffb4ab',
          }}
        >
          <Icon name="warning" size={18} style={{ color: '#ffb4ab', flexShrink: 0 }} />
          False vouches carry a trust penalty. Only vouch for people you have physically verified.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

          {/* Left — Your QR code */}
          <div className="bento" style={{ gridColumn: 'span 5' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Your QR code</h2>
            <p style={{ fontSize: 13, color: '#8c90a1', marginBottom: 20 }}>
              Let others scan this to vouch for you.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: '#0a0e14',
                  border: '1px solid #424655',
                }}
              >
                <svg width="220" height="220" viewBox="0 0 24 24" shapeRendering="crispEdges">
                  <rect width="24" height="24" fill="#0a0e14" />
                  <g fill="#dfe2eb">
                    {/* Top-left finder */}
                    <rect x="1" y="1" width="6" height="6" />
                    <rect x="2" y="2" width="4" height="4" fill="#0a0e14" />
                    <rect x="3" y="3" width="2" height="2" />
                    {/* Top-right finder */}
                    <rect x="17" y="1" width="6" height="6" />
                    <rect x="18" y="2" width="4" height="4" fill="#0a0e14" />
                    <rect x="19" y="3" width="2" height="2" />
                    {/* Bottom-left finder */}
                    <rect x="1" y="17" width="6" height="6" />
                    <rect x="2" y="18" width="4" height="4" fill="#0a0e14" />
                    <rect x="3" y="19" width="2" height="2" />
                    {/* Data modules */}
                    <rect x="9" y="1" width="1" height="1" />
                    <rect x="11" y="1" width="1" height="1" />
                    <rect x="13" y="1" width="2" height="1" />
                    <rect x="9" y="3" width="1" height="2" />
                    <rect x="11" y="3" width="2" height="1" />
                    <rect x="14" y="3" width="1" height="2" />
                    <rect x="9" y="5" width="2" height="1" />
                    <rect x="13" y="5" width="1" height="1" />
                    <rect x="15" y="5" width="1" height="1" />
                    <rect x="1" y="9" width="1" height="1" />
                    <rect x="3" y="9" width="2" height="1" />
                    <rect x="6" y="9" width="1" height="1" />
                    <rect x="8" y="8" width="1" height="3" />
                    <rect x="10" y="9" width="3" height="1" />
                    <rect x="14" y="8" width="2" height="2" />
                    <rect x="17" y="9" width="1" height="1" />
                    <rect x="19" y="8" width="1" height="2" />
                    <rect x="21" y="9" width="2" height="1" />
                    <rect x="1" y="11" width="2" height="2" />
                    <rect x="4" y="11" width="1" height="1" />
                    <rect x="6" y="12" width="2" height="1" />
                    <rect x="9" y="11" width="1" height="3" />
                    <rect x="11" y="12" width="1" height="1" />
                    <rect x="13" y="11" width="2" height="1" />
                    <rect x="16" y="11" width="1" height="2" />
                    <rect x="18" y="12" width="3" height="1" />
                    <rect x="22" y="11" width="1" height="2" />
                    <rect x="1" y="14" width="1" height="2" />
                    <rect x="3" y="15" width="3" height="1" />
                    <rect x="7" y="14" width="1" height="2" />
                    <rect x="10" y="14" width="2" height="2" />
                    <rect x="13" y="15" width="1" height="1" />
                    <rect x="15" y="14" width="2" height="1" />
                    <rect x="18" y="14" width="1" height="1" />
                    <rect x="20" y="15" width="3" height="1" />
                    <rect x="8" y="17" width="1" height="6" />
                    <rect x="10" y="17" width="2" height="1" />
                    <rect x="13" y="17" width="1" height="2" />
                    <rect x="15" y="18" width="2" height="1" />
                    <rect x="18" y="17" width="1" height="3" />
                    <rect x="20" y="18" width="2" height="1" />
                    <rect x="10" y="19" width="1" height="2" />
                    <rect x="12" y="20" width="3" height="1" />
                    <rect x="16" y="19" width="1" height="3" />
                    <rect x="19" y="21" width="4" height="1" />
                    <rect x="10" y="22" width="2" height="1" />
                    <rect x="14" y="22" width="1" height="1" />
                  </g>
                </svg>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: '#b0c6ff' }}>
                BLK-0471-LDN
              </div>
            </div>

            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              <Icon name="content_copy" size={16} />
              Copy Node ID
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <div style={{ display: 'flex', marginRight: 4 }}>
                {['#b0c6ff', '#40e56c', '#ffb599'].map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: color,
                      border: '2px solid #181c22',
                      marginLeft: i > 0 ? -8 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#181c22',
                    }}
                  >
                    {['AJ', 'HR', 'MB'][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#8c90a1' }}>3 people · +40 points earned</span>
            </div>
          </div>

          {/* Right — Scan + Preview */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Scan card */}
            <div className="bento">
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Vouch for someone</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                {/* Scanner preview */}
                <div
                  style={{
                    height: 100,
                    borderRadius: 10,
                    border: '1px solid #424655',
                    background: '#0a0e14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Icon name="qr_code_scanner" size={32} style={{ color: '#424655' }} />
                  {/* Corner markers */}
                  {[
                    { top: 8, left: 8, borderTop: '2px solid #b0c6ff', borderLeft: '2px solid #b0c6ff' },
                    { top: 8, right: 8, borderTop: '2px solid #b0c6ff', borderRight: '2px solid #b0c6ff' },
                    { bottom: 8, left: 8, borderBottom: '2px solid #b0c6ff', borderLeft: '2px solid #b0c6ff' },
                    { bottom: 8, right: 8, borderBottom: '2px solid #b0c6ff', borderRight: '2px solid #b0c6ff' },
                  ].map((style, i) => (
                    <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...style }} />
                  ))}
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8c90a1', display: 'block', marginBottom: 6 }}>
                    Or enter Node ID
                  </label>
                  <input
                    className="field-input"
                    placeholder="BLK-XXXX-LDN"
                    value={nodeInput}
                    onChange={(e) => setNodeInput(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Icon name="search" size={16} />
                  Look up
                </button>
              </div>
            </div>

            {/* Person preview card */}
            <div className="bento">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottom: '1px solid #424655',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(64,229,108,0.15)',
                    border: '2px solid rgba(64,229,108,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#40e56c',
                    flexShrink: 0,
                  }}
                >
                  MG
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Maalav G.</div>
                  <div style={{ fontSize: 13, color: '#8c90a1', marginTop: 2 }}>Engineer · Lambeth</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <TierBadge tier="verified" />
                  <div style={{ fontSize: 13, color: '#8c90a1', marginTop: 6 }}>Score 62 / 100</div>
                </div>
              </div>

              {/* Vouch type */}
              <div style={{ fontSize: 13, color: '#8c90a1', marginBottom: 10 }}>Vouch type</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {VOUCH_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { if (!opt.locked) setVouchType(opt.id) }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${
                        opt.locked ? '#424655' : vouchType === opt.id ? '#40e56c' : '#424655'
                      }`,
                      background:
                        opt.locked
                          ? 'transparent'
                          : vouchType === opt.id
                          ? 'rgba(64,229,108,0.1)'
                          : '#10141a',
                      color: opt.locked ? '#424655' : vouchType === opt.id ? '#40e56c' : '#c2c6d8',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: opt.locked ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>{opt.label}</div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{opt.pts}</div>
                    {opt.locked && (
                      <div style={{ fontSize: 10, marginTop: 2 }}>
                        <Icon name="lock" size={10} style={{ display: 'inline' }} /> Gov only
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Confirm row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: 16,
                  borderTop: '1px solid #424655',
                }}
              >
                <span style={{ flex: 1, fontSize: 14, color: '#c2c6d8' }}>
                  Vouch Maalav G. for +10 points?
                </span>
                <button className="btn-ghost">Reject</button>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: 'rgba(64,229,108,0.15)',
                    border: '1px solid rgba(64,229,108,0.4)',
                    color: '#40e56c',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon name="handshake" size={16} />
                  Confirm vouch
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}
