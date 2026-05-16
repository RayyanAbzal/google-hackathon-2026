'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Icon from '@/components/civic/Icon'

interface DocumentCameraCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  background: 'rgba(10,14,20,0.92)',
  color: '#dfe2eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(10px, 3vw, 24px)',
  overflow: 'auto',
}

export default function DocumentCameraCapture({ open, onClose, onCapture }: DocumentCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function startCamera() {
      setError('')
      setCameraReady(false)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not available in this browser.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraReady(true)
      } catch {
        setError('Could not open the camera. Check browser permission and try again.')
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setCameraReady(false)
    }
  }, [open])

  if (!open) return null

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraReady(false)
    onClose()
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is still warming up. Try again in a moment.')
      return
    }

    const canvas = document.createElement('canvas')
    const maxWidth = 1600
    const scale = Math.min(1, maxWidth / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    const context = canvas.getContext('2d')
    if (!context) {
      setError('Could not prepare the photo. Try again.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not capture the photo. Try again.')
          return
        }

        const file = new File([blob], `document-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        closeCamera()
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Take document photo">
      <div
        style={{
          width: 'min(920px, 100%)',
          maxHeight: 'min(860px, calc(100dvh - 20px))',
          background: '#10141a',
          border: '1px solid #424655',
          borderRadius: 12,
          overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: 'clamp(12px, 2vw, 16px) clamp(12px, 2.5vw, 18px)',
            borderBottom: '1px solid #424655',
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Take document photo</h2>
            <p style={{ fontSize: 12, color: '#8c90a1', margin: '4px 0 0' }}>
              Place the document inside the frame, then capture.
            </p>
          </div>
          <button className="btn-ghost" type="button" onClick={closeCamera} aria-label="Close camera">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: 'clamp(12px, 2.5vw, 18px)' }}>
          <div
            style={{
              position: 'relative',
              background: '#0a0e14',
              border: '1px solid #424655',
              borderRadius: 10,
              overflow: 'hidden',
              width: '100%',
              height: 'clamp(260px, 62dvh, 620px)',
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: error ? 'none' : 'block',
              }}
            />
            {!error && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 'min(78%, 560px)',
                  maxWidth: 'calc(100% - 32px)',
                  aspectRatio: '85.6 / 54',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid rgba(176,198,255,0.75)',
                  borderRadius: 10,
                  boxShadow: '0 0 0 999px rgba(10,14,20,0.28)',
                  pointerEvents: 'none',
                }}
              />
            )}
            {(error || !cameraReady) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 10,
                  color: error ? '#ffb4ab' : '#8c90a1',
                  textAlign: 'center',
                  padding: 24,
                }}
              >
                <Icon name={error ? 'error' : 'photo_camera'} size={34} />
                <span style={{ fontSize: 13 }}>{error || 'Opening camera...'}</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 16,
            }}
          >
            <button className="btn-ghost" type="button" onClick={closeCamera}>
              Cancel
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={capturePhoto}
              disabled={!cameraReady || Boolean(error)}
              style={{
                opacity: cameraReady && !error ? 1 : 0.55,
                cursor: cameraReady && !error ? 'pointer' : 'not-allowed',
              }}
            >
              <Icon name="photo_camera" size={16} />
              Capture photo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
