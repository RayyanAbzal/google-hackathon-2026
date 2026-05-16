'use client'

import { useEffect, useState } from 'react'
import type { ApiResponse, Session } from '@/types'

const SESSION_KEY = 'civictrust_session'

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as Session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function useStoredSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    queueMicrotask(() => setSession(readSession()))
  }, [])

  return session
}

export function getInitials(name?: string | null): string {
  if (!name) return 'CT'
  const words = name.replace(/^Dr\.\s+/i, '').trim().split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('')
  return initials || 'CT'
}

export function getDisplayFirstName(name?: string | null): string {
  if (!name) return 'there'
  const cleaned = name.replace(/^Dr\.\s+/i, '').trim()
  return cleaned.split(/\s+/)[0] || 'there'
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function requireSession(router: { replace: (href: string) => void }): Session | null {
  const session = readSession()
  if (!session) router.replace('/login')
  return session
}

export function updateStoredSession(patch: Partial<Session>): Session | null {
  const current = readSession()
  if (!current) return null
  const next = { ...current, ...patch }
  saveSession(next)
  return next
}

function userIdAuthHeaders(session: Session): HeadersInit {
  return { Authorization: `Bearer ${session.user_id}` }
}

function tokenAuthHeaders(session: Session): HeadersInit {
  return { Authorization: `Bearer ${session.token}` }
}

export async function protectedFetch<T>(
  url: string,
  session: Session,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.token}`)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...init, headers })
  return await response.json() as ApiResponse<T>
}

export function getRequiredAuthHeaders(session: Session): HeadersInit {
  return tokenAuthHeaders(session)
}

export function getCurrentBackendAuthHeaders(session: Session): HeadersInit {
  return tokenAuthHeaders(session)
}
