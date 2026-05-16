'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'

type ClaimType = 'Identity' | 'Credential' | 'Employment' | 'Residency'

const CLAIM_TYPES: { id: ClaimType; icon: string; desc: string }[] = [
  { id: 'Identity',    icon: 'badge',       desc: 'Passport, driving licence' },
  { id: 'Credential', icon: 'school',       desc: 'Degree, qualification' },
  { id: 'Employment', icon: 'work',         desc: 'Employer letter, contract' },
  { id: 'Residency',  icon: 'home',         desc: 'Utility bill, council tax' },
]

const STEPS = ['Choose type', 'Upload document', 'Review extracted info', 'Submit']

function StepCircle({ n, status }: { n: number; status: 'done' | 'active' | 'pending' }) {
  const styles: React.CSSProperties =
    status === 'done'
      ? { background: '#40e56c', color: '#002d6f', border: '1px solid #40e56c' }
      : status === 'active'
      ? { background: 'rgba(176,198,255,0.15)', color: '#b0c6ff', border: '1px solid #b0c6ff' }
      : { background: '#0a0e14', color: '#8c90a1', border: '1px solid #424655' }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        ...styles,
      }}
    >
      {status === 'done' ? '✓' : n}
    </div>
  )
}

function SummaryBar({ claimType, step }: { claimType: ClaimType; step: number }) {
  return (
    <div className="bento" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Summary</h3>
      <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
        {[
          { label: 'Type', value: claimType },
          { label: 'Document', value: step >= 3 ? 'UK Passport' : '—' },
          { label: 'Points if verified', value: '+15', valueColor: '#40e56c' },
          { label: 'Review wait', value: '~2 hours' },
        ].map(({ label, value, valueColor }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <dt style={{ color: '#8c90a1' }}>{label}</dt>
            <dd style={{ fontWeight: 600, color: valueColor ?? '#dfe2eb', margin: 0 }}>{value}</dd>
          </div>
        ))}
      </dl>
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(176,198,255,0.07)',
          border: '1px solid rgba(176,198,255,0.2)',
          fontSize: 12,
          color: '#8c90a1',
          lineHeight: 1.5,
        }}
      >
        Your document is analysed locally. No raw image is stored.
      </div>
    </div>
  )
}

