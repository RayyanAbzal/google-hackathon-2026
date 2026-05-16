'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import DocumentCameraCapture from '@/components/claims/DocumentCameraCapture'
import type { Claim, ClaimType as ApiClaimType, Session, TrustTier } from '@/types'
import { protectedFetch, requireSession, updateStoredSession } from '@/app/_lib/session'

type ClaimType = 'Identity' | 'Credential' | 'Employment' | 'Residency'

const CLAIM_TYPES: { id: ClaimType; icon: string; desc: string }[] = [
  { id: 'Identity',    icon: 'badge',       desc: 'Passport, driving licence' },
  { id: 'Credential', icon: 'school',       desc: 'Degree, qualification' },
  { id: 'Employment', icon: 'work',         desc: 'Employer letter, contract' },
  { id: 'Residency',  icon: 'home',         desc: 'Utility bill, council tax' },
]

const STEPS = ['Choose type', 'Upload document', 'Review extracted info', 'Submit']

const CLAIM_TYPE_TO_API: Record<ClaimType, ApiClaimType> = {
  Identity: 'identity',
  Credential: 'credential',
  Employment: 'work',
  Residency: 'identity',
}

const CLAIM_TYPE_TO_DOC: Record<ClaimType, string> = {
  Identity: 'passport',
  Credential: 'degree',
  Employment: 'employer_letter',
  Residency: 'utility_bill',
}

const CLAIM_TYPE_POINTS: Record<ClaimType, number> = {
  Identity: 20,   // passport
  Credential: 15,
  Employment: 15,
  Residency: 15,
}

interface ClaimResult {
  claim: Claim
  new_score: number
  tier: TrustTier
}

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
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [step, setStep] = useState(1)
  const [claimType, setClaimType] = useState<ClaimType>('Identity')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    queueMicrotask(() => setSession(requireSession(router)))
  }, [router])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
    setError('')
    setStatusMessage(e.target.files?.[0] ? 'Document ready for review.' : '')
  }

  function handleCameraCapture(file: File) {
    setSelectedFile(file)
    setError('')
    setStatusMessage('Photo captured and ready for review.')
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setStatusMessage('')
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') {
          reject(new Error('Could not read file'))
          return
        }
        resolve(result.split(',')[1] ?? result)
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsDataURL(file)
    })
  }

  async function submitClaim() {
    if (!session) return
    if (!selectedFile) {
      setError('Choose a document before submitting.')
      setStep(2)
      return
    }

    setSubmitting(true)
    setError('')
    setStatusMessage('Submitting claim...')

    try {
      const imageBase64 = await fileToBase64(selectedFile)
      const json = await protectedFetch<ClaimResult>('/api/claims', session, {
        method: 'POST',
        body: JSON.stringify({
          type: CLAIM_TYPE_TO_API[claimType],
          doc_type: CLAIM_TYPE_TO_DOC[claimType],
          image_base64: imageBase64,
        }),
      })

      if (!json.success) {
        setError(json.error)
        setStatusMessage('')
        return
      }

      const updated = updateStoredSession({
        score: json.data.new_score,
        tier: json.data.tier,
      })
      if (updated) setSession(updated)
      setStatusMessage(`Claim verified. Score is now ${json.data.new_score}.`)
    } catch {
      setError('Could not submit the claim. Try again.')
      setStatusMessage('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar />
      <Sidebar active="add-evidence" session={session} />
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
          <div style={{ gridColumn: step > 2 ? 'span 8' : 'span 12' }}>

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
                    <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setCameraOpen(true)}>
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
                  {selectedFile && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        maxWidth: '100%',
                        marginTop: 14,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(64,229,108,0.06)',
                        border: '1px solid rgba(64,229,108,0.25)',
                        color: '#40e56c',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        aria-label="Remove selected document"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          border: '1px solid rgba(255,180,171,0.3)',
                          background: 'rgba(255,180,171,0.08)',
                          color: '#ffb4ab',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  )}
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
                      { label: 'Name on account', value: session?.display_name ?? '—' },
                      { label: 'Claim type', value: claimType },
                      { label: 'Document', value: CLAIM_TYPE_TO_DOC[claimType] },
                      { label: 'Gemini analysis', value: 'Runs on submit' },
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
                    { icon: 'person', label: 'Name match', detail: `${session?.display_name ?? 'Your name'} will be checked against document` },
                    { icon: 'content_copy', label: 'Duplicate check', detail: 'Document hash checked on submit' },
                    { icon: 'psychology', label: 'Gemini Vision', detail: `Analysing ${CLAIM_TYPE_TO_DOC[claimType]} on submit` },
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
                    Your score: {session?.score ?? 0} → <strong style={{ color: '#40e56c' }}>{Math.min(100, (session?.score ?? 0) + CLAIM_TYPE_POINTS[claimType])}</strong> (+{CLAIM_TYPE_POINTS[claimType]} pts if verified)
                  </span>
                  <button
                    onClick={submitClaim}
                    disabled={submitting}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: 'rgba(64,229,108,0.15)',
                      border: '1px solid rgba(64,229,108,0.4)',
                      color: '#40e56c',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="upload_file" size={16} />
                    {submitting ? 'Submitting...' : 'Submit claim'}
                  </button>
                </div>
                {(statusMessage || error) && (
                  <p style={{ fontSize: 13, color: error ? '#ffb4ab' : '#40e56c', margin: '14px 0 0' }}>
                    {error || statusMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          {step > 2 && (
            <div style={{ gridColumn: 'span 4' }}>
              <SummaryBar claimType={claimType} step={step} />
            </div>
          )}
        </div>

        {(statusMessage || error) && step !== 4 && (
          <p style={{ fontSize: 13, color: error ? '#ffb4ab' : '#40e56c', margin: '16px 0 0' }}>
            {error || statusMessage}
          </p>
        )}

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
            onClick={() => {
              if (step === 4) {
                void submitClaim()
                return
              }
              if (step === 2 && !selectedFile) {
                setError('Choose a document before continuing.')
                return
              }
              setError('')
              setStep((s) => Math.min(4, s + 1))
            }}
            disabled={submitting}
          >
            {step === 4 ? (submitting ? 'Submitting...' : 'Submit') : 'Continue'}
            <Icon name="arrow_forward" size={16} />
          </button>
        </div>

      </main>
      <DocumentCameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
