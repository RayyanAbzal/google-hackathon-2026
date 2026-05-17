'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/civic/TopBar'
import Sidebar from '@/components/civic/Sidebar'
import Icon from '@/components/civic/Icon'
import DocumentCameraCapture from '@/components/claims/DocumentCameraCapture'
import type { Claim, ClaimType as ApiClaimType, DocumentAnalysis, Session, TrustTier } from '@/types'
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
  analysis: DocumentAnalysis
  new_score: number
  tier: TrustTier
  rejection_reason?: 'name_mismatch' | 'low_confidence' | 'unreadable'
}

function formatDocType(value?: string | null): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatConfidence(value?: number | null): string {
  if (typeof value !== 'number') return '—'
  return `${Math.round(value * 100)}%`
}

function getConfidenceColor(value?: number | null): string {
  if (typeof value !== 'number') return '#8c90a1'
  if (value >= 0.75) return '#40e56c'
  if (value >= 0.5) return '#f59e0b'
  return '#ffb4ab'
}

function getRejectionMessage(reason?: ClaimResult['rejection_reason']): string {
  if (reason === 'name_mismatch') return 'The name read from the document does not match your profile.'
  if (reason === 'low_confidence') return 'We could not confirm your identity from this document. Please try a clearer photo.'
  if (reason === 'unreadable') return 'This image could not be read. Make sure the document is flat, well-lit, and fully visible, then try again.'
  return 'The document could not be verified.'
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

function SummaryBar({
  claimType,
  step,
  claimResult,
}: {
  claimType: ClaimType
  step: number
  claimResult: ClaimResult | null
}) {
  const documentValue =
    claimResult?.analysis.doc_type
      ? formatDocType(claimResult.analysis.doc_type)
      : step >= 3
      ? formatDocType(CLAIM_TYPE_TO_DOC[claimType])
      : '—'

  return (
    <div className="bento" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Summary</h3>
      <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
        {[
          { label: 'Type', value: claimType },
          { label: 'Document', value: documentValue },
          { label: 'Points if verified', value: `+${CLAIM_TYPE_POINTS[claimType]}`, valueColor: '#40e56c' },
          { label: 'Review', value: claimResult ? 'AI complete' : '~2 hours' },
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
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(
    () => selectedFile?.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null,
    [selectedFile]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    queueMicrotask(() => setSession(requireSession(router)))
  }, [router])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
    setClaimResult(null)
    setError('')
    setStatusMessage(e.target.files?.[0] ? 'Document ready for review.' : '')
  }

  function handleCameraCapture(file: File) {
    setSelectedFile(file)
    setClaimResult(null)
    setError('')
    setStatusMessage('Photo captured and ready for review.')
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setClaimResult(null)
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
    setClaimResult(null)
    setStatusMessage('AI is analysing your document...')

    try {
      const imageBase64 = await fileToBase64(selectedFile)
      const json = await protectedFetch<ClaimResult>('/api/claims', session, {
        method: 'POST',
        body: JSON.stringify({
          type: CLAIM_TYPE_TO_API[claimType],
          doc_type: CLAIM_TYPE_TO_DOC[claimType],
          image_base64: imageBase64,
          mime_type: selectedFile.type || 'image/jpeg',
        }),
      })

      if (!json.success) {
        if (json.data) {
          setClaimResult(json.data)
          setError(json.error)
          setStatusMessage('')
          setStep(3)
          return
        }
        setError(json.error)
        setStatusMessage('')
        return
      }

      setClaimResult(json.data)
      const updated = updateStoredSession({
        score: json.data.new_score,
        tier: json.data.tier,
      })
      if (updated) setSession(updated)
      setStatusMessage(`AI verified your document. Score is now ${json.data.new_score}.`)
      setStep(3)
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
          <div style={{ gridColumn: step === 4 ? 'span 8' : 'span 12' }}>

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
                        onClick={() => {
                          setClaimType(ct.id)
                          setClaimResult(null)
                          setStatusMessage('')
                          setError('')
                        }}
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
                  AI analysis
                </h2>
                {claimResult ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: '#10141a',
                          border: '1px solid #424655',
                          aspectRatio: '3/4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 12,
                          color: '#8c90a1',
                          textAlign: 'center',
                          padding: 20,
                        }}
                      >
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt="Uploaded document preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          <>
                            <Icon
                              name={claimResult.claim.status === 'verified' ? 'verified' : 'report'}
                              size={52}
                              style={{
                                color: claimResult.claim.status === 'verified' ? '#40e56c' : '#ffb4ab',
                              }}
                            />
                            <div style={{ fontSize: 13, color: '#c2c6d8', overflowWrap: 'anywhere' }}>
                              {selectedFile?.name ?? 'Uploaded document'}
                            </div>
                          </>
                        )}
                        <span style={{ fontSize: 11, color: '#8c90a1' }}>AI analysis complete</span>
                      </div>
                    </div>

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
                        { label: 'Status', value: claimResult.claim.status === 'verified' ? 'Verified' : 'Not verified', color: claimResult.claim.status === 'verified' ? '#40e56c' : '#ffb4ab' },
                        { label: 'Document ID', value: claimResult.analysis.document_id ?? 'Not detected' },
                        { label: 'Document type', value: formatDocType(claimResult.analysis.doc_type) },
                        { label: 'Country / jurisdiction', value: claimResult.analysis.country ?? 'Not found' },
                        { label: 'Institution / issuer', value: claimResult.analysis.institution ?? 'Not found' },
                        {
                          label: 'Confidence',
                          value: formatConfidence(claimResult.analysis.confidence),
                          color: getConfidenceColor(claimResult.analysis.confidence),
                        },
                      ].map(({ label, value, color }) => (
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
                          <div style={{ fontSize: 14, fontWeight: 600, color: color ?? '#dfe2eb' }}>{value}</div>
                        </div>
                      ))}
                      {claimResult.rejection_reason && (
                        <div
                          style={{
                            gridColumn: 'span 2',
                            padding: 12,
                            borderRadius: 8,
                            background: 'rgba(255,180,171,0.08)',
                            border: '1px solid rgba(255,180,171,0.3)',
                            color: '#ffb4ab',
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          {getRejectionMessage(claimResult.rejection_reason)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#8c90a1', fontSize: 14 }}>
                    Upload a document first so AI can analyse it.
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="bento">
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
                  Verification result
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    {
                      icon: claimResult?.claim.status === 'verified' ? 'person_check' : 'person_alert',
                      label: 'Name check',
                      detail: claimResult?.analysis.extracted_name
                        ? `${claimResult.analysis.extracted_name} read from document`
                        : 'Name could not be extracted',
                    },
                    {
                      icon: 'content_copy',
                      label: 'Duplicate check',
                      detail: claimResult ? 'No matching document hash found' : 'Pending document analysis',
                    },
                    {
                      icon: claimResult?.claim.status === 'verified' ? 'verified' : 'warning',
                      label: 'Document status',
                      detail: claimResult?.claim.status === 'verified'
                        ? `${formatDocType(claimResult.analysis.doc_type)} verified`
                        : claimResult?.rejection_reason
                        ? getRejectionMessage(claimResult.rejection_reason)
                        : 'Pending verification',
                    },
                  ].map(({ icon, label, detail }) => (
                    <div
                      key={label}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        background: claimResult?.claim.status === 'rejected' ? 'rgba(255,180,171,0.08)' : 'rgba(64,229,108,0.06)',
                        border: claimResult?.claim.status === 'rejected' ? '1px solid rgba(255,180,171,0.3)' : '1px solid rgba(64,229,108,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <Icon name={icon} size={22} style={{ color: claimResult?.claim.status === 'rejected' ? '#ffb4ab' : '#40e56c' }} />
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
                    {claimResult?.claim.status === 'verified' ? (
                      <>
                        Updated score: <strong style={{ color: '#40e56c' }}>{claimResult.new_score}</strong>
                      </>
                    ) : (
                      <>
                        Score unchanged: <strong style={{ color: '#ffb4ab' }}>{session?.score ?? claimResult?.new_score ?? 0}</strong>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => router.push('/dashboard')}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: 'rgba(176,198,255,0.15)',
                      border: '1px solid rgba(176,198,255,0.4)',
                      color: '#b0c6ff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="dashboard" size={16} />
                    Back to dashboard
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
          {step === 4 && (
            <div style={{ gridColumn: 'span 4' }}>
              <SummaryBar claimType={claimType} step={step} claimResult={claimResult} />
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
              if (step === 2) {
                void submitClaim()
                return
              }
              if (step === 3) {
                if (!claimResult) {
                  setError('Analyse a document before continuing.')
                  return
                }
                setError('')
                setStep(4)
                return
              }
              if (step === 4) {
                router.push('/dashboard')
                return
              }
              setError('')
              setStep((s) => Math.min(4, s + 1))
            }}
            disabled={submitting}
          >
            {step === 2 ? (submitting ? 'Analysing...' : 'Analyse with AI') : step === 4 ? 'Done' : 'Continue'}
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