export default function AddEvidencePage() {
  const [step, setStep] = useState(3)
  const [claimType, setClaimType] = useState<ClaimType>('Identity')
  const [, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="add-evidence" />
      <main className="ml-60 pt-14 px-8 py-8">

        {/* Back + header */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#8c90a1',
              textDecoration: 'none',
              marginBottom: 12,
            }}
          >
            <Icon name="arrow_back" size={16} />
            Back to dashboard
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Add evidence
          </h1>
        </div>

        {/* Stepper */}
        <div className="bento" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {STEPS.map((label, i) => {
              const n = i + 1
              const status = n < step ? 'done' : n === step ? 'active' : 'pending'
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StepCircle n={n} status={status} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: status === 'active' ? 600 : 400,
                      color: status === 'active' ? '#dfe2eb' : status === 'done' ? '#8c90a1' : '#8c90a1',
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

          {/* Step content */}
          <div style={{ gridColumn: 'span 8' }}>

            {step === 1 && (
              <div className="bento">
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
                  What are you claiming?
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {CLAIM_TYPES.map((ct) => {
                    const isActive = claimType === ct.id
                    return (
                      <button
                        key={ct.id}
                        onClick={() => setClaimType(ct.id)}
                        style={{
                          padding: 16,
                          borderRadius: 10,
                          border: `1px solid ${isActive ? '#b0c6ff' : '#424655'}`,
                          background: isActive ? 'rgba(176,198,255,0.1)' : '#10141a',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Icon name={ct.icon} size={22} style={{ color: isActive ? '#b0c6ff' : '#8c90a1' }} />
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#dfe2eb', marginTop: 8 }}>
                          {ct.id}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c90a1', marginTop: 4 }}>{ct.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bento">
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
                  Upload your document
                </h2>
                <div
                  style={{
                    border: '1.5px dashed #424655',
                    borderRadius: 12,
                    padding: 48,
                    textAlign: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Icon name="cloud_upload" size={40} style={{ color: '#424655', marginBottom: 12 }} />
                  <div style={{ fontSize: 14, color: '#8c90a1', marginBottom: 16 }}>
                    Drag a file here
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn-ghost" style={{ fontSize: 13 }}>
                      <Icon name="photo_camera" size={16} />
                      Use camera
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 13 }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Icon name="folder_open" size={16} />
                      Choose file
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={handleFile}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bento">
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
                  Review what we read
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
                  {/* Passport preview */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <div
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: '#0a0e14',
                        border: '1px solid #424655',
                        aspectRatio: '3/4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 8,
                        color: '#8c90a1',
                      }}
                    >
                      <svg
                        viewBox="0 0 60 80"
                        width="120"
                        height="160"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="60" height="80" rx="4" fill="#1a2540" />
                        <rect x="4" y="4" width="52" height="72" rx="2" fill="#1e2d50" stroke="#2a3a60" strokeWidth="0.5" />
                        <circle cx="30" cy="28" r="12" fill="#162038" stroke="#2a3a60" strokeWidth="0.5" />
                        <circle cx="30" cy="24" r="6" fill="#1a2a48" />
                        <path d="M18 34 Q30 40 42 34" fill="#162038" />
                        <rect x="8" y="46" width="44" height="2" rx="1" fill="#2a3a60" />
                        <rect x="8" y="52" width="36" height="2" rx="1" fill="#2a3a60" />
                        <rect x="8" y="58" width="28" height="2" rx="1" fill="#2a3a60" />
                        <rect x="4" y="68" width="52" height="8" rx="0" fill="#111d35" />
                        <text x="30" y="74" textAnchor="middle" fill="#3a5080" fontSize="4" fontFamily="monospace">
                          P&lt;GBRMITCHELL&lt;&lt;SARAH&lt;
                        </text>
                        <text x="6" y="18" fill="#b0c6ff" fontSize="5" fontWeight="bold">UK</text>
                        <text x="6" y="24" fill="#8899aa" fontSize="3">PASSPORT</text>
                      </svg>
                      <span style={{ fontSize: 11, color: '#424655' }}>Gemini Vision read</span>
                    </div>
                  </div>

                  {/* Extracted fields */}
                  <div
                    style={{
                      gridColumn: 'span 3',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      alignContent: 'start',
                    }}
                  >
                    {[
                      { label: 'Name', value: 'Sarah J. Mitchell' },
                      { label: 'Document', value: 'UK Passport' },
                      { label: 'Issuer', value: 'HMPO' },
                      { label: 'Date of birth', value: '12 Mar 1991' },
                      { label: 'Expires', value: '04 Aug 2031' },
                      { label: 'Doc number', value: '***-8921' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: '#10141a',
                          border: '1px solid #424655',
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#8c90a1', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#dfe2eb' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bento">
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
                  Ready to submit
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: 'person', label: 'Name match', detail: 'Sarah J. Mitchell found in document' },
                    { icon: 'content_copy', label: 'Not a duplicate', detail: 'No matching claim found' },
                    { icon: 'verified', label: 'Document recognised', detail: 'UK Passport confirmed' },
                  ].map(({ icon, label, detail }) => (
                    <div
                      key={label}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        background: 'rgba(64,229,108,0.06)',
                        border: '1px solid rgba(64,229,108,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <Icon name={icon} size={22} style={{ color: '#40e56c' }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#dfe2eb' }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#8c90a1' }}>{detail}</div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: '#10141a',
                    border: '1px solid #424655',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#c2c6d8' }}>
                    Your score: 55 → <strong style={{ color: '#40e56c' }}>70</strong>
                  </span>
                  <button
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: 'rgba(64,229,108,0.15)',
                      border: '1px solid rgba(64,229,108,0.4)',
                      color: '#40e56c',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="upload_file" size={16} />
                    Submit claim
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div style={{ gridColumn: 'span 4' }}>
            <SummaryBar claimType={claimType} step={step} />
          </div>
        </div>

        {/* Step navigation footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #424655',
          }}
        >
          <button
            className="btn-ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            style={{ opacity: step === 1 ? 0.3 : 1, pointerEvents: step === 1 ? 'none' : 'auto' }}
          >
            <Icon name="arrow_back" size={16} />
            Back
          </button>
          <span style={{ fontSize: 13, color: '#8c90a1' }}>Step {step} of 4</span>
          <button
            className="btn-primary"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
          >
            {step === 4 ? 'Submit' : 'Continue'}
            <Icon name="arrow_forward" size={16} />
          </button>
        </div>

      </main>
    </div>
  )
}
