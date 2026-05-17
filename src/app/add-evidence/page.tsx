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
  if (typeof value !== 'number') return '#6a6a70'
  if (value >= 0.75) return '#00b860'
  if (value >= 0.5) return '#cc7700'
  return '#ff2d4a'
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
      ? { background: '#00b860', color: '#f5f5f5', border: '1px solid #00b860' }
      : status === 'active'
      ? { background: 'rgba(160,0,32,0.15)', color: '#a00020', border: '1px solid #a00020' }
      : { background: 'transparent', color: '#6a6a70', border: '1px solid #28282c' }
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
          { label: 'Points if verified', value: `+${CLAIM_TYPE_POINTS[claimType]}`, valueColor: '#00b860' },
          { label: 'Review', value: claimResult ? 'AI complete' : '~2 hours' },
        ].map(({ label, value, valueColor }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <dt style={{ color: '#6a6a70' }}>{label}</dt>
            <dd style={{ fontWeight: 600, color: valueColor ?? '#d2d2d6', margin: 0 }}>{value}</dd>
          </div>
        ))}
      </dl>
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(160,0,32,0.07)',
          border: '1px solid rgba(160,0,32,0.2)',
          fontSize: 12,
          color: '#6a6a70',
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
  const [identityDocType, setIdentityDocType] = useState<'passport' | 'driving_licence'>('passport')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileBack, setSelectedFileBack] = useState<File | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraBackOpen, setCameraBackOpen] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileBackRef = useRef<HTMLInputElement>(null)

  const isIdentity = claimType === 'Identity' && identityDocType === 'driving_licence'

  const previewUrl = useMemo(
    () => selectedFile?.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null,
    [selectedFile]
  )
  const previewUrlBack = useMemo(
    () => selectedFileBack?.type.startsWith('image/') ? URL.createObjectURL(selectedFileBack) : null,
    [selectedFileBack]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewUrlBack) URL.revokeObjectURL(previewUrlBack)
    }
  }, [previewUrlBack])

  useEffect(() => {
    queueMicrotask(() => setSession(requireSession(router)))
  }, [router])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
    setClaimResult(null)
    setError('')
    setStatusMessage(e.target.files?.[0] ? 'Front document ready.' : '')
  }

  function handleFileBack(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFileBack(e.target.files?.[0] ?? null)
    setClaimResult(null)
    setError('')
  }

  function handleCameraCapture(file: File) {
    setSelectedFile(file)
    setClaimResult(null)
    setError('')
    setStatusMessage('Photo captured and ready for review.')
  }

  function handleCameraBackCapture(file: File) {
    setSelectedFileBack(file)
    setClaimResult(null)
    setError('')
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setClaimResult(null)
    setStatusMessage('')
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeSelectedFileBack() {
    setSelectedFileBack(null)
    setClaimResult(null)
    setError('')
    if (fileBackRef.current) fileBackRef.current.value = ''
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

  function getEffectiveDocType(): string {
    if (claimType === 'Identity') return identityDocType
    return CLAIM_TYPE_TO_DOC[claimType]
  }

  async function submitClaim() {
    if (!session) return
    if (!selectedFile) {
      setError('Choose a document before submitting.')
      setStep(2)
      return
    }
    if (isIdentity && !selectedFileBack) {
      setError("Upload the back of your driver's licence too.")
      setStep(2)
      return
    }

    setSubmitting(true)
    setError('')
    setClaimResult(null)
    setStatusMessage('AI is analysing your document...')

    try {
      const imageBase64 = await fileToBase64(selectedFile)
      const imageBase64Back = selectedFileBack ? await fileToBase64(selectedFileBack) : undefined
      const docType = getEffectiveDocType()
      const json = await protectedFetch<ClaimResult>('/api/claims', session, {
        method: 'POST',
        body: JSON.stringify({
          type: CLAIM_TYPE_TO_API[claimType],
          doc_type: docType,
          image_base64: imageBase64,
          mime_type: selectedFile.type || 'image/jpeg',
          ...(imageBase64Back ? { image_base64_back: imageBase64Back, mime_type_back: selectedFileBack?.type || 'image/jpeg' } : {}),
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
    <div style={{ background: '#070708', minHeight: '100vh', color: '#d2d2d6' }}>
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
              color: '#6a6a70',
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
                      color: status === 'active' ? '#d2d2d6' : status === 'done' ? '#6a6a70' : '#6a6a70',
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
                          border: `1px solid ${isActive ? '#a00020' : '#28282c'}`,
                          background: isActive ? 'rgba(160,0,32,0.1)' : '#070708',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Icon name={ct.icon} size={22} style={{ color: isActive ? '#a00020' : '#6a6a70' }} />
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#d2d2d6', marginTop: 8 }}>
                          {ct.id}
                        </div>
                        <div style={{ fontSize: 12, color: '#6a6a70', marginTop: 4 }}>{ct.desc}</div>
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

                {/* Identity sub-selector */}
                {claimType === 'Identity' && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    {(['passport', 'driving_licence'] as const).map((dt) => {
                      const isActive = identityDocType === dt
                      return (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => {
                            setIdentityDocType(dt)
                            setSelectedFile(null)
                            setSelectedFileBack(null)
                            setError('')
                            setStatusMessage('')
                            if (fileRef.current) fileRef.current.value = ''
                            if (fileBackRef.current) fileBackRef.current.value = ''
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: `1px solid ${isActive ? '#a00020' : '#28282c'}`,
                            background: isActive ? 'rgba(160,0,32,0.1)' : '#070708',
                            color: isActive ? '#a00020' : '#6a6a70',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {dt === 'passport' ? 'Passport' : "Driver's licence"}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Upload zone(s) */}
                <div style={{ display: 'grid', gridTemplateColumns: isIdentity ? '1fr 1fr' : '1fr', gap: 16 }}>
                  {/* Front / single upload */}
                  <div>
                    {isIdentity && (
                      <div style={{ fontSize: 12, color: '#6a6a70', marginBottom: 8, fontWeight: 600 }}>
                        Front of licence
                      </div>
                    )}
                    <div
                      style={{
                        border: '1.5px dashed #28282c',
                        borderRadius: 12,
                        padding: 32,
                        textAlign: 'center',
                      }}
                    >
                      <Icon name="cloud_upload" size={36} style={{ color: '#28282c', marginBottom: 10 }} />
                      <div style={{ fontSize: 13, color: '#6a6a70', marginBottom: 14 }}>Drag a file here</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setCameraOpen(true)}>
                          <Icon name="photo_camera" size={14} />
                          Camera
                        </button>
                        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => fileRef.current?.click()}>
                          <Icon name="folder_open" size={14} />
                          Choose file
                        </button>
                        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
                      </div>
                      {selectedFile && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            maxWidth: '100%',
                            marginTop: 12,
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: 'rgba(0,184,96,0.06)',
                            border: '1px solid rgba(0,184,96,0.25)',
                            color: '#00b860',
                            fontSize: 11,
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            aria-label="Remove front document"
                            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid rgba(255,45,74,0.3)', background: 'rgba(255,45,74,0.08)', color: '#ff2d4a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back upload — passport only */}
                  {isIdentity && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6a6a70', marginBottom: 8, fontWeight: 600 }}>
                        Back of licence
                      </div>
                      <div
                        style={{
                          border: '1.5px dashed #28282c',
                          borderRadius: 12,
                          padding: 32,
                          textAlign: 'center',
                        }}
                      >
                        <Icon name="flip" size={36} style={{ color: '#28282c', marginBottom: 10 }} />
                        <div style={{ fontSize: 13, color: '#6a6a70', marginBottom: 14 }}>Back of passport</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setCameraBackOpen(true)}>
                            <Icon name="photo_camera" size={14} />
                            Camera
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => fileBackRef.current?.click()}>
                            <Icon name="folder_open" size={14} />
                            Choose file
                          </button>
                          <input ref={fileBackRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileBack} />
                        </div>
                        {selectedFileBack && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              maxWidth: '100%',
                              marginTop: 12,
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: 'rgba(0,184,96,0.06)',
                              border: '1px solid rgba(0,184,96,0.25)',
                              color: '#00b860',
                              fontSize: 11,
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFileBack.name}</span>
                            <button
                              type="button"
                              onClick={removeSelectedFileBack}
                              aria-label="Remove back document"
                              style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid rgba(255,45,74,0.3)', background: 'rgba(255,45,74,0.08)', color: '#ff2d4a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              <Icon name="close" size={14} />
                            </button>
                          </div>
                        )}
                      </div>
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
                          background: '#070708',
                          border: '1px solid #28282c',
                          aspectRatio: '3/4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 12,
                          color: '#6a6a70',
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
                                color: claimResult.claim.status === 'verified' ? '#00b860' : '#ff2d4a',
                              }}
                            />
                            <div style={{ fontSize: 13, color: '#d2d2d6', overflowWrap: 'anywhere' }}>
                              {selectedFile?.name ?? 'Uploaded document'}
                            </div>
                          </>
                        )}
                        <span style={{ fontSize: 11, color: '#6a6a70' }}>AI analysis complete</span>
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
                        { label: 'Status', value: claimResult.claim.status === 'verified' ? 'Verified' : 'Not verified', color: claimResult.claim.status === 'verified' ? '#00b860' : '#ff2d4a' },
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
                            background: '#070708',
                            border: '1px solid #28282c',
                          }}
                        >
                          <div style={{ fontSize: 11, color: '#6a6a70', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: color ?? '#d2d2d6' }}>{value}</div>
                        </div>
                      ))}
                      {claimResult.rejection_reason && (
                        <div
                          style={{
                            gridColumn: 'span 2',
                            padding: 12,
                            borderRadius: 8,
                            background: 'rgba(255,45,74,0.08)',
                            border: '1px solid rgba(255,45,74,0.3)',
                            color: '#ff2d4a',
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
                  <div style={{ color: '#6a6a70', fontSize: 14 }}>
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
                        background: claimResult?.claim.status === 'rejected' ? 'rgba(255,45,74,0.08)' : 'rgba(0,184,96,0.06)',
                        border: claimResult?.claim.status === 'rejected' ? '1px solid rgba(255,45,74,0.3)' : '1px solid rgba(0,184,96,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <Icon name={icon} size={22} style={{ color: claimResult?.claim.status === 'rejected' ? '#ff2d4a' : '#00b860' }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#d2d2d6' }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#6a6a70' }}>{detail}</div>
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
                    background: '#070708',
                    border: '1px solid #28282c',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#d2d2d6' }}>
                    {claimResult?.claim.status === 'verified' ? (
                      <>
                        Updated score: <strong style={{ color: '#00b860' }}>{claimResult.new_score}</strong>
                      </>
                    ) : (
                      <>
                        Score unchanged: <strong style={{ color: '#ff2d4a' }}>{session?.score ?? claimResult?.new_score ?? 0}</strong>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => router.push('/dashboard')}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: 'rgba(160,0,32,0.15)',
                      border: '1px solid rgba(160,0,32,0.4)',
                      color: '#a00020',
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
                  <p style={{ fontSize: 13, color: error ? '#ff2d4a' : '#00b860', margin: '14px 0 0' }}>
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
          <p style={{ fontSize: 13, color: error ? '#ff2d4a' : '#00b860', margin: '16px 0 0' }}>
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
            borderTop: '1px solid #28282c',
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
          <span style={{ fontSize: 13, color: '#6a6a70' }}>Step {step} of 4</span>
          <button
            className="btn-solid-primary"
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
      <DocumentCameraCapture
        open={cameraBackOpen}
        onClose={() => setCameraBackOpen(false)}
        onCapture={handleCameraBackCapture}
      />
    </div>
  )
}
