# Pages — Owner: Maalav

## Priority order (build top to bottom — nothing works without auth)

1. `(auth)/register/page.tsx` — 3-step form, calls POST /api/auth/register
2. `(auth)/login/page.tsx` — node ID + PIN, calls POST /api/auth/login
3. `profile/[username]/page.tsx` — protected, realtime score updates
4. `map/page.tsx` — protected, embeds Ray's HeatMap + SkillPin
5. `find/page.tsx` — public Yellow Pages
6. `help/page.tsx` — protected, HelpPostForm + HelpPostCards
7. `page.tsx` (landing) — do last

## Session handling (copy-paste this into every protected page)

```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@/types'

// Inside the component:
const router = useRouter()
useEffect(() => {
  const raw = localStorage.getItem('civictrust_session')
  if (!raw) { router.replace('/login'); return }
  const session: Session = JSON.parse(raw)
  // use session.node_id, session.score, session.tier, etc.
}, [router])
```

## Navigation

- Shared navbar: Logo | Map | Find | Help | Profile
- "Login / Register" if no session, "Profile" if logged in
- Build this once, use it on every page

## Import rules

- All types from `src/types/index.ts`
- Components from `src/components/` — Hemish builds these, import by name
- Realtime: `subscribeToUserScore` from `src/lib/realtime.ts`
- API calls: fetch to `/api/...` routes — Aryan + Tao build these

## Dependency chain

- Auth pages (register/login) — needs Aryan's routes working
- Profile page — needs Hemish's ProfileCard + ClaimCard + VouchQR
- Map page — needs Ray's HeatMap + SkillPin components
- Find/Help pages — needs Tao's find/help routes
